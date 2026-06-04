const { publicUser, isEmailVerified, deactivatedAccountResponse } = require('../lib/authUser');

describe('authUser', () => {
  it('marks guests and staff as verified', () => {
    expect(isEmailVerified({ email: 'x@guest.memora.local', role: 'USER' })).toBe(true);
    expect(isEmailVerified({ email: 'a@b.com', role: 'ADMIN' })).toBe(true);
    expect(isEmailVerified({ email: 'a@b.com', role: 'USER', emailVerifiedAt: null })).toBe(
      false
    );
  });

  it('publicUser omits secrets and exposes flags', () => {
    const user = publicUser({
      id: 'u1',
      name: 'Test',
      email: 'learner@example.com',
      role: 'USER',
      passwordHash: 'hash',
      googleId: null,
      emailVerifiedAt: new Date(),
      deactivatedAt: null,
    });
    expect(user.passwordHash).toBeUndefined();
    expect(user.hasPassword).toBe(true);
    expect(user.active).toBe(true);
    expect(user.emailVerified).toBe(true);
  });

  it('returns standard deactivated response', () => {
    expect(deactivatedAccountResponse().status).toBe(403);
    expect(deactivatedAccountResponse().body.code).toBe('ACCOUNT_DEACTIVATED');
  });
});
