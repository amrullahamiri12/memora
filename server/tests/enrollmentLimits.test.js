const {
  MAX_ACTIVE_SUBJECTS,
  isSubjectMastered,
  countActiveSlots,
  deriveQuotaFromSubjects,
  createLimitError,
} = require('../lib/enrollmentLimits');

function subject(overrides = {}) {
  return {
    id: 's1',
    name: 'Math',
    totalCards: 10,
    mastered: 0,
    progressPercent: 0,
    topicCount: 1,
    ...overrides,
  };
}

describe('enrollmentLimits', () => {
  describe('isSubjectMastered', () => {
    it('treats 100% progress as mastered', () => {
      expect(isSubjectMastered(subject({ progressPercent: 100, mastered: 10 }))).toBe(true);
    });

    it('treats partial progress as not mastered', () => {
      expect(isSubjectMastered(subject({ progressPercent: 50, mastered: 5 }))).toBe(false);
    });

    it('treats zero-card subjects as mastered for quota', () => {
      expect(isSubjectMastered(subject({ totalCards: 0, progressPercent: 0 }))).toBe(true);
    });
  });

  describe('countActiveSlots', () => {
    it('counts only non-mastered enrolled subjects', () => {
      const slots = countActiveSlots([
        subject({ id: 'a', progressPercent: 100, mastered: 10 }),
        subject({ id: 'b', progressPercent: 40, mastered: 4 }),
        subject({ id: 'c', progressPercent: 0, mastered: 0 }),
      ]);
      expect(slots).toBe(2);
    });

    it('does not count zero-card subjects as active', () => {
      const slots = countActiveSlots([
        subject({ id: 'a', totalCards: 0, progressPercent: 0 }),
        subject({ id: 'b', progressPercent: 20 }),
      ]);
      expect(slots).toBe(1);
    });
  });

  describe('deriveQuotaFromSubjects', () => {
    it('allows enrolling up to 3 when no active slots', () => {
      const quota = deriveQuotaFromSubjects([]);
      expect(quota).toEqual({
        limit: MAX_ACTIVE_SUBJECTS,
        activeSlots: 0,
        spotsRemaining: 3,
        canEnrollMore: true,
      });
    });

    it('blocks when 3 subjects are in progress', () => {
      const quota = deriveQuotaFromSubjects([
        subject({ id: 'a', progressPercent: 10 }),
        subject({ id: 'b', progressPercent: 20 }),
        subject({ id: 'c', progressPercent: 30 }),
      ]);
      expect(quota.activeSlots).toBe(3);
      expect(quota.spotsRemaining).toBe(0);
      expect(quota.canEnrollMore).toBe(false);
    });

    it('frees slots when subjects are mastered', () => {
      const quota = deriveQuotaFromSubjects([
        subject({ id: 'a', progressPercent: 100, mastered: 10 }),
        subject({ id: 'b', progressPercent: 100, mastered: 8 }),
        subject({ id: 'c', progressPercent: 100, mastered: 5 }),
        subject({ id: 'd', progressPercent: 25, mastered: 2 }),
      ]);
      expect(quota.activeSlots).toBe(1);
      expect(quota.spotsRemaining).toBe(2);
      expect(quota.canEnrollMore).toBe(true);
    });

    it('allows 2 more when 1 in progress among many mastered', () => {
      const quota = deriveQuotaFromSubjects([
        subject({ id: 'a', progressPercent: 100 }),
        subject({ id: 'b', progressPercent: 100 }),
        subject({ id: 'c', progressPercent: 100 }),
        subject({ id: 'd', progressPercent: 50 }),
      ]);
      expect(quota.spotsRemaining).toBe(2);
    });
  });

  describe('createLimitError', () => {
    it('returns typed limit error', () => {
      const err = createLimitError(0, 1);
      expect(err.status).toBe(422);
      expect(err.code).toBe('SUBJECT_LIMIT_REACHED');
      expect(err.message).toMatch(/3 subjects at a time/i);
    });

    it('mentions remaining spots when partially blocked', () => {
      const err = createLimitError(1, 2);
      expect(err.message).toMatch(/add 1 more subject/i);
    });
  });
});
