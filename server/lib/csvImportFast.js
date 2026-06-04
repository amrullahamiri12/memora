const { randomUUID } = require('crypto');
const db = require('./pg');
const { parseFlashcardCsv, rowToFlashcardData } = require('./csvFlashcards');

const INSERT_BATCH = 50;

async function ensureSubjects(client, names) {
  const byName = new Map();
  if (names.length === 0) return byName;

  const existing = await client.query('SELECT id, name FROM subjects WHERE name = ANY($1)', [
    names,
  ]);
  for (const row of existing.rows) {
    byName.set(row.name, row.id);
  }

  for (const name of names) {
    if (byName.has(name)) continue;
    const id = randomUUID();
    await client.query('INSERT INTO subjects (id, name) VALUES ($1, $2)', [id, name]);
    byName.set(name, id);
  }
  return byName;
}

async function ensureTopics(client, pairs, subjectByName) {
  const byKey = new Map();
  const subjectIds = [...new Set(pairs.map((p) => p.subjectId))];

  if (subjectIds.length > 0) {
    const existing = await client.query(
      'SELECT id, subject_id, name FROM topics WHERE subject_id = ANY($1)',
      [subjectIds]
    );
    for (const row of existing.rows) {
      byKey.set(`${row.subject_id}::${row.name}`, row.id);
    }
  }

  for (const { subjectId, topicName } of pairs) {
    const key = `${subjectId}::${topicName}`;
    if (byKey.has(key)) continue;
    const id = randomUUID();
    await client.query('INSERT INTO topics (id, subject_id, name) VALUES ($1, $2, $3)', [
      id,
      subjectId,
      topicName,
    ]);
    byKey.set(key, id);
  }
  return byKey;
}

async function loadExistingQuestions(client, topicIds) {
  const set = new Set();
  if (topicIds.length === 0) return set;

  const { rows } = await client.query(
    'SELECT topic_id, question FROM flashcards WHERE topic_id = ANY($1)',
    [topicIds]
  );
  for (const row of rows) {
    set.add(`${row.topic_id}\0${row.question}`);
  }
  return set;
}

async function insertFlashcardBatch(client, cards) {
  if (cards.length === 0) return;

  const ids = [];
  const topicIds = [];
  const types = [];
  const questions = [];
  const answers = [];
  const d1 = [];
  const d2 = [];
  const d3 = [];
  const diffs = [];

  for (const c of cards) {
    ids.push(c.id);
    topicIds.push(c.topicId);
    types.push(c.questionType);
    questions.push(c.question);
    answers.push(c.answer);
    d1.push(c.distractor1);
    d2.push(c.distractor2);
    d3.push(c.distractor3);
    diffs.push(c.difficulty);
  }

  await client.query(
    `INSERT INTO flashcards (id, topic_id, question_type, question, answer, distractor_1, distractor_2, distractor_3, difficulty)
     SELECT * FROM UNNEST(
       $1::text[], $2::text[], $3::text[], $4::text[], $5::text[],
       $6::text[], $7::text[], $8::text[], $9::text[]
     )`,
    [ids, topicIds, types, questions, answers, d1, d2, d3, diffs]
  );
}

async function importFlashcardsFromCsvFast(csvText) {
  const rows = parseFlashcardCsv(csvText);
  const results = { imported: 0, skipped: 0, errors: [], warnings: [] };
  const topicMcqAdded = new Map();

  const validRows = [];
  for (const row of rows) {
    const subject = row.subject?.trim();
    const topic = row.topic?.trim();
    const data = rowToFlashcardData(row);

    if (!subject || !topic) {
      results.errors.push({ line: row.lineNumber, message: 'subject and topic are required' });
      continue;
    }
    if (data.validationErrors.length > 0) {
      results.errors.push({ line: row.lineNumber, message: data.validationErrors.join('; ') });
      continue;
    }
    if (!['EASY', 'MEDIUM', 'HARD'].includes(data.difficulty)) {
      results.errors.push({
        line: row.lineNumber,
        message: `Invalid difficulty "${row.difficulty}" — use Easy, Medium, or Hard`,
      });
      continue;
    }
    validRows.push({ row, subject, topic, data });
  }

  if (validRows.length === 0) return results;

  const client = await db.getPool().connect();
  try {
    await client.query('BEGIN');

    const subjectNames = [...new Set(validRows.map((r) => r.subject))];
    const subjectByName = await ensureSubjects(client, subjectNames);

    const topicPairs = [];
    const topicPairKeys = new Set();
    for (const { subject, topic } of validRows) {
      const subjectId = subjectByName.get(subject);
      const key = `${subjectId}::${topic}`;
      if (!topicPairKeys.has(key)) {
        topicPairKeys.add(key);
        topicPairs.push({ subjectId, topicName: topic });
      }
    }
    const topicByKey = await ensureTopics(client, topicPairs, subjectByName);
    const topicIds = [...new Set(topicByKey.values())];
    const existingQuestions = await loadExistingQuestions(client, topicIds);

    const pending = [];
    for (const { row, subject, topic, data } of validRows) {
      const subjectId = subjectByName.get(subject);
      const topicId = topicByKey.get(`${subjectId}::${topic}`);
      const dupKey = `${topicId}\0${data.question}`;

      if (existingQuestions.has(dupKey)) {
        results.skipped++;
        continue;
      }
      existingQuestions.add(dupKey);

      if (data.questionType === 'MCQ') {
        topicMcqAdded.set(topicId, (topicMcqAdded.get(topicId) || 0) + 1);
      }

      pending.push({
        id: randomUUID(),
        topicId,
        questionType: data.questionType,
        question: data.question,
        answer: data.answer,
        distractor1: data.distractor1,
        distractor2: data.distractor2,
        distractor3: data.distractor3,
        difficulty: data.difficulty,
      });
    }

    for (let i = 0; i < pending.length; i += INSERT_BATCH) {
      const batch = pending.slice(i, i + INSERT_BATCH);
      await insertFlashcardBatch(client, batch);
      results.imported += batch.length;
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  for (const [topicId, addedMcq] of topicMcqAdded) {
    if (addedMcq === 0) continue;
    const countRes = await db.query(
      `SELECT COUNT(*)::int AS total FROM flashcards WHERE topic_id = $1 AND question_type = 'MCQ'`,
      [topicId]
    );
    const mcqTotal = countRes.rows[0]?.total ?? 0;
    if (mcqTotal < 4) {
      const info = await db.query(
        `SELECT s.name AS subject, t.name AS topic
         FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE t.id = $1`,
        [topicId]
      );
      const { subject, topic } = info.rows[0] || { subject: '?', topic: '?' };
      results.warnings.push(
        `"${subject} / ${topic}" has ${mcqTotal} MCQ card(s). Add at least 4 MCQ cards per topic for better auto-generated wrong answers.`
      );
    }
  }

  return results;
}

module.exports = { importFlashcardsFromCsvFast };
