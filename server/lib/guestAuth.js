const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./pg');

const GUEST_EMAIL_SUFFIX = '@guest.memora.local';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isGuestEmail(email) {
  return typeof email === 'string' && email.endsWith(GUEST_EMAIL_SUFFIX);
}

function withGuestFlag(user) {
  if (!user) return user;
  return { ...user, isGuest: isGuestEmail(user.email) };
}

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
    `INSERT INTO users (id, name, email, password_hash, role, created_at)
     VALUES ($1, $2, $3, $4, 'USER', NOW())
     RETURNING id, name, email, role`,
    [userId, 'Guest', email, passwordHash]
  );
  const user = withGuestFlag(rows[0]);
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  return { status: 201, body: { token, user } };
}

async function upgradeGuest(userId, { name, email, password }) {
  const trimmedName = (name || '').trim();
  const trimmedEmail = (email || '').trim();

  if (!trimmedName) return { status: 400, body: { error: 'Name is required' } };
  if (!EMAIL_RE.test(trimmedEmail)) {
    return { status: 400, body: { error: 'Valid email is required' } };
  }
  if (!password || password.length < 8) {
    return { status: 400, body: { error: 'Password must be at least 8 characters' } };
  }

  const current = await db.query('SELECT id, email FROM users WHERE id = $1 LIMIT 1', [userId]);
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
  const { rows } = await db.query(
    `UPDATE users SET name = $1, email = $2, password_hash = $3
     WHERE id = $4
     RETURNING id, name, email, role`,
    [trimmedName, trimmedEmail, passwordHash, userId]
  );
  const user = withGuestFlag(rows[0]);
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  return {
    status: 200,
    body: { token, user, message: 'Account created — your study progress is saved.' },
  };
}

module.exports = {
  GUEST_EMAIL_SUFFIX,
  isGuestEmail,
  withGuestFlag,
  createGuest,
  upgradeGuest,
};
