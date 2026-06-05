const {
  MAX_ACTIVE_SUBJECTS_GUEST,
  MAX_ACTIVE_SUBJECTS_REGISTERED,
  GUEST_AT_LIMIT_MESSAGE,
  isSubjectMastered,
  countActiveSlots,
  deriveQuotaFromSubjects,
  getMaxActiveSubjects,
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

const guestEmail = 'guest-abc@guest.memora.local';
const registeredEmail = 'user@example.com';

describe('enrollmentLimits', () => {
  describe('getMaxActiveSubjects', () => {
    it('returns 3 for guest email', () => {
      expect(getMaxActiveSubjects(guestEmail)).toBe(3);
      expect(getMaxActiveSubjects({ email: guestEmail })).toBe(3);
    });

    it('returns 5 for registered email', () => {
      expect(getMaxActiveSubjects(registeredEmail)).toBe(5);
    });
  });

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
  });

  describe('deriveQuotaFromSubjects', () => {
    it('allows enrolling up to 3 for guests when no active slots', () => {
      const quota = deriveQuotaFromSubjects([], MAX_ACTIVE_SUBJECTS_GUEST);
      expect(quota).toEqual({
        limit: 3,
        activeSlots: 0,
        spotsRemaining: 3,
        canEnrollMore: true,
        isGuest: true,
      });
    });

    it('blocks guest when 3 subjects are in progress', () => {
      const quota = deriveQuotaFromSubjects(
        [
          subject({ id: 'a', progressPercent: 10 }),
          subject({ id: 'b', progressPercent: 20 }),
          subject({ id: 'c', progressPercent: 30 }),
        ],
        MAX_ACTIVE_SUBJECTS_GUEST
      );
      expect(quota.activeSlots).toBe(3);
      expect(quota.spotsRemaining).toBe(0);
      expect(quota.canEnrollMore).toBe(false);
    });

    it('allows registered users up to 5 active subjects', () => {
      const quota = deriveQuotaFromSubjects(
        [
          subject({ id: 'a', progressPercent: 10 }),
          subject({ id: 'b', progressPercent: 20 }),
          subject({ id: 'c', progressPercent: 30 }),
          subject({ id: 'd', progressPercent: 40 }),
        ],
        MAX_ACTIVE_SUBJECTS_REGISTERED
      );
      expect(quota.activeSlots).toBe(4);
      expect(quota.spotsRemaining).toBe(1);
      expect(quota.canEnrollMore).toBe(true);
    });

    it('blocks registered at 5 active subjects', () => {
      const quota = deriveQuotaFromSubjects(
        [
          subject({ id: 'a', progressPercent: 10 }),
          subject({ id: 'b', progressPercent: 20 }),
          subject({ id: 'c', progressPercent: 30 }),
          subject({ id: 'd', progressPercent: 40 }),
          subject({ id: 'e', progressPercent: 50 }),
        ],
        MAX_ACTIVE_SUBJECTS_REGISTERED
      );
      expect(quota.spotsRemaining).toBe(0);
      expect(quota.canEnrollMore).toBe(false);
    });
  });

  describe('createLimitError', () => {
    it('returns guest signup message at cap', () => {
      const err = createLimitError(0, 1, guestEmail);
      expect(err.status).toBe(422);
      expect(err.code).toBe('SUBJECT_LIMIT_REACHED');
      expect(err.message).toBe(GUEST_AT_LIMIT_MESSAGE);
    });

    it('returns registered master/leave message at cap', () => {
      const err = createLimitError(0, 1, registeredEmail);
      expect(err.message).toMatch(/5 subjects at a time/i);
      expect(err.message).toMatch(/Master a subject/i);
    });

    it('mentions remaining spots when partially blocked', () => {
      const err = createLimitError(1, 2, registeredEmail);
      expect(err.message).toMatch(/add 1 more subject/i);
    });
  });
});
