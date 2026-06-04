const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./pg');
const { hashToken, generateToken, verificationExpiry } = require('./authTokens');
const { sendVerificationEmail } = require('./email');
const {
  USER_PUBLIC_COLUMNS,
  authCreated,
  authSuccess,
} = require('./authUser');
const { GUEST_EMAIL_SUFFIX, isGuestEmail } = require('./guestIdentity');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function createGuest() {
  const subjectsRes = await db.query('SELECT id FROM subjects LIMIT 1');
  if (!subjectsRes.rows[0]) {
    return {
      status: 503,
      body: { error: 'No subjects available yet. Please try again later.' },
    };
  }

  const userId = randomUUID();
  const email = `guest-${userId}${GUEST_EMAIL_SUFFIX}`;
  const passwordHash = await bcrypt.hash(`${randomUUID()}${randomUUID()}`, 10);
  const { rows } = await db.query(
    `INSERT INTO users (id, name, email, password_hash, email_verified_at, role, created_at)
     VALUES ($1, $2, $3, $4, NOW(), 'USER', NOW())
     RETURNING ${USER_PUBLIC_COLUMNS}`,
    [userId, 'Guest', email, passwordHash]
  );
  return authCreated(rows[0]);
}

async function upgradeGuest(userId, { name, email, password }) {
  const trimmedName = (name || '').trim();
  const trimmedEmail = (email || '').trim().toLowerCase();

  if (!trimmedName) return { status: 400, body: { error: 'Name is required' } };
  if (!EMAIL_RE.test(trimmedEmail)) {
    return { status: 400, body: { error: 'Valid email is required' } };
  }
  if (!password || password.length < 8) {
    return { status: 400, body: { error: 'Password must be at least 8 characters' } };
  }

  const current = await db.query(
    `SELECT id, email FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );
  if (!current.rows[0]) return { status: 401, body: { error: 'User not found' } };
  if (!isGuestEmail(current.rows[0].email)) {
    return { status: 400, body: { error: 'This account is already registered' } };
  }

  const taken = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2 LIMIT 1', [
    trimmedEmail,
    userId,
  ]);
  if (taken.rows[0]) return { status: 409, body: { error: 'Email already registered' } };

  const passwordHash = await bcrypt.hash(password, 10);
  const verifyToken = generateToken();
  const verifyHash = hashToken(verifyToken);
  const verifyExpires = verificationExpiry();

  const { rows } = await db.query(
    `UPDATE users SET name = $1, email = $2, password_hash = $3,
                      email_verified_at = NULL,
                      verification_token_hash = $4,
                      verification_token_expires = $5
     WHERE id = $6
     RETURNING ${USER_PUBLIC_COLUMNS}`,
    [trimmedName, trimmedEmail, passwordHash, verifyHash, verifyExpires, userId]
  );
  await sendVerificationEmail(trimmedEmail, verifyToken);
  const result = authSuccess(rows[0]);
  result.body.message = 'Account created — check your email to verify.';
  return result;
}

module.exports = {
  GUEST_EMAIL_SUFFIX,
  isGuestEmail,
  createGuest,
  upgradeGuest,
};
