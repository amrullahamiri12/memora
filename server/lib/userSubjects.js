const prisma = require('./prisma');
const { shouldRestrictToEnrolledSubjects } = require('./learnerView');

const MAX_ACTIVE_SUBJECTS = 3;

/**
 * Returns true if the learner has at least one unmastered enrolled subject.
 * Staff (non-learner) callers should skip this check before calling.
 */
async function getEnrollmentStatus(userId) {
  const enrollments = await prisma.userSubject.findMany({
    where: { userId },
    select: { subjectId: true },
  });

  if (enrollments.length === 0) {
    return { activeCount: 0, hasUnmastered: false };
  }

  const subjectIds = enrollments.map((e) => e.subjectId);

  const subjects = await prisma.subject.findMany({
    where: { id: { in: subjectIds } },
    select: {
      id: true,
      topics: { select: { id: true } },
    },
  });

  let hasUnmastered = false;
  const topicIds = subjects.flatMap((s) => s.topics.map((t) => t.id));

  const [cardCounts, masteredRows] = await Promise.all([
    prisma.flashcard.groupBy({
      by: ['topicId'],
      where: { topicId: { in: topicIds } },
      _count: { _all: true },
    }),
    topicIds.length > 0
      ? prisma.$queryRaw`
          SELECT f.topic_id, COUNT(*)::int AS mastered
          FROM user_progress up
          JOIN flashcards f ON f.id = up.flashcard_id
          WHERE up.user_id = ${userId}
            AND up.status = 'GOT_IT'
            AND f.topic_id = ANY(${topicIds})
          GROUP BY f.topic_id
        `
      : Promise.resolve([]),
  ]);

  const cardsByTopic = new Map(cardCounts.map((c) => [c.topicId, c._count._all]));
  const masteredByTopic = new Map(masteredRows.map((r) => [r.topic_id, Number(r.mastered)]));
  const topicsBySubject = new Map(subjects.map((s) => [s.id, s.topics]));

  for (const subjectId of subjectIds) {
    const topics = topicsBySubject.get(subjectId) || [];
    let totalCards = 0;
    let mastered = 0;
    for (const topic of topics) {
      totalCards += cardsByTopic.get(topic.id) || 0;
      mastered += masteredByTopic.get(topic.id) || 0;
    }
    if (totalCards === 0 || mastered < totalCards) {
      hasUnmastered = true;
      break;
    }
  }

  return { activeCount: enrollments.length, hasUnmastered };
}

async function assertEnrollmentAllowed(userId, newCount) {
  const { activeCount, hasUnmastered } = await getEnrollmentStatus(userId);
  const afterEnroll = activeCount + newCount;

  if (afterEnroll <= MAX_ACTIVE_SUBJECTS) return null;

  if (hasUnmastered) {
    return {
      status: 422,
      error: `You can enroll in a maximum of ${MAX_ACTIVE_SUBJECTS} subjects at a time. Master your current subjects first before adding more.`,
      code: 'SUBJECT_LIMIT_REACHED',
    };
  }

  return null;
}

async function enrollUserInSubjects(userId, subjectIds, { skipLimitCheck = false } = {}) {
  const unique = [...new Set(subjectIds)];
  if (unique.length === 0) return [];

  const existing = await prisma.subject.findMany({
    where: { id: { in: unique } },
    select: { id: true },
  });
  const validIds = existing.map((s) => s.id);
  if (validIds.length === 0) return [];

  // Only check the limit for actual new enrollments
  if (!skipLimitCheck) {
    const alreadyEnrolled = await prisma.userSubject.findMany({
      where: { userId, subjectId: { in: validIds } },
      select: { subjectId: true },
    });
    const alreadySet = new Set(alreadyEnrolled.map((e) => e.subjectId));
    const newIds = validIds.filter((id) => !alreadySet.has(id));

    if (newIds.length > 0) {
      const limitError = await assertEnrollmentAllowed(userId, newIds.length);
      if (limitError) {
        const err = new Error(limitError.error);
        err.status = limitError.status;
        err.code = limitError.code;
        throw err;
      }
    }
  }

  await Promise.all(
    validIds.map((subjectId) =>
      prisma.userSubject.upsert({
        where: { userId_subjectId: { userId, subjectId } },
        create: { userId, subjectId },
        update: {},
      })
    )
  );

  return validIds;
}

async function userHasSubject(userId, subjectId) {
  const row = await prisma.userSubject.findUnique({
    where: { userId_subjectId: { userId, subjectId } },
  });
  return !!row;
}

async function getEnrolledSubjectIds(userId) {
  const rows = await prisma.userSubject.findMany({
    where: { userId },
    select: { subjectId: true },
  });
  return rows.map((r) => r.subjectId);
}

async function assertSubjectAccess(user, subjectId, options = {}) {
  const { learnerView = false } = options;
  if (!shouldRestrictToEnrolledSubjects(user, learnerView)) return true;
  return userHasSubject(user.id, subjectId);
}

/** One-time: users created before subject enrollment have no rows yet */
async function ensureUserEnrollments(userId) {
  const count = await prisma.userSubject.count({ where: { userId } });
  if (count > 0) return;

  const progress = await prisma.userProgress.findMany({
    where: { userId },
    include: {
      flashcard: {
        include: { topic: { select: { subjectId: true } } },
      },
    },
  });

  const fromProgress = [
    ...new Set(progress.map((p) => p.flashcard.topic.subjectId).filter(Boolean)),
  ];
  if (fromProgress.length > 0) {
    await enrollUserInSubjects(userId, fromProgress);
  }
}

async function assertFlashcardAccess(user, flashcardId, options = {}) {
  const { learnerView = false } = options;
  const flashcard = await prisma.flashcard.findUnique({
    where: { id: flashcardId },
    include: { topic: { select: { subjectId: true } } },
  });
  if (!flashcard) {
    return { allowed: false, status: 404, error: 'Flashcard not found' };
  }
  const allowed = await assertSubjectAccess(user, flashcard.topic.subjectId, { learnerView });
  if (!allowed) {
    return { allowed: false, status: 403, error: 'You are not enrolled in this subject' };
  }
  return { allowed: true, flashcard };
}

module.exports = {
  MAX_ACTIVE_SUBJECTS,
  enrollUserInSubjects,
  getEnrollmentStatus,
  assertEnrollmentAllowed,
  userHasSubject,
  getEnrolledSubjectIds,
  assertSubjectAccess,
  assertFlashcardAccess,
  ensureUserEnrollments,
};
