import { describe, expect, it } from 'vitest';
import { enrollmentLimitApplies, usesLearnerEnrollment } from './enrollmentQuota';

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
