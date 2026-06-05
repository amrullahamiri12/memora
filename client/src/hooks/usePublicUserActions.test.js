import { describe, it, expect } from 'vitest';
import { isStaff } from '../utils/roles';

/**
 * Public nav menu rules (mirrors usePublicUserActions) — staff always get the same
 * marketing-header menu regardless of learner-preview session state.
 */
function buildPublicMenuLinks(user, studentPreviewActive) {
  const staff = isStaff(user?.role);
  if (!user) return { links: [], showLearnerView: false, showExitLearnerView: false };

  if (staff) {
    return {
      links: [
        { to: '/admin/dashboard', label: 'Dashboard' },
        { to: '/account', label: 'Account' },
      ],
      showLearnerView: !studentPreviewActive,
      showExitLearnerView: studentPreviewActive,
    };
  }

  return {
    links: [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/profile', label: 'Profile' },
      { to: '/account', label: 'Account' },
    ],
    showLearnerView: false,
    showExitLearnerView: false,
  };
}

describe('public user menu (staff consistency)', () => {
  it('gives super admin and admin the same links on marketing pages', () => {
    const superAdmin = buildPublicMenuLinks({ role: 'SUPER_ADMIN' }, false);
    const admin = buildPublicMenuLinks({ role: 'ADMIN' }, false);

    expect(superAdmin.links).toEqual(admin.links);
    expect(superAdmin.links).toEqual([
      { to: '/admin/dashboard', label: 'Dashboard' },
      { to: '/account', label: 'Account' },
    ]);
    expect(superAdmin.showLearnerView).toBe(true);
  });

  it('keeps admin menu when staff has learner preview active', () => {
    const withPreview = buildPublicMenuLinks({ role: 'ADMIN' }, true);
    const withoutPreview = buildPublicMenuLinks({ role: 'SUPER_ADMIN' }, false);

    expect(withPreview.links).toEqual(withoutPreview.links);
    expect(withPreview.showLearnerView).toBe(false);
    expect(withPreview.showExitLearnerView).toBe(true);
  });

  it('keeps learner menu for non-staff users', () => {
    const learner = buildPublicMenuLinks({ role: 'USER' }, false);
    expect(learner.links).toHaveLength(3);
    expect(learner.links[0].label).toBe('Dashboard');
    expect(learner.links[1].label).toBe('Profile');
  });
});
