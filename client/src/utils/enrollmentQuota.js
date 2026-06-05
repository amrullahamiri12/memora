import { isStaff } from './roles';
import { isStudentViewActive } from './studentView';

export const MAX_ACTIVE_SUBJECTS = 3;

/** Shown when the learner is at the active-subject cap. */
export const AT_ACTIVE_LIMIT_HINT = `Master a subject or leave one from your list below to add another.`;

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

export function deriveEnrollmentQuota(subjects = []) {
  const activeSlots = subjects.filter((s) => !isSubjectMasteredForQuota(s)).length;
  const spotsRemaining = Math.max(0, MAX_ACTIVE_SUBJECTS - activeSlots);
  return {
    limit: MAX_ACTIVE_SUBJECTS,
    activeSlots,
    spotsRemaining,
    canEnrollMore: spotsRemaining > 0,
  };
}
