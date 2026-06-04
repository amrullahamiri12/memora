import { describe, it, expect } from 'vitest';
import { isStaff, isSuperAdmin, canEditUser, canDeleteUser, roleLabel } from './roles';

describe('roles (client)', () => {
  const superAdmin = { id: '1', role: 'SUPER_ADMIN' };
  const admin = { id: '2', role: 'ADMIN' };
  const user = { id: '3', role: 'USER' };

  it('identifies staff roles', () => {
    expect(isStaff('ADMIN')).toBe(true);
    expect(isStaff('USER')).toBe(false);
    expect(isSuperAdmin('SUPER_ADMIN')).toBe(true);
  });

  it('mirrors server permission rules for edit/delete', () => {
    expect(canEditUser(admin, superAdmin)).toBe(false);
    expect(canDeleteUser(admin, admin)).toBe(false);
    expect(canDeleteUser(superAdmin, user)).toBe(true);
  });

  it('formats role labels', () => {
    expect(roleLabel('SUPER_ADMIN')).toBe('Super admin');
    expect(roleLabel('USER')).toBe('User');
  });
});
