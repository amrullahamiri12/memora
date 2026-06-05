import { describe, expect, it } from 'vitest';
import {
  isLearnerViewRequest,
  shouldRestrictToEnrolledSubjects,
} from '../lib/learnerView.js';

describe('learnerView', () => {
  it('detects learner view header', () => {
    expect(isLearnerViewRequest({ 'x-learner-view': '1' })).toBe(true);
    expect(isLearnerViewRequest({ 'X-Learner-View': '1' })).toBe(true);
    expect(isLearnerViewRequest({})).toBe(false);
  });

  it('restricts staff only in learner view', () => {
    const admin = { role: 'ADMIN' };
    const learner = { role: 'USER' };
    expect(shouldRestrictToEnrolledSubjects(learner, false)).toBe(true);
    expect(shouldRestrictToEnrolledSubjects(admin, false)).toBe(false);
    expect(shouldRestrictToEnrolledSubjects(admin, true)).toBe(true);
  });
});
