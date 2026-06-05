import { isGuestUser } from './guest';
import { isStaff } from './roles';
import { isStudentViewActive } from './studentView';

export const MAX_ACTIVE_SUBJECTS_GUEST = 3;
export const MAX_ACTIVE_SUBJECTS_REGISTERED = 5;

/** @deprecated use getMaxActiveSubjects */
export const MAX_ACTIVE_SUBJECTS = MAX_ACTIVE_SUBJECTS_GUEST;

export const GUEST_AT_LIMIT_MESSAGE =
  'You already have 3 active subjects. Sign up for a free account to practice more subjects.';

export const REGISTERED_AT_LIMIT_HINT =
  'Master a subject or leave one from your list below to add another.';

export const GUEST_UPSELL_HINT = 'Sign up to study up to 5 subjects at a time.';

/** Shown when the learner is at the active-subject cap (registered). */
export const AT_ACTIVE_LIMIT_HINT = REGISTERED_AT_LIMIT_HINT;

export function getMaxActiveSubjects(user) {
  if (!user) return MAX_ACTIVE_SUBJECTS_REGISTERED;
  return isGuestUser(user) ? MAX_ACTIVE_SUBJECTS_GUEST : MAX_ACTIVE_SUBJECTS_REGISTERED;
}

/** Learners, guests, and staff in learner preview share the same enrollment UX. */
export function usesLearnerEnrollment(user, studentPreview) {
  if (!user) return false;
  if (!isStaff(user.role)) return true;
  return Boolean(studentPreview ?? isStudentViewActive());
}

/** Active-subject cap applies to learners and guests only — not admin or super admin. */
export function enrollmentLimitApplies(user) {
  return Boolean(user && !isStaff(user.role));
}

export function isSubjectMasteredForQuota(subject) {
  if (!subject) return false;
  if ((subject.totalCards || 0) === 0) return true;
  return (subject.progressPercent || 0) >= 100;
}

export function deriveEnrollmentQuota(subjects = [], user = null) {
  const limit = getMaxActiveSubjects(user);
  const activeSlots = subjects.filter((s) => !isSubjectMasteredForQuota(s)).length;
  const spotsRemaining = Math.max(0, limit - activeSlots);
  return {
    limit,
    activeSlots,
    spotsRemaining,
    canEnrollMore: spotsRemaining > 0,
    isGuest: Boolean(user && isGuestUser(user)),
  };
}

export function formatAtLimitMessage(user) {
  if (user && isGuestUser(user)) {
    return GUEST_AT_LIMIT_MESSAGE;
  }
  const limit = getMaxActiveSubjects(user);
  return `You already have ${limit} active subjects. ${REGISTERED_AT_LIMIT_HINT}`;
}

export function formatEnrollmentLimitError(user) {
  return formatAtLimitMessage(user);
}
