const {
  canAssignRole,
  canEditUser,
  canDeleteUser,
  assertRoleChangeAllowed,
} = require('../lib/roles');

describe('roles', () => {
  const superAdmin = { id: '1', role: 'SUPER_ADMIN' };
  const admin = { id: '2', role: 'ADMIN' };
  const user = { id: '3', role: 'USER' };

  it('only super admin can assign super admin role', () => {
    expect(canAssignRole('SUPER_ADMIN', 'SUPER_ADMIN')).toBe(true);
    expect(canAssignRole('ADMIN', 'SUPER_ADMIN')).toBe(false);
    expect(canAssignRole('ADMIN', 'ADMIN')).toBe(true);
  });

  it('blocks non-super-admin from editing super admin', () => {
    expect(canEditUser(admin, superAdmin)).toBe(false);
    expect(canEditUser(superAdmin, superAdmin)).toBe(true);
  });

  it('prevents self-delete and protects super admins', () => {
    expect(canDeleteUser(admin, admin)).toBe(false);
    expect(canDeleteUser(admin, superAdmin)).toBe(false);
    expect(canDeleteUser(superAdmin, user)).toBe(true);
  });

  it('assertRoleChangeAllowed returns messages for forbidden changes', () => {
    expect(
      assertRoleChangeAllowed(admin, superAdmin, 'ADMIN')
    ).toContain('super admin');
    expect(
      assertRoleChangeAllowed(superAdmin, superAdmin, 'ADMIN')
    ).toContain('cannot remove your own');
  });
});
