const jwt = require('jsonwebtoken');
const db = require('./pg');
const { paginatedResponse } = require('./pagination');
const { canDeleteUser } = require('./roles');

const STAFF = ['ADMIN', 'SUPER_ADMIN'];

function isStaff(role) {
  return STAFF.includes(role);
}

async function requireUser(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: { status: 401, body: { error: 'Authentication required' } } };
  }
  try {
    const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
    const { rows } = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = $1 LIMIT 1',
      [payload.userId]
    );
    if (!rows[0]) {
      return { error: { status: 401, body: { error: 'User not found' } } };
    }
    return { user: rows[0] };
  } catch {
    return { error: { status: 401, body: { error: 'Invalid or expired token' } } };
  }
}

function parsePage(query, defaultLimit = 20) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

async function adminFlashcards(query) {
  const { page, limit, skip } = parsePage(query, 20);
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  const pattern = search ? `%${search}%` : null;

  const where = pattern
    ? `WHERE f.question ILIKE $1 OR f.answer ILIKE $1 OR t.name ILIKE $1 OR s.name ILIKE $1`
    : '';
  const params = pattern ? [pattern] : [];

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM flashcards f
    JOIN topics t ON f.topic_id = t.id
    JOIN subjects s ON t.subject_id = s.id
    ${where}`;
  const listSql = `
    SELECT f.id, f.question_type AS "questionType", f.question, f.answer,
           f.distractor_1 AS "distractor1", f.distractor_2 AS "distractor2",
           f.distractor_3 AS "distractor3", f.difficulty,
           t.id AS "topicId", t.name AS "topicName",
           s.id AS "subjectId", s.name AS "subjectName"
    FROM flashcards f
    JOIN topics t ON f.topic_id = t.id
    JOIN subjects s ON t.subject_id = s.id
    ${where}
    ORDER BY s.name ASC, t.name ASC, f.question ASC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  const countRes = await db.query(countSql, params);
  const listRes = await db.query(listSql, [...params, limit, skip]);
  const total = countRes.rows[0]?.total ?? 0;

  return {
    status: 200,
    body: paginatedResponse(listRes.rows, total, { page, limit }),
  };
}

async function adminSubjects() {
  const { rows } = await db.query(`
    SELECT s.id, s.name,
           t.id AS topic_id, t.name AS topic_name,
           (SELECT COUNT(*)::int FROM flashcards WHERE topic_id = t.id) AS card_count
    FROM subjects s
    LEFT JOIN topics t ON t.subject_id = s.id
    ORDER BY s.name ASC, t.name ASC NULLS LAST
  `);

  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, {
        id: row.id,
        name: row.name,
        topicCount: 0,
        cardCount: 0,
        topics: [],
      });
    }
    const subject = map.get(row.id);
    if (row.topic_id) {
      subject.topicCount += 1;
      subject.cardCount += row.card_count || 0;
      subject.topics.push({
        id: row.topic_id,
        name: row.topic_name,
        subjectId: row.id,
        cardCount: row.card_count || 0,
      });
    }
  }

  return { status: 200, body: Array.from(map.values()) };
}

async function adminUsers(query) {
  const { page, limit, skip } = parsePage(query, 15);
  const [countRes, listRes] = await Promise.all([
    db.query('SELECT COUNT(*)::int AS total FROM users'),
    db.query(
      `SELECT id, name, email, role, created_at AS "createdAt"
       FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, skip]
    ),
  ]);
  const total = countRes.rows[0]?.total ?? 0;
  return {
    status: 200,
    body: paginatedResponse(listRes.rows, total, { page, limit }),
  };
}

function parseAdminUserId(path) {
  const m = path.match(/(?:\/api)?\/admin\/users\/([^/?]+)$/);
  return m ? m[1] : null;
}

async function deleteAdminUser(actor, targetId) {
  const { rows } = await db.query(
    'SELECT id, role FROM users WHERE id = $1 LIMIT 1',
    [targetId]
  );
  const existing = rows[0];
  if (!existing) {
    return { status: 404, body: { error: 'User not found' } };
  }

  if (!canDeleteUser(actor, existing)) {
    const message =
      targetId === actor.id
        ? 'You cannot delete your own account while logged in'
        : 'You cannot delete this user';
    return { status: 403, body: { error: message } };
  }

  if (existing.role === 'SUPER_ADMIN') {
    const countRes = await db.query(
      `SELECT COUNT(*)::int AS total FROM users WHERE role = 'SUPER_ADMIN' AND id <> $1`,
      [targetId]
    );
    if ((countRes.rows[0]?.total ?? 0) === 0) {
      return { status: 400, body: { error: 'Cannot delete the last super admin' } };
    }
  }

  await db.query('DELETE FROM users WHERE id = $1', [targetId]);
  return { status: 200, body: { message: 'User deleted' } };
}

async function dashboardSubjects(user) {
  let subjectIds = null;
  if (!isStaff(user.role)) {
    const enrolled = await db.query(
      'SELECT subject_id FROM user_subjects WHERE user_id = $1',
      [user.id]
    );
    subjectIds = enrolled.rows.map((r) => r.subject_id);
    if (subjectIds.length === 0) return { status: 200, body: [] };
  }

  const subjectsRes = subjectIds
    ? await db.query(
        `SELECT id, name FROM subjects WHERE id = ANY($1::text[]) ORDER BY name ASC`,
        [subjectIds]
      )
    : await db.query('SELECT id, name FROM subjects ORDER BY name ASC');

  if (subjectsRes.rows.length === 0) return { status: 200, body: [] };

  const ids = subjectsRes.rows.map((s) => s.id);

  const [topicsRes, cardsRes, masteredRes, topicCountsRes] = await Promise.all([
    db.query(
      'SELECT id, subject_id FROM topics WHERE subject_id = ANY($1::text[])',
      [ids]
    ),
    db.query(
      `SELECT t.subject_id, COUNT(f.id)::int AS cards
       FROM flashcards f JOIN topics t ON f.topic_id = t.id
       WHERE t.subject_id = ANY($1::text[])
       GROUP BY t.subject_id`,
      [ids]
    ),
    db.query(
      `SELECT t.subject_id, COUNT(up.id)::int AS mastered
       FROM user_progress up
       JOIN flashcards f ON up.flashcard_id = f.id
       JOIN topics t ON f.topic_id = t.id
       WHERE up.user_id = $1 AND up.status = 'GOT_IT' AND t.subject_id = ANY($2::text[])
       GROUP BY t.subject_id`,
      [user.id, ids]
    ),
    db.query(
      `SELECT subject_id, COUNT(*)::int AS cnt FROM topics WHERE subject_id = ANY($1::text[]) GROUP BY subject_id`,
      [ids]
    ),
  ]);

  const cardsBySubject = new Map(cardsRes.rows.map((r) => [r.subject_id, r.cards]));
  const masteredBySubject = new Map(masteredRes.rows.map((r) => [r.subject_id, r.mastered]));
  const topicCountBySubject = new Map(topicCountsRes.rows.map((r) => [r.subject_id, r.cnt]));

  return {
    status: 200,
    body: subjectsRes.rows.map((s) => {
      const totalCards = cardsBySubject.get(s.id) || 0;
      const mastered = masteredBySubject.get(s.id) || 0;
      return {
        id: s.id,
        name: s.name,
        topicCount: topicCountBySubject.get(s.id) || 0,
        totalCards,
        mastered,
        progressPercent: totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0,
      };
    }),
  };
}

async function profile(user, query) {
  const { page, limit, skip } = parsePage(query, 10);

  const [userRes, statsRes, practiceRes, topicsRes] = await Promise.all([
    db.query(
      'SELECT id, name, email, role, created_at AS "createdAt" FROM users WHERE id = $1',
      [user.id]
    ),
    db.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'GOT_IT')::int AS mastered,
         COUNT(*) FILTER (WHERE status = 'NEEDS_PRACTICE')::int AS needs_practice
       FROM user_progress WHERE user_id = $1`,
      [user.id]
    ),
    db.query(
      'SELECT date FROM user_daily_practice WHERE user_id = $1 ORDER BY date DESC',
      [user.id]
    ),
    db.query(
      `SELECT t.id, t.name, t.subject_id AS "subjectId", s.name AS "subjectName",
              COUNT(*) FILTER (WHERE up.status = 'GOT_IT')::int AS mastered,
              COUNT(*) FILTER (WHERE up.status = 'NEEDS_PRACTICE')::int AS "needsPractice",
              COUNT(up.id)::int AS "totalReviewed",
              (SELECT COUNT(*)::int FROM flashcards WHERE topic_id = t.id) AS "totalCards"
       FROM user_progress up
       JOIN flashcards f ON up.flashcard_id = f.id
       JOIN topics t ON f.topic_id = t.id
       JOIN subjects s ON t.subject_id = s.id
       WHERE up.user_id = $1
       GROUP BY t.id, t.name, t.subject_id, s.name
       ORDER BY s.name, t.name`,
      [user.id]
    ),
  ]);

  const stats = statsRes.rows[0] || { total: 0, mastered: 0, needs_practice: 0 };
  const dates = practiceRes.rows.map((r) => new Date(r.date));
  const dateSet = new Set(dates.map((d) => d.toISOString().slice(0, 10)));

  let streak = 0;
  const today = new Date();
  const cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getMonth(), today.getUTCDate()));
  while (dateSet.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const streakDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getMonth(), today.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    streakDays.push({ date: key, practiced: dateSet.has(key) });
  }

  const allTopics = topicsRes.rows;
  const topicPage = paginatedResponse(allTopics.slice(skip, skip + limit), allTopics.length, {
    page,
    limit,
  });

  return {
    status: 200,
    body: {
      user: userRes.rows[0],
      stats: {
        totalReviewed: stats.total,
        mastered: stats.mastered,
        needsPractice: stats.needs_practice,
        streak,
        topicsStudied: allTopics.length,
      },
      streakDays,
      topics: topicPage.items,
      topicsPagination: topicPage.pagination,
    },
  };
}

/** Returns { status, body } or null if this handler does not apply. */
async function tryHandle(method, path, query, authHeader, body = null) {
  if (method === 'POST' && match(path, '/admin/flashcards/import')) {
    const auth = await requireUser(authHeader);
    if (auth.error) return auth.error;
    if (!isStaff(auth.user.role)) {
      return { status: 403, body: { error: 'Admin access required' } };
    }
    const csv = body?.csv;
    if (!csv || typeof csv !== 'string') {
      return { status: 400, body: { error: 'CSV content is required' } };
    }
    const { getMaxCsvBytes } = require('./config');
    if (Buffer.byteLength(csv, 'utf8') > getMaxCsvBytes()) {
      return { status: 413, body: { error: 'CSV file is too large (max 2MB)' } };
    }
    try {
      const { importFlashcardsFromCsvFast } = require('./csvImportFast');
      const results = await importFlashcardsFromCsvFast(csv);
      return { status: 200, body: results };
    } catch (err) {
      return { status: 400, body: { error: err.message || 'Invalid CSV' } };
    }
  }

  if (method === 'DELETE') {
    const targetId = parseAdminUserId(path);
    if (targetId) {
      const auth = await requireUser(authHeader);
      if (auth.error) return auth.error;
      if (!isStaff(auth.user.role)) {
        return { status: 403, body: { error: 'Admin access required' } };
      }
      return deleteAdminUser(auth.user, targetId);
    }
  }

  if (method !== 'GET') return null;

  const needsAuth =
    path.includes('/admin/') ||
    path.endsWith('/subjects') ||
    path.endsWith('/profile') ||
    path.endsWith('/subjects/available');

  if (!needsAuth) return null;

  const auth = await requireUser(authHeader);
  if (auth.error) return auth.error;
  const { user } = auth;

  if (match(path, '/admin/flashcards') && !path.includes('/import') && !path.includes('/export')) {
    if (!isStaff(user.role)) return { status: 403, body: { error: 'Admin access required' } };
    return adminFlashcards(query);
  }

  if (match(path, '/admin/subjects') && !path.includes('/topics')) {
    if (!isStaff(user.role)) return { status: 403, body: { error: 'Admin access required' } };
    return adminSubjects();
  }

  if (adminUsersListPath(path)) {
    if (!isStaff(user.role)) return { status: 403, body: { error: 'Admin access required' } };
    return adminUsers(query);
  }

  const subjectsPath = path.replace(/\/$/, '');
  if (
    (subjectsPath === '/api/subjects' || subjectsPath === '/subjects') &&
    !path.includes('/catalog') &&
    !path.includes('/available')
  ) {
    return dashboardSubjects(user);
  }

  if (match(path, '/profile')) {
    return profile(user, query);
  }

  return null;
}

function match(path, suffix) {
  return path === suffix || path.endsWith(suffix);
}

function adminUsersListPath(path) {
  const normalized = path.replace(/\/$/, '');
  return normalized === '/admin/users' || normalized === '/api/admin/users';
}

module.exports = { tryHandle };
