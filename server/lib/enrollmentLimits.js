const db = require('./pg');
const { isGuestEmail } = require('./guestIdentity');
const { getEnrolledSubjectIds } = require('./userSubjects');
const { getSubjectsWithProgress } = require('./subjectProgress');

const MAX_ACTIVE_SUBJECTS_GUEST = 3;
const MAX_ACTIVE_SUBJECTS_REGISTERED = 5;

/** @deprecated use getMaxActiveSubjects */
const MAX_ACTIVE_SUBJECTS = MAX_ACTIVE_SUBJECTS_GUEST;

const GUEST_AT_LIMIT_MESSAGE =
  'You already have 3 active subjects. Sign up for a free account to practice more subjects.';

function getMaxActiveSubjects(userOrEmail) {
  const email = typeof userOrEmail === 'string' ? userOrEmail : userOrEmail?.email;
  if (!email) return MAX_ACTIVE_SUBJECTS_REGISTERED;
  return isGuestEmail(email) ? MAX_ACTIVE_SUBJECTS_GUEST : MAX_ACTIVE_SUBJECTS_REGISTERED;
}

function isGuestAccount(userOrEmail) {
  const email = typeof userOrEmail === 'string' ? userOrEmail : userOrEmail?.email;
  return Boolean(email && isGuestEmail(email));
}

async function resolveUserEmail(userOrId) {
  if (typeof userOrId === 'object' && userOrId?.email) {
    return userOrId.email;
  }
  const userId = typeof userOrId === 'object' ? userOrId.id : userOrId;
  const { rows } = await db.query('SELECT email FROM users WHERE id = $1 LIMIT 1', [userId]);
  return rows[0]?.email || null;
}

function isSubjectMastered(subjectProgress) {
  if (subjectProgress.totalCards === 0) return true;
  return subjectProgress.progressPercent >= 100;
}

function countActiveSlots(subjectsWithProgress) {
  return subjectsWithProgress.filter((s) => !isSubjectMastered(s)).length;
}

function buildQuota(activeSlots, limit) {
  const spotsRemaining = Math.max(0, limit - activeSlots);
  return {
    limit,
    activeSlots,
    spotsRemaining,
    canEnrollMore: spotsRemaining > 0,
    isGuest: limit === MAX_ACTIVE_SUBJECTS_GUEST,
  };
}

/** Staff admins are not subject to enrollment caps. */
function staffEnrollmentQuota() {
  return {
    limit: MAX_ACTIVE_SUBJECTS_REGISTERED,
    activeSlots: 0,
    spotsRemaining: MAX_ACTIVE_SUBJECTS_REGISTERED,
    canEnrollMore: true,
    isGuest: false,
  };
}

function deriveQuotaFromSubjects(subjectsWithProgress, limit = MAX_ACTIVE_SUBJECTS_REGISTERED) {
  return buildQuota(countActiveSlots(subjectsWithProgress), limit);
}

function quotaForUser(subjectsWithProgress, userOrEmail) {
  const limit = getMaxActiveSubjects(userOrEmail);
  const quota = deriveQuotaFromSubjects(subjectsWithProgress, limit);
  return { ...quota, isGuest: isGuestAccount(userOrEmail) };
}

async function getEnrollmentQuota(userOrId) {
  const email = await resolveUserEmail(userOrId);
  const userId = typeof userOrId === 'object' ? userOrId.id : userOrId;
  const enrolledIds = await getEnrolledSubjectIds(userId);
  if (enrolledIds.length === 0) {
    return buildQuota(0, getMaxActiveSubjects(email));
  }
  const subjects = await getSubjectsWithProgress(userId, enrolledIds);
  return quotaForUser(subjects, email);
}

function createLimitError(spotsRemaining, requested, userOrEmail) {
  const limit = getMaxActiveSubjects(userOrEmail);
  const isGuest = isGuestAccount(userOrEmail);
  let message;
  if (spotsRemaining === 0) {
    message = isGuest
      ? GUEST_AT_LIMIT_MESSAGE
      : `You can study up to ${limit} subjects at a time. Master a subject or leave one from your dashboard to add another.`;
  } else {
    message = `You can add ${spotsRemaining} more subject${spotsRemaining === 1 ? '' : 's'} right now (maximum ${limit} active at a time).`;
  }
  const err = new Error(message);
  err.status = 422;
  err.code = 'SUBJECT_LIMIT_REACHED';
  err.spotsRemaining = spotsRemaining;
  err.requested = requested;
  return err;
}

async function assertCanEnrollSubjects(userOrId, subjectIds) {
  const email = await resolveUserEmail(userOrId);
  const userId = typeof userOrId === 'object' ? userOrId.id : userOrId;
  const unique = [...new Set(subjectIds.filter((id) => typeof id === 'string' && id.trim()))];
  if (unique.length === 0) return { newIds: [], quota: await getEnrollmentQuota(userOrId) };

  const enrolledIds = await getEnrolledSubjectIds(userId);
  const enrolledSet = new Set(enrolledIds);
  const newIds = unique.filter((id) => !enrolledSet.has(id));

  if (newIds.length === 0) {
    return { newIds: [], quota: await getEnrollmentQuota(userOrId) };
  }

  const subjects = enrolledIds.length ? await getSubjectsWithProgress(userId, enrolledIds) : [];
  const quota = quotaForUser(subjects, email);

  if (newIds.length > quota.spotsRemaining) {
    throw createLimitError(quota.spotsRemaining, newIds.length, email);
  }

  return { newIds, quota };
}

module.exports = {
  MAX_ACTIVE_SUBJECTS,
  MAX_ACTIVE_SUBJECTS_GUEST,
  MAX_ACTIVE_SUBJECTS_REGISTERED,
  GUEST_AT_LIMIT_MESSAGE,
  getMaxActiveSubjects,
  isGuestAccount,
  resolveUserEmail,
  isSubjectMastered,
  countActiveSlots,
  buildQuota,
  staffEnrollmentQuota,
  deriveQuotaFromSubjects,
  quotaForUser,
  getEnrollmentQuota,
  assertCanEnrollSubjects,
  createLimitError,
};
