import { describe, expect, it } from 'vitest';
import {
  deriveEnrollmentQuota,
  enrollmentLimitApplies,
  formatAtLimitMessage,
  getMaxActiveSubjects,
  GUEST_AT_LIMIT_MESSAGE,
  usesLearnerEnrollment,
} from './enrollmentQuota';

describe('usesLearnerEnrollment', () => {
  it('applies to learners and guests', () => {
    expect(usesLearnerEnrollment({ role: 'USER' })).toBe(true);
    expect(usesLearnerEnrollment({ role: 'GUEST' })).toBe(true);
  });

  it('applies to staff only in learner preview', () => {
    expect(usesLearnerEnrollment({ role: 'ADMIN' }, true)).toBe(true);
    expect(usesLearnerEnrollment({ role: 'SUPER_ADMIN' }, true)).toBe(true);
    expect(usesLearnerEnrollment({ role: 'ADMIN' }, false)).toBe(false);
    expect(usesLearnerEnrollment({ role: 'SUPER_ADMIN' }, false)).toBe(false);
  });
});

describe('enrollmentLimitApplies', () => {
  it('applies to learners and guests only', () => {
    expect(enrollmentLimitApplies({ role: 'USER' })).toBe(true);
    expect(enrollmentLimitApplies({ role: 'GUEST' })).toBe(true);
    expect(enrollmentLimitApplies({ role: 'ADMIN' })).toBe(false);
    expect(enrollmentLimitApplies({ role: 'SUPER_ADMIN' })).toBe(false);
  });

  it('does not apply to staff in learner preview', () => {
    expect(enrollmentLimitApplies({ role: 'ADMIN' })).toBe(false);
    expect(enrollmentLimitApplies({ role: 'SUPER_ADMIN' })).toBe(false);
  });
});

describe('getMaxActiveSubjects', () => {
  it('returns 3 for guests and 5 for registered users', () => {
    expect(getMaxActiveSubjects({ isGuest: true, role: 'USER' })).toBe(3);
    expect(getMaxActiveSubjects({ email: 'guest-x@guest.memora.local', role: 'USER' })).toBe(3);
    expect(getMaxActiveSubjects({ email: 'user@example.com', role: 'USER' })).toBe(5);
  });
});

describe('deriveEnrollmentQuota', () => {
  it('caps guests at 3 active subjects', () => {
    const guest = { isGuest: true, role: 'USER' };
    const subjects = [
      { totalCards: 10, progressPercent: 10 },
      { totalCards: 10, progressPercent: 20 },
      { totalCards: 10, progressPercent: 30 },
    ];
    expect(deriveEnrollmentQuota(subjects, guest).canEnrollMore).toBe(false);
  });

  it('allows registered users up to 5 active subjects', () => {
    const user = { email: 'user@example.com', role: 'USER' };
    const subjects = [
      { totalCards: 10, progressPercent: 10 },
      { totalCards: 10, progressPercent: 20 },
      { totalCards: 10, progressPercent: 30 },
      { totalCards: 10, progressPercent: 40 },
    ];
    expect(deriveEnrollmentQuota(subjects, user).spotsRemaining).toBe(1);
  });
});

describe('formatAtLimitMessage', () => {
  it('uses signup message for guests', () => {
    expect(formatAtLimitMessage({ isGuest: true, role: 'USER' })).toBe(GUEST_AT_LIMIT_MESSAGE);
  });

  it('uses master/leave hint for registered users', () => {
    expect(formatAtLimitMessage({ email: 'user@example.com', role: 'USER' })).toMatch(/5 active subjects/);
    expect(formatAtLimitMessage({ email: 'user@example.com', role: 'USER' })).toMatch(/Master a subject/);
  });
});
