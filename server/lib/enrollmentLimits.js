const { getEnrolledSubjectIds } = require('./userSubjects');
const { getSubjectsWithProgress } = require('./subjectProgress');

const MAX_ACTIVE_SUBJECTS = 3;

function isSubjectMastered(subjectProgress) {
  if (subjectProgress.totalCards === 0) return true;
  return subjectProgress.progressPercent >= 100;
}

function countActiveSlots(subjectsWithProgress) {
  return subjectsWithProgress.filter((s) => !isSubjectMastered(s)).length;
}

function buildQuota(activeSlots) {
  const spotsRemaining = Math.max(0, MAX_ACTIVE_SUBJECTS - activeSlots);
  return {
    limit: MAX_ACTIVE_SUBJECTS,
    activeSlots,
    spotsRemaining,
    canEnrollMore: spotsRemaining > 0,
  };
}

/** Staff admins are not subject to enrollment caps. */
function staffEnrollmentQuota() {
  return {
    limit: MAX_ACTIVE_SUBJECTS,
    activeSlots: 0,
    spotsRemaining: MAX_ACTIVE_SUBJECTS,
    canEnrollMore: true,
  };
}

function deriveQuotaFromSubjects(subjectsWithProgress) {
  return buildQuota(countActiveSlots(subjectsWithProgress));
}

async function getEnrollmentQuota(userId) {
  const enrolledIds = await getEnrolledSubjectIds(userId);
  if (enrolledIds.length === 0) {
    return buildQuota(0);
  }
  const subjects = await getSubjectsWithProgress(userId, enrolledIds);
  return deriveQuotaFromSubjects(subjects);
}

function createLimitError(spotsRemaining, requested) {
  const err = new Error(
    spotsRemaining === 0
      ? `You can study up to ${MAX_ACTIVE_SUBJECTS} subjects at a time. Master a subject or leave one from your dashboard to add another.`
      : `You can add ${spotsRemaining} more subject${spotsRemaining === 1 ? '' : 's'} right now (maximum ${MAX_ACTIVE_SUBJECTS} active at a time).`
  );
  err.status = 422;
  err.code = 'SUBJECT_LIMIT_REACHED';
  err.spotsRemaining = spotsRemaining;
  err.requested = requested;
  return err;
}

async function assertCanEnrollSubjects(userId, subjectIds) {
  const unique = [...new Set(subjectIds.filter((id) => typeof id === 'string' && id.trim()))];
  if (unique.length === 0) return { newIds: [], quota: await getEnrollmentQuota(userId) };

  const enrolledIds = await getEnrolledSubjectIds(userId);
  const enrolledSet = new Set(enrolledIds);
  const newIds = unique.filter((id) => !enrolledSet.has(id));

  if (newIds.length === 0) {
    return { newIds: [], quota: await getEnrollmentQuota(userId) };
  }

  const subjects = enrolledIds.length
    ? await getSubjectsWithProgress(userId, enrolledIds)
    : [];
  const quota = deriveQuotaFromSubjects(subjects);

  if (newIds.length > quota.spotsRemaining) {
    throw createLimitError(quota.spotsRemaining, newIds.length);
  }

  return { newIds, quota };
}

module.exports = {
  MAX_ACTIVE_SUBJECTS,
  isSubjectMastered,
  countActiveSlots,
  buildQuota,
  staffEnrollmentQuota,
  deriveQuotaFromSubjects,
  getEnrollmentQuota,
  assertCanEnrollSubjects,
  createLimitError,
};
