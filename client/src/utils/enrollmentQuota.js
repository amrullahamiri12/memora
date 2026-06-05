export const MAX_ACTIVE_SUBJECTS = 3;

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
