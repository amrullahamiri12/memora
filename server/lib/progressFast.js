const { randomUUID } = require('crypto');
const db = require('./pg');
const { isStaff } = require('./roles');
const { gradeFlashcardAnswer, formatCorrectAnswer } = require('./questionTypes');

function getTodayDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function mapFlashcardRow(row) {
  return {
    id: row.id,
    questionType: row.questionType,
    question: row.question,
    answer: row.answer,
    distractor1: row.distractor1,
    distractor2: row.distractor2,
    distractor3: row.distractor3,
    topic: { subjectId: row.subjectId },
  };
}

async function assertFlashcardAccessFast(user, flashcardId) {
  const { rows } = await db.query(
    `SELECT f.id,
            f.question_type AS "questionType",
            f.question,
            f.answer,
            f.distractor_1 AS "distractor1",
            f.distractor_2 AS "distractor2",
            f.distractor_3 AS "distractor3",
            t.subject_id AS "subjectId"
     FROM flashcards f
     JOIN topics t ON f.topic_id = t.id
     WHERE f.id = $1
     LIMIT 1`,
    [flashcardId]
  );

  if (!rows[0]) {
    return { allowed: false, status: 404, error: 'Flashcard not found' };
  }

  if (!isStaff(user.role)) {
    const enrolled = await db.query(
      'SELECT 1 FROM user_subjects WHERE user_id = $1 AND subject_id = $2 LIMIT 1',
      [user.id, rows[0].subjectId]
    );
    if (!enrolled.rows[0]) {
      return { allowed: false, status: 403, error: 'You are not enrolled in this subject' };
    }
  }

  return { allowed: true, flashcard: mapFlashcardRow(rows[0]) };
}

async function saveProgressFast(user, body) {
  const flashcardId = typeof body?.flashcardId === 'string' ? body.flashcardId.trim() : '';
  let status = body?.status;
  const selectedAnswer = body?.selectedAnswer;

  if (!flashcardId) {
    return { status: 400, body: { error: 'Flashcard ID is required' } };
  }

  if (!status && (selectedAnswer === undefined || selectedAnswer === null || selectedAnswer === '')) {
    return { status: 400, body: { error: 'Provide selectedAnswer or status' } };
  }

  if (status && status !== 'GOT_IT' && status !== 'NEEDS_PRACTICE') {
    return { status: 400, body: { error: 'Status must be GOT_IT or NEEDS_PRACTICE' } };
  }

  const access = await assertFlashcardAccessFast(user, flashcardId);
  if (!access.allowed) {
    return { status: access.status, body: { error: access.error } };
  }

  const flashcard = access.flashcard;
  let correct = null;

  if (selectedAnswer !== undefined && selectedAnswer !== null && selectedAnswer !== '') {
    correct = gradeFlashcardAnswer(flashcard, String(selectedAnswer));
    status = correct ? 'GOT_IT' : 'NEEDS_PRACTICE';
  }

  const progressId = randomUUID();
  const { rows } = await db.query(
    `INSERT INTO user_progress (id, user_id, flashcard_id, status, last_reviewed)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id, flashcard_id)
     DO UPDATE SET status = EXCLUDED.status, last_reviewed = NOW()
     RETURNING id, user_id AS "userId", flashcard_id AS "flashcardId",
               status, last_reviewed AS "lastReviewed"`,
    [progressId, user.id, flashcardId, status]
  );

  const practiceId = randomUUID();
  await db.query(
    `INSERT INTO user_daily_practice (id, user_id, date)
     VALUES ($1, $2, $3::date)
     ON CONFLICT (user_id, date) DO NOTHING`,
    [practiceId, user.id, getTodayDate()]
  );

  const progress = rows[0];
  return {
    status: 200,
    body: {
      ...progress,
      correct,
      correctAnswer: formatCorrectAnswer(flashcard),
      status,
    },
  };
}

module.exports = { saveProgressFast };
