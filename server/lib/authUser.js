const { isGuestEmail } = require('./guestIdentity');

const USER_PUBLIC_COLUMNS = `id, name, email, role,
  password_hash AS "passwordHash",
  google_id AS "googleId",
  email_verified_at AS "emailVerifiedAt"`;

function isStaffRole(role) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

function isEmailVerified(row) {
  if (!row) return false;
  if (isGuestEmail(row.email)) return true;
  if (isStaffRole(row.role)) return true;
  return Boolean(row.emailVerifiedAt);
}

function withGuestFlag(user) {
  if (!user) return user;
  return { ...user, isGuest: isGuestEmail(user.email) };
}

function publicUser(row) {
  if (!row) return row;
  return withGuestFlag({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    emailVerified: isEmailVerified(row),
    hasPassword: Boolean(row.passwordHash),
    hasGoogle: Boolean(row.googleId),
  });
}

function issueJwt(userId) {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function authSuccess(row) {
  const user = publicUser(row);
  return {
    status: 200,
    body: { token: issueJwt(user.id), user },
  };
}

function authCreated(row) {
  const user = publicUser(row);
  return {
    status: 201,
    body: { token: issueJwt(user.id), user },
  };
}

function verificationRequiredResponse() {
  return {
    status: 403,
    body: {
      error: 'Please verify your email before continuing',
      code: 'EMAIL_NOT_VERIFIED',
    },
  };
}

module.exports = {
  USER_PUBLIC_COLUMNS,
  isStaffRole,
  isEmailVerified,
  withGuestFlag,
  publicUser,
  issueJwt,
  authSuccess,
  authCreated,
  verificationRequiredResponse,
};
