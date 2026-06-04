const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./pg');
const { paginatedResponse } = require('./pagination');
const {
  canAssignRole,
  canEditUser,
  assertRoleChangeAllowed,
} = require('./roles');
const {
  USER_PUBLIC_COLUMNS,
  isEmailVerified,
  isUserActive,
  publicUser,
  deactivatedAccountResponse,
  verificationRequiredResponse,
} = require('./authUser');
const { deactivateUser, reactivateUser } = require('./userLifecycle');
const { parseUserGroupFilter } = require('./adminUserFilters');

const VALID_ROLES = ['USER', 'ADMIN', 'SUPER_ADMIN'];

const STAFF = ['ADMIN', 'SUPER_ADMIN'];

function isStaff(role) {
  return STAFF.includes(role);
}

async function requireUser(authHeader, { requireVerified = false } = {}) {
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: { status: 401, body: { error: 'Authentication required' } } };
  }
  try {
    const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
    const { rows } = await db.query(
      `SELECT ${USER_PUBLIC_COLUMNS} FROM users WHERE id = $1 LIMIT 1`,
      [payload.userId]
    );
    if (!rows[0]) {
      return { error: { status: 401, body: { error: 'User not found' } } };
    }
    if (!isUserActive(rows[0])) {
      return { error: deactivatedAccountResponse() };
    }
    if (requireVerified && !isEmailVerified(rows[0])) {
      return { error: verificationRequiredResponse() };
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

const GUEST_EMAIL_PATTERN = '%@guest.memora.local';

async function adminUsers(query) {
  const { page, limit, skip } = parsePage(query, 15);
  const includeInactive = query.includeInactive === 'true' || query.includeInactive === '1';
  const activeFilter = includeInactive ? '' : ' AND deactivated_at IS NULL';
  const roleFilter = parseUserGroupFilter(query).sql;
  const [countRes, listRes] = await Promise.all([
    db.query(
      `SELECT COUNT(*)::int AS total FROM users WHERE email NOT LIKE $1${activeFilter}${roleFilter}`,
      [GUEST_EMAIL_PATTERN]
    ),
    db.query(
      `SELECT id, name, email, role, created_at AS "createdAt",
              (email_verified_at IS NOT NULL) AS "emailVerified",
              (deactivated_at IS NULL) AS "active"
       FROM users WHERE email NOT LIKE $3${activeFilter}${roleFilter}
       ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, skip, GUEST_EMAIL_PATTERN]
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

function parseSubjectTopicsPath(path) {
  const m = path.match(/(?:\/api)?\/subjects\/([^/]+)\/topics$/);
  return m ? m[1] : null;
}

function parseTopicFlashcardsPath(path) {
  const m = path.match(/(?:\/api)?\/topics\/([^/]+)\/flashcards$/);
  return m ? m[1] : null;
}

function validateUserPayload(body, { requirePassword }) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const role = body?.role;
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!name) return { error: 'Name is required' };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Valid email is required' };
  }
  if (!VALID_ROLES.includes(role)) {
    return { error: 'Role must be USER, ADMIN, or SUPER_ADMIN' };
  }
  if (requirePassword && password.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }
  if (password && password.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }

  return { name, email, role, password: password || null };
}

async function countOtherSuperAdmins(excludeUserId) {
  const countRes = await db.query(
    `SELECT COUNT(*)::int AS total FROM users
     WHERE role = 'SUPER_ADMIN' AND deactivated_at IS NULL AND id <> $1`,
    [excludeUserId]
  );
  return countRes.rows[0]?.total ?? 0;
}

async function updateAdminUser(actor, targetId, body) {
  const validated = validateUserPayload(body, { requirePassword: false });
  if (validated.error) return { status: 400, body: { error: validated.error } };

  const { name, email, role, password } = validated;

  const { rows } = await db.query(
    'SELECT id, role FROM users WHERE id = $1 LIMIT 1',
    [targetId]
  );
  const existing = rows[0];
  if (!existing) {
    return { status: 404, body: { error: 'User not found' } };
  }

  if (!canEditUser(actor, existing)) {
    return { status: 403, body: { error: 'You cannot edit this user' } };
  }

  const roleError = assertRoleChangeAllowed(actor, existing, role);
  if (roleError) {
    return { status: 400, body: { error: roleError } };
  }

  if (existing.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
    if ((await countOtherSuperAdmins(targetId)) === 0) {
      return { status: 400, body: { error: 'Cannot demote the last super admin' } };
    }
  }

  const emailTaken = await db.query(
    'SELECT id FROM users WHERE email = $1 AND id <> $2 LIMIT 1',
    [email, targetId]
  );
  if (emailTaken.rows[0]) {
    return { status: 409, body: { error: 'Email already in use' } };
  }

  if (password) {
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows: updated } = await db.query(
      `UPDATE users SET name = $1, email = $2, role = $3, password_hash = $4
       WHERE id = $5
       RETURNING id, name, email, role, created_at AS "createdAt"`,
      [name, email, role, passwordHash, targetId]
    );
    return { status: 200, body: updated[0] };
  }

  const { rows: updated } = await db.query(
    `UPDATE users SET name = $1, email = $2, role = $3
     WHERE id = $4
     RETURNING id, name, email, role, created_at AS "createdAt"`,
    [name, email, role, targetId]
  );
  return { status: 200, body: updated[0] };
}

async function createAdminUser(actor, body) {
  const validated = validateUserPayload(body, { requirePassword: true });
  if (validated.error) return { status: 400, body: { error: validated.error } };

  const { name, email, role, password } = validated;

  if (!canAssignRole(actor.role, role)) {
    return { status: 403, body: { error: 'You cannot assign that role' } };
  }

  const existing = await db.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
  if (existing.rows[0]) {
    return { status: 409, body: { error: 'Email already registered' } };
  }

  const userId = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await db.query(
    `INSERT INTO users (id, name, email, password_hash, email_verified_at, role, created_at)
     VALUES ($1, $2, $3, $4, NOW(), $5, NOW())
     RETURNING id, name, email, role, created_at AS "createdAt"`,
    [userId, name, email, passwordHash, role]
  );

  if (role === 'USER' && Array.isArray(body.subjectIds) && body.subjectIds.length > 0) {
    await enrollUserInSubjectsFast(userId, body.subjectIds);
  }

  return { status: 201, body: rows[0] };
}

async function enrollUserInSubjectsFast(userId, subjectIds) {
  const ids = [...new Set(subjectIds.filter((id) => typeof id === 'string' && id.trim()))];
  if (ids.length === 0) return 0;

  const validRes = await db.query('SELECT id FROM subjects WHERE id = ANY($1::text[])', [ids]);
  const validIds = validRes.rows.map((r) => r.id);
  for (const subjectId of validIds) {
    await db.query(
      `INSERT INTO user_subjects (id, user_id, subject_id, created_at)
       VALUES ($1, $2, $3, NOW()) ON CONFLICT (user_id, subject_id) DO NOTHING`,
      [randomUUID(), userId, subjectId]
    );
  }
  return validIds.length;
}

async function subjectsAvailable(user) {
  if (isStaff(user.role)) {
    return { status: 200, body: [] };
  }

  const enrolledRes = await db.query(
    'SELECT subject_id FROM user_subjects WHERE user_id = $1',
    [user.id]
  );
  const enrolledIds = enrolledRes.rows.map((r) => r.subject_id);

  const subjectsRes =
    enrolledIds.length > 0
      ? await db.query(
          `SELECT s.id, s.name,
                  (SELECT COUNT(*)::int FROM topics t WHERE t.subject_id = s.id) AS topic_count
           FROM subjects s
           WHERE s.id <> ALL($1::text[])
           ORDER BY s.name ASC`,
          [enrolledIds]
        )
      : await db.query(
          `SELECT s.id, s.name,
                  (SELECT COUNT(*)::int FROM topics t WHERE t.subject_id = s.id) AS topic_count
           FROM subjects s ORDER BY s.name ASC`
        );

  if (subjectsRes.rows.length === 0) {
    return { status: 200, body: [] };
  }

  const ids = subjectsRes.rows.map((s) => s.id);
  const cardsRes = await db.query(
    `SELECT t.subject_id, COUNT(f.id)::int AS cards
     FROM flashcards f JOIN topics t ON f.topic_id = t.id
     WHERE t.subject_id = ANY($1::text[])
     GROUP BY t.subject_id`,
    [ids]
  );
  const cardsBySubject = new Map(cardsRes.rows.map((r) => [r.subject_id, r.cards]));

  return {
    status: 200,
    body: subjectsRes.rows.map((s) => ({
      id: s.id,
      name: s.name,
      topicCount: s.topic_count,
      totalCards: cardsBySubject.get(s.id) || 0,
    })),
  };
}

async function subjectsEnroll(user, body) {
  if (isStaff(user.role)) {
    return { status: 400, body: { error: 'Staff accounts have access to all subjects' } };
  }

  const ids = (body?.subjectIds || []).filter((id) => typeof id === 'string' && id.trim());
  if (ids.length === 0) {
    return { status: 400, body: { error: 'Select at least one subject' } };
  }

  const added = await enrollUserInSubjectsFast(user.id, ids);
  if (added === 0) {
    return { status: 400, body: { error: 'No valid subjects selected' } };
  }

  const dash = await dashboardSubjects(user);
  return {
    status: 200,
    body: {
      message: `Added ${added} subject(s)`,
      subjects: dash.body,
    },
  };
}

async function deactivateAdminUser(actor, targetId) {
  return deactivateUser(actor, targetId);
}

async function verifyAdminUserEmail(actor, targetId) {
  if (actor.role !== 'SUPER_ADMIN') {
    return { status: 403, body: { error: 'Super admin access required' } };
  }

  const { rows } = await db.query(
    `UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW()),
                      verification_token_hash = NULL,
                      verification_token_expires = NULL
     WHERE id = $1
     RETURNING ${USER_PUBLIC_COLUMNS}`,
    [targetId]
  );
  if (!rows[0]) return { status: 404, body: { error: 'User not found' } };
  return { status: 200, body: { message: 'Email marked as verified', user: publicUser(rows[0]) } };
}

async function subjectTopics(user, subjectId, query) {
  const subjectRes = await db.query(
    'SELECT id, name FROM subjects WHERE id = $1 LIMIT 1',
    [subjectId]
  );
  if (!subjectRes.rows[0]) {
    return { status: 404, body: { error: 'Subject not found' } };
  }

  if (!isStaff(user.role)) {
    const enrolled = await db.query(
      'SELECT 1 FROM user_subjects WHERE user_id = $1 AND subject_id = $2 LIMIT 1',
      [user.id, subjectId]
    );
    if (!enrolled.rows[0]) {
      return { status: 403, body: { error: 'You are not enrolled in this subject' } };
    }
  }

  const usePagination = query.page != null || query.limit != null;
  const { page, limit, skip } = parsePage(query, 12);

  const countRes = await db.query(
    'SELECT COUNT(*)::int AS total FROM topics WHERE subject_id = $1',
    [subjectId]
  );
  const total = countRes.rows[0]?.total ?? 0;

  const listRes = usePagination
    ? await db.query(
        `SELECT id, name FROM topics WHERE subject_id = $1 ORDER BY name ASC LIMIT $2 OFFSET $3`,
        [subjectId, limit, skip]
      )
    : await db.query(
        `SELECT id, name FROM topics WHERE subject_id = $1 ORDER BY name ASC`,
        [subjectId]
      );

  const topicRows = listRes.rows;
  const topicIds = topicRows.map((t) => t.id);

  const cardsByTopic = new Map();
  const masteredByTopic = new Map();
  const needsPracticeByTopic = new Map();

  if (topicIds.length > 0) {
    const [cardsRes, progressRes] = await Promise.all([
      db.query(
        `SELECT topic_id, COUNT(*)::int AS cnt
         FROM flashcards WHERE topic_id = ANY($1::text[]) GROUP BY topic_id`,
        [topicIds]
      ),
      db.query(
        `SELECT f.topic_id, up.status
         FROM user_progress up
         JOIN flashcards f ON up.flashcard_id = f.id
         WHERE up.user_id = $1 AND f.topic_id = ANY($2::text[])`,
        [user.id, topicIds]
      ),
    ]);

    for (const row of cardsRes.rows) {
      cardsByTopic.set(row.topic_id, row.cnt);
    }
    for (const row of progressRes.rows) {
      if (row.status === 'GOT_IT') {
        masteredByTopic.set(row.topic_id, (masteredByTopic.get(row.topic_id) || 0) + 1);
      } else {
        needsPracticeByTopic.set(
          row.topic_id,
          (needsPracticeByTopic.get(row.topic_id) || 0) + 1
        );
      }
    }
  }

  const items = topicRows.map((topic) => {
    const totalCards = cardsByTopic.get(topic.id) || 0;
    const mastered = masteredByTopic.get(topic.id) || 0;
    const needsPractice = needsPracticeByTopic.get(topic.id) || 0;
    return {
      id: topic.id,
      name: topic.name,
      totalCards,
      mastered,
      needsPractice,
      progressPercent: totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0,
    };
  });

  const subject = subjectRes.rows[0];
  const body = {
    id: subject.id,
    name: subject.name,
    topics: items,
  };

  if (usePagination) {
    body.topicsPagination = paginatedResponse(items, total, { page, limit }).pagination;
  }

  return { status: 200, body };
}

async function topicFlashcards(user, topicId, query) {
  const { preparePracticeCards } = require('./questionTypes');
  const {
    parseQuestionTypes,
    filterByQuestionTypes,
    orderCardsForStudy,
  } = require('./studySession');
  const { getMaxStudyCards } = require('./config');

  const topicRes = await db.query(
    `SELECT t.id, t.name, s.id AS subject_id, s.name AS subject_name
     FROM topics t JOIN subjects s ON t.subject_id = s.id
     WHERE t.id = $1 LIMIT 1`,
    [topicId]
  );
  if (!topicRes.rows[0]) {
    return { status: 404, body: { error: 'Topic not found' } };
  }
  const topic = topicRes.rows[0];

  if (!isStaff(user.role)) {
    const enrolled = await db.query(
      'SELECT 1 FROM user_subjects WHERE user_id = $1 AND subject_id = $2 LIMIT 1',
      [user.id, topic.subject_id]
    );
    if (!enrolled.rows[0]) {
      return { status: 403, body: { error: 'You are not enrolled in this subject' } };
    }
  }

  const mode = String(query.mode || 'learn').toLowerCase();
  const shuffle = query.shuffle !== 'false';
  const weakOnly = query.weakOnly === 'true';
  const questionTypes = parseQuestionTypes(query.types);

  const cardsRes = await db.query(
    `SELECT id, question, answer, question_type AS "questionType",
            distractor_1 AS "distractor1", distractor_2 AS "distractor2",
            distractor_3 AS "distractor3", difficulty
     FROM flashcards WHERE topic_id = $1`,
    [topicId]
  );
  const allCards = cardsRes.rows;

  const progressRes =
    allCards.length > 0
      ? await db.query(
          `SELECT flashcard_id, status FROM user_progress
           WHERE user_id = $1 AND flashcard_id = ANY($2::text[])`,
          [user.id, allCards.map((c) => c.id)]
        )
      : { rows: [] };

  const progressByCardId = new Map(
    progressRes.rows.map((p) => [p.flashcard_id, { status: p.status }])
  );

  let cards = filterByQuestionTypes(allCards, questionTypes);
  if (weakOnly) {
    cards = cards.filter((c) => {
      const p = progressByCardId.get(c.id);
      return !p || p.status === 'NEEDS_PRACTICE';
    });
  }

  cards = orderCardsForStudy(cards, progressByCardId, {
    weakFirst: mode !== 'test',
    shuffle,
  });

  let flashcards;
  if (mode === 'flashcards') {
    flashcards = cards.map((c) => ({
      id: c.id,
      question: c.question,
      answer: c.answer,
      difficulty: c.difficulty,
      questionType: c.questionType,
    }));
  } else {
    flashcards = preparePracticeCards(cards);
  }

  const maxCards = getMaxStudyCards();
  const truncated = flashcards.length > maxCards;
  if (truncated) {
    flashcards = flashcards.slice(0, maxCards);
  }

  return {
    status: 200,
    body: {
      id: topic.id,
      name: topic.name,
      subject: { id: topic.subject_id, name: topic.subject_name },
      mode,
      totalAvailable: allCards.length,
      flashcards,
      ...(truncated ? { truncated: true, maxCards } : {}),
    },
  };
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

  if (method === 'POST') {
    const verifyTargetId = parseAdminUserVerifyPath(path);
    if (verifyTargetId) {
      const auth = await requireUser(authHeader);
      if (auth.error) return auth.error;
      if (!isStaff(auth.user.role)) {
        return { status: 403, body: { error: 'Admin access required' } };
      }
      return verifyAdminUserEmail(auth.user, verifyTargetId);
    }

    const reactivateTargetId = parseAdminUserReactivatePath(path);
    if (reactivateTargetId) {
      const auth = await requireUser(authHeader);
      if (auth.error) return auth.error;
      if (!isStaff(auth.user.role)) {
        return { status: 403, body: { error: 'Admin access required' } };
      }
      return reactivateUser(auth.user, reactivateTargetId);
    }
  }

  if (method === 'PUT' || method === 'DELETE') {
    const targetId = parseAdminUserId(path);
    if (targetId) {
      const auth = await requireUser(authHeader);
      if (auth.error) return auth.error;
      if (!isStaff(auth.user.role)) {
        return { status: 403, body: { error: 'Admin access required' } };
      }
      if (method === 'PUT') {
        if (!body) return { status: 400, body: { error: 'Request body required' } };
        return updateAdminUser(auth.user, targetId, body);
      }
      return deactivateAdminUser(auth.user, targetId);
    }
  }

  if (method === 'POST' && adminUsersListPath(path)) {
    const auth = await requireUser(authHeader);
    if (auth.error) return auth.error;
    if (!isStaff(auth.user.role)) {
      return { status: 403, body: { error: 'Admin access required' } };
    }
    if (!body) return { status: 400, body: { error: 'Request body required' } };
    return createAdminUser(auth.user, body);
  }

  if (method === 'POST' && subjectsEnrollPath(path)) {
    const auth = await requireUser(authHeader, { requireVerified: true });
    if (auth.error) return auth.error;
    if (!body) return { status: 400, body: { error: 'Request body required' } };
    return subjectsEnroll(auth.user, body);
  }

  if (method === 'POST' && progressPath(path)) {
    const auth = await requireUser(authHeader, { requireVerified: true });
    if (auth.error) return auth.error;
    const { saveProgressFast } = require('./progressFast');
    return saveProgressFast(auth.user, body);
  }

  if (method !== 'GET') return null;

  const needsAuth =
    path.includes('/admin/') ||
    path.endsWith('/subjects') ||
    path.endsWith('/profile') ||
    path.endsWith('/subjects/available') ||
    !!parseSubjectTopicsPath(path) ||
    !!parseTopicFlashcardsPath(path);

  if (!needsAuth) return null;

  const auth = await requireUser(authHeader);
  if (auth.error) return auth.error;
  const { user } = auth;

  const reportsKind = parseAdminReportsPath(path);
  if (reportsKind) {
    if (!isStaff(user.role)) {
      return { status: 403, body: { error: 'Admin access required' } };
    }
    const reports = require('./adminReports');
    if (reportsKind === 'overview') {
      return { status: 200, body: await reports.getOverview(query) };
    }
    if (reportsKind === 'learners') {
      const result = await reports.getLearners(query);
      if (result.csv) {
        return { status: 200, csv: result.csv, filename: result.filename };
      }
      return { status: 200, body: result };
    }
    if (reportsKind === 'content') {
      return { status: 200, body: await reports.getContent() };
    }
  }

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

  const topicIdForFlashcards = parseTopicFlashcardsPath(path);
  if (topicIdForFlashcards) {
    return topicFlashcards(user, topicIdForFlashcards, query);
  }

  const subjectIdForTopics = parseSubjectTopicsPath(path);
  if (subjectIdForTopics) {
    return subjectTopics(user, subjectIdForTopics, query);
  }

  const subjectsPath = path.replace(/\/$/, '');
  if (
    (subjectsPath === '/api/subjects' || subjectsPath === '/subjects') &&
    !path.includes('/catalog') &&
    !path.includes('/available')
  ) {
    return dashboardSubjects(user);
  }

  if (subjectsAvailablePath(path)) {
    return subjectsAvailable(user);
  }

  if (match(path, '/profile')) {
    return profile(user, query);
  }

  return null;
}

function subjectsAvailablePath(path) {
  const normalized = path.replace(/\/$/, '');
  return normalized === '/subjects/available' || normalized === '/api/subjects/available';
}

function subjectsEnrollPath(path) {
  const normalized = path.replace(/\/$/, '');
  return normalized === '/subjects/enroll' || normalized === '/api/subjects/enroll';
}

function progressPath(path) {
  const normalized = path.replace(/\/$/, '');
  return normalized === '/progress' || normalized === '/api/progress';
}

function match(path, suffix) {
  return path === suffix || path.endsWith(suffix);
}

function adminUsersListPath(path) {
  const normalized = path.replace(/\/$/, '');
  return normalized === '/admin/users' || normalized === '/api/admin/users';
}

function parseAdminUserVerifyPath(path) {
  const m = path.match(/\/admin\/users\/([^/]+)\/verify-email\/?$/);
  return m ? m[1] : null;
}

function parseAdminUserReactivatePath(path) {
  const m = path.match(/\/admin\/users\/([^/]+)\/reactivate\/?$/);
  return m ? m[1] : null;
}

function parseAdminReportsPath(path) {
  const normalized = path.replace(/\/$/, '');
  if (normalized === '/admin/reports/overview' || normalized === '/api/admin/reports/overview') {
    return 'overview';
  }
  if (normalized === '/admin/reports/learners' || normalized === '/api/admin/reports/learners') {
    return 'learners';
  }
  if (normalized === '/admin/reports/content' || normalized === '/api/admin/reports/content') {
    return 'content';
  }
  return null;
}

module.exports = { tryHandle };
