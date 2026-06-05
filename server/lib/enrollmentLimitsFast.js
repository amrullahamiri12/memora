const db = require('./pg');
const {
  deriveQuotaFromSubjects,
  createLimitError,
  getMaxActiveSubjects,
  quotaForUser,
  resolveUserEmail,
} = require('./enrollmentLimits');

async function loadEnrolledSubjectsWithProgress(userId) {
  const enrolled = await db.query(
    'SELECT subject_id FROM user_subjects WHERE user_id = $1',
    [userId]
  );
  const subjectIds = enrolled.rows.map((r) => r.subject_id);
  if (subjectIds.length === 0) return [];

  const [subjectsRes, cardsRes, masteredRes, topicCountsRes] = await Promise.all([
    db.query(
      `SELECT id, name FROM subjects WHERE id = ANY($1::text[]) ORDER BY name ASC`,
      [subjectIds]
    ),
    db.query(
      `SELECT t.subject_id, COUNT(f.id)::int AS cards
       FROM flashcards f JOIN topics t ON f.topic_id = t.id
       WHERE t.subject_id = ANY($1::text[])
       GROUP BY t.subject_id`,
      [subjectIds]
    ),
    db.query(
      `SELECT t.subject_id, COUNT(up.id)::int AS mastered
       FROM user_progress up
       JOIN flashcards f ON up.flashcard_id = f.id
       JOIN topics t ON f.topic_id = t.id
       WHERE up.user_id = $1 AND up.status = 'GOT_IT' AND t.subject_id = ANY($2::text[])
       GROUP BY t.subject_id`,
      [userId, subjectIds]
    ),
    db.query(
      `SELECT subject_id, COUNT(*)::int AS cnt FROM topics WHERE subject_id = ANY($1::text[]) GROUP BY subject_id`,
      [subjectIds]
    ),
  ]);

  const cardsBySubject = new Map(cardsRes.rows.map((r) => [r.subject_id, r.cards]));
  const masteredBySubject = new Map(masteredRes.rows.map((r) => [r.subject_id, r.mastered]));
  const topicCountBySubject = new Map(topicCountsRes.rows.map((r) => [r.subject_id, r.cnt]));

  return subjectsRes.rows.map((s) => {
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
  });
}

async function assertCanEnrollSubjectsFast(userOrId, subjectIds) {
  const email = await resolveUserEmail(userOrId);
  const userId = typeof userOrId === 'object' ? userOrId.id : userOrId;
  const unique = [...new Set(subjectIds.filter((id) => typeof id === 'string' && id.trim()))];
  if (unique.length === 0) {
    return { newIds: [], quota: deriveQuotaFromSubjects([], getMaxActiveSubjects(email)) };
  }

  const enrolledSubjects = await loadEnrolledSubjectsWithProgress(userId);
  const enrolledSet = new Set(enrolledSubjects.map((s) => s.id));
  const newIds = unique.filter((id) => !enrolledSet.has(id));

  if (newIds.length === 0) {
    return { newIds: [], quota: quotaForUser(enrolledSubjects, email) };
  }

  const quota = quotaForUser(enrolledSubjects, email);
  if (newIds.length > quota.spotsRemaining) {
    throw createLimitError(quota.spotsRemaining, newIds.length, email);
  }

  return { newIds, quota };
}

module.exports = {
  loadEnrolledSubjectsWithProgress,
  assertCanEnrollSubjectsFast,
};
