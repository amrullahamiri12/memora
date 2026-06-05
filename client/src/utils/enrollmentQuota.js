export const MAX_ACTIVE_SUBJECTS = 3;

/** Shown when the learner is at the active-subject cap. */
export const AT_ACTIVE_LIMIT_HINT = `Master a subject or leave one from your list below to add another.`;

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
