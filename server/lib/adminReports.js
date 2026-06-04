const db = require('./pg');
const { parsePagination, paginatedResponse } = require('./pagination');
const { calculateStreakFromDateStrings } = require('./streakUtils');

const GUEST_EMAIL_PATTERN = '%@guest.memora.local';
const CSV_MAX_ROWS = 5000;

function utcToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function formatDateUTC(d) {
  return d.toISOString().slice(0, 10);
}

function parseDateRange(query) {
  const end = utcToday();
  const defaultStart = new Date(end);
  defaultStart.setUTCDate(defaultStart.getUTCDate() - 29);

  const fromStr = typeof query.from === 'string' ? query.from.slice(0, 10) : null;
  const toStr = typeof query.to === 'string' ? query.to.slice(0, 10) : null;

  const from = fromStr && /^\d{4}-\d{2}-\d{2}$/.test(fromStr) ? fromStr : formatDateUTC(defaultStart);
  const to = toStr && /^\d{4}-\d{2}-\d{2}$/.test(toStr) ? toStr : formatDateUTC(end);

  return { from, to };
}

async function getOverview(query) {
  const { from, to } = parseDateRange(query);
  const today = formatDateUTC(utcToday());

  const [
    engagementRes,
    registeredRes,
    signupsRes,
    reviewsRes,
    masteryRes,
    growthRes,
    dailyActiveRes,
    weeklySignupsRes,
  ] = await Promise.all([
    db.query(
      `SELECT
         COUNT(DISTINCT user_id) FILTER (WHERE date = $4::date)::int AS dau,
         COUNT(DISTINCT user_id) FILTER (
           WHERE date >= ($4::date - INTERVAL '6 days')::date AND date <= $4::date
         )::int AS wau,
         COUNT(DISTINCT user_id) FILTER (
           WHERE date >= $1::date AND date <= $2::date
         )::int AS mau
       FROM user_daily_practice dp
       JOIN users u ON u.id = dp.user_id
       WHERE u.email NOT LIKE $3`,
      [from, to, GUEST_EMAIL_PATTERN, today]
    ),
    db.query(
      `SELECT COUNT(*)::int AS total
       FROM users
       WHERE email NOT LIKE $1 AND deactivated_at IS NULL`,
      [GUEST_EMAIL_PATTERN]
    ),
    db.query(
      `SELECT COUNT(*)::int AS total
       FROM users
       WHERE email NOT LIKE $1
         AND created_at >= $2::date
         AND created_at < ($3::date + INTERVAL '1 day')`,
      [GUEST_EMAIL_PATTERN, from, to]
    ),
    db.query(
      `SELECT COUNT(*)::int AS total
       FROM user_progress up
       JOIN users u ON u.id = up.user_id
       WHERE u.email NOT LIKE $1
         AND up.last_reviewed >= $2::date
         AND up.last_reviewed < ($3::date + INTERVAL '1 day')`,
      [GUEST_EMAIL_PATTERN, from, to]
    ),
    db.query(
      `SELECT
         COUNT(*) FILTER (WHERE up.status = 'GOT_IT')::int AS mastered,
         COUNT(*)::int AS total
       FROM user_progress up
       JOIN users u ON u.id = up.user_id
       WHERE u.email NOT LIKE $1 AND u.deactivated_at IS NULL`,
      [GUEST_EMAIL_PATTERN]
    ),
    db.query(
      `SELECT
         COUNT(*) FILTER (
           WHERE email NOT LIKE $1
             AND created_at >= (CURRENT_DATE AT TIME ZONE 'UTC')::date - INTERVAL '6 days'
         )::int AS signups_week,
         COUNT(*) FILTER (
           WHERE email NOT LIKE $1
             AND created_at >= (CURRENT_DATE AT TIME ZONE 'UTC')::date - INTERVAL '29 days'
         )::int AS signups_month,
         COUNT(*) FILTER (
           WHERE email NOT LIKE $1 AND role = 'USER' AND email_verified_at IS NOT NULL
         )::int AS verified_users,
         COUNT(*) FILTER (
           WHERE email NOT LIKE $1 AND role = 'USER' AND email_verified_at IS NULL
         )::int AS pending_verification,
         COUNT(*) FILTER (WHERE deactivated_at IS NOT NULL)::int AS deactivated_users,
         COUNT(*) FILTER (WHERE email LIKE $1)::int AS guest_accounts
       FROM users`,
      [GUEST_EMAIL_PATTERN]
    ),
    db.query(
      `SELECT dp.date::text AS date, COUNT(DISTINCT dp.user_id)::int AS active_learners
       FROM user_daily_practice dp
       JOIN users u ON u.id = dp.user_id
       WHERE u.email NOT LIKE $1 AND dp.date >= $2::date AND dp.date <= $3::date
       GROUP BY dp.date
       ORDER BY dp.date ASC`,
      [GUEST_EMAIL_PATTERN, from, to]
    ),
    db.query(
      `SELECT date_trunc('week', created_at)::date::text AS week,
              COUNT(*)::int AS signups
       FROM users
       WHERE email NOT LIKE $1
         AND created_at >= $2::date
         AND created_at < ($3::date + INTERVAL '1 day')
       GROUP BY 1
       ORDER BY 1 ASC`,
      [GUEST_EMAIL_PATTERN, from, to]
    ),
  ]);

  const engagement = engagementRes.rows[0] || { dau: 0, wau: 0, mau: 0 };
  const mastery = masteryRes.rows[0] || { mastered: 0, total: 0 };
  const growth = growthRes.rows[0] || {};

  return {
    range: { from, to },
    kpis: {
      dau: engagement.dau,
      wau: engagement.wau,
      mau: engagement.mau,
      registeredActive: registeredRes.rows[0]?.total ?? 0,
      newSignups: signupsRes.rows[0]?.total ?? 0,
      cardsReviewedInRange: reviewsRes.rows[0]?.total ?? 0,
      avgMasteryPercent:
        mastery.total > 0 ? Math.round((mastery.mastered / mastery.total) * 100) : 0,
    },
    growth: {
      signupsThisWeek: growth.signups_week ?? 0,
      signupsThisMonth: growth.signups_month ?? 0,
      verifiedUsers: growth.verified_users ?? 0,
      pendingVerification: growth.pending_verification ?? 0,
      deactivatedUsers: growth.deactivated_users ?? 0,
      guestAccounts: growth.guest_accounts ?? 0,
    },
    series: {
      dailyActive: dailyActiveRes.rows,
      weeklySignups: weeklySignupsRes.rows,
    },
  };
}

async function fetchLearnerRows({ role, includeInactive, inactiveDays, page, limit, skip, forCsv }) {
  const roleFilter = role === 'ALL' ? 'ALL' : role || 'USER';
  const includeDeactivated = includeInactive === 'true' || includeInactive === '1';

  const whereParts = ['u.email NOT LIKE $1'];
  const params = [GUEST_EMAIL_PATTERN];
  let idx = 2;

  if (roleFilter !== 'ALL') {
    whereParts.push(`u.role = $${idx}`);
    params.push(roleFilter);
    idx += 1;
  }

  if (!includeDeactivated) {
    whereParts.push('u.deactivated_at IS NULL');
  }

  if (inactiveDays) {
    const days = parseInt(inactiveDays, 10);
    if ([7, 14, 30].includes(days)) {
      whereParts.push(`(
        NOT EXISTS (SELECT 1 FROM user_daily_practice dp WHERE dp.user_id = u.id)
        OR (SELECT MAX(dp.date) FROM user_daily_practice dp WHERE dp.user_id = u.id)
           < (CURRENT_DATE AT TIME ZONE 'UTC')::date - $${idx}::int
      )`);
      params.push(days);
      idx += 1;
    }
  }

  const whereSql = whereParts.join(' AND ');

  const countRes = await db.query(
    `SELECT COUNT(*)::int AS total FROM users u WHERE ${whereSql}`,
    params
  );
  const total = countRes.rows[0]?.total ?? 0;

  const selectSql = `SELECT
       u.id,
       u.name,
       u.email,
       u.role,
       u.created_at AS "createdAt",
       (u.deactivated_at IS NULL) AS active,
       (u.email_verified_at IS NOT NULL OR u.role IN ('ADMIN', 'SUPER_ADMIN')) AS "emailVerified",
       (SELECT COUNT(*)::int FROM user_subjects us WHERE us.user_id = u.id) AS "enrolledSubjects",
       COALESCE(ps.mastered, 0) AS mastered,
       COALESCE(ps.needs_practice, 0) AS "needsPractice",
       ps.last_practiced AS "lastPracticed",
       COALESCE(ps.practice_dates, ARRAY[]::text[]) AS "practiceDates"
     FROM users u
     LEFT JOIN LATERAL (
       SELECT
         COUNT(*) FILTER (WHERE up.status = 'GOT_IT')::int AS mastered,
         COUNT(*) FILTER (WHERE up.status = 'NEEDS_PRACTICE')::int AS needs_practice,
         (SELECT MAX(dp.date) FROM user_daily_practice dp WHERE dp.user_id = u.id) AS last_practiced,
         ARRAY(
           SELECT dp.date::text FROM user_daily_practice dp WHERE dp.user_id = u.id ORDER BY dp.date
         ) AS practice_dates
       FROM user_progress up
       WHERE up.user_id = u.id
     ) ps ON true
     WHERE ${whereSql}
     ORDER BY u.created_at DESC`;

  const listRes = forCsv
    ? await db.query(`${selectSql} LIMIT ${CSV_MAX_ROWS}`, params)
    : await db.query(`${selectSql} LIMIT $${idx} OFFSET $${idx + 1}`, [...params, limit, skip]);

  return {
    total,
    rows: listRes.rows.map((row) => {
      const reviewed = row.mastered + row.needsPractice;
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        createdAt: row.createdAt,
        active: row.active,
        emailVerified: row.emailVerified,
        enrolledSubjects: row.enrolledSubjects,
        mastered: row.mastered,
        needsPractice: row.needsPractice,
        masteryPercent: reviewed > 0 ? Math.round((row.mastered / reviewed) * 100) : 0,
        streak: calculateStreakFromDateStrings(row.practiceDates),
        lastPracticed: row.lastPracticed,
      };
    }),
  };
}

function learnersToCsv(rows) {
  const header = [
    'Name',
    'Email',
    'Role',
    'Active',
    'Email Verified',
    'Enrolled Subjects',
    'Mastered',
    'Needs Practice',
    'Mastery %',
    'Streak',
    'Last Practiced',
    'Registered',
  ];
  const lines = [header.join(',')];
  for (const r of rows) {
    const cols = [
      `"${String(r.name).replace(/"/g, '""')}"`,
      `"${String(r.email).replace(/"/g, '""')}"`,
      r.role,
      r.active ? 'yes' : 'no',
      r.emailVerified ? 'yes' : 'no',
      r.enrolledSubjects,
      r.mastered,
      r.needsPractice,
      r.masteryPercent,
      r.streak,
      r.lastPracticed ? formatDateUTC(new Date(r.lastPracticed)) : '',
      r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : '',
    ];
    lines.push(cols.join(','));
  }
  return lines.join('\n');
}

async function getLearners(query) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });
  const forCsv = query.format === 'csv';

  const { total, rows } = await fetchLearnerRows({
    role: query.role,
    includeInactive: query.includeInactive,
    inactiveDays: query.inactiveDays,
    page,
    limit,
    skip,
    forCsv,
  });

  if (forCsv) {
    return {
      csv: learnersToCsv(rows),
      filename: `memora-learners-${formatDateUTC(utcToday())}.csv`,
    };
  }

  return paginatedResponse(rows, total, { page, limit });
}

async function getContent() {
  const [subjectsRes, topicsRes] = await Promise.all([
    db.query(
      `SELECT
         s.id,
         s.name,
         COUNT(DISTINCT t.id)::int AS "topicCount",
         COUNT(f.id)::int AS "cardCount",
         (SELECT COUNT(DISTINCT us.user_id)::int
          FROM user_subjects us
          JOIN users u ON u.id = us.user_id
          WHERE us.subject_id = s.id AND u.email NOT LIKE $1) AS "enrolledLearners",
         COUNT(DISTINCT CASE WHEN u.email NOT LIKE $1 THEN up.user_id END)::int AS "learnersWithProgress",
         COUNT(up.id) FILTER (WHERE up.status = 'GOT_IT' AND u.email NOT LIKE $1)::int AS mastered,
         COUNT(up.id) FILTER (WHERE up.status = 'NEEDS_PRACTICE' AND u.email NOT LIKE $1)::int AS "needsPractice"
       FROM subjects s
       LEFT JOIN topics t ON t.subject_id = s.id
       LEFT JOIN flashcards f ON f.topic_id = t.id
       LEFT JOIN user_progress up ON up.flashcard_id = f.id
       LEFT JOIN users u ON u.id = up.user_id
       GROUP BY s.id, s.name
       ORDER BY s.name ASC`,
      [GUEST_EMAIL_PATTERN]
    ),
    db.query(
      `SELECT
         t.id,
         t.subject_id AS "subjectId",
         s.name AS "subjectName",
         t.name,
         COUNT(f.id)::int AS "cardCount",
         (SELECT COUNT(DISTINCT us.user_id)::int
          FROM user_subjects us
          JOIN users u ON u.id = us.user_id
          WHERE us.subject_id = t.subject_id AND u.email NOT LIKE $1) AS "enrolledLearners",
         COUNT(DISTINCT CASE WHEN u.email NOT LIKE $1 THEN up.user_id END)::int AS "learnersWithProgress",
         COUNT(up.id) FILTER (WHERE up.status = 'GOT_IT' AND u.email NOT LIKE $1)::int AS mastered,
         COUNT(up.id) FILTER (WHERE up.status = 'NEEDS_PRACTICE' AND u.email NOT LIKE $1)::int AS "needsPractice"
       FROM topics t
       JOIN subjects s ON s.id = t.subject_id
       LEFT JOIN flashcards f ON f.topic_id = t.id
       LEFT JOIN user_progress up ON up.flashcard_id = f.id
       LEFT JOIN users u ON u.id = up.user_id
       GROUP BY t.id, t.subject_id, s.name, t.name
       ORDER BY s.name ASC, t.name ASC`,
      [GUEST_EMAIL_PATTERN]
    ),
  ]);

  const mapRow = (row) => {
    const reviewed = row.mastered + row.needsPractice;
    return {
      ...row,
      avgMasteryPercent: reviewed > 0 ? Math.round((row.mastered / reviewed) * 100) : 0,
      unused:
        row.enrolledLearners > 0 && row.learnersWithProgress === 0,
      struggling: reviewed > 0 && Math.round((row.mastered / reviewed) * 100) < 50,
    };
  };

  const topicsBySubject = new Map();
  for (const topic of topicsRes.rows.map(mapRow)) {
    if (!topicsBySubject.has(topic.subjectId)) {
      topicsBySubject.set(topic.subjectId, []);
    }
    topicsBySubject.get(topic.subjectId).push(topic);
  }

  const subjects = subjectsRes.rows.map((s) => {
    const mapped = mapRow(s);
    return {
      ...mapped,
      topics: topicsBySubject.get(s.id) || [],
    };
  });

  const insights = {
    unusedTopics: topicsRes.rows
      .filter((t) => t.enrolledLearners > 0 && t.learnersWithProgress === 0)
      .slice(0, 5)
      .map((t) => ({
        subjectName: t.subjectName,
        topicName: t.name,
        enrolledLearners: t.enrolledLearners,
      })),
    lowMasteryTopics: topicsRes.rows
      .map(mapRow)
      .filter((t) => t.mastered + t.needsPractice > 0)
      .sort((a, b) => a.avgMasteryPercent - b.avgMasteryPercent)
      .slice(0, 5)
      .map((t) => ({
        subjectName: t.subjectName,
        topicName: t.name,
        avgMasteryPercent: t.avgMasteryPercent,
        needsPractice: t.needsPractice,
      })),
  };

  return { subjects, insights };
}

module.exports = {
  parseDateRange,
  getOverview,
  getLearners,
  getContent,
  learnersToCsv,
  GUEST_EMAIL_PATTERN,
};
