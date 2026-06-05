const prisma = require('./prisma');
const { shouldRestrictToEnrolledSubjects } = require('./learnerView');

async function enrollUserInSubjects(userId, subjectIds) {
  const unique = [...new Set(subjectIds)];
  if (unique.length === 0) return [];

  const existing = await prisma.subject.findMany({
    where: { id: { in: unique } },
    select: { id: true },
  });
  const validIds = existing.map((s) => s.id);
  if (validIds.length === 0) return [];

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
  enrollUserInSubjects,
  userHasSubject,
  getEnrolledSubjectIds,
  assertSubjectAccess,
  assertFlashcardAccess,
  ensureUserEnrollments,
};
