const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./pg');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function login(email, password) {
  const { rows } = await db.query(
    `SELECT id, name, email, role, password_hash AS "passwordHash"
     FROM users WHERE email = $1 LIMIT 1`,
    [email]
  );
  const user = rows[0];
  if (!user) return { status: 401, body: { error: 'Invalid email or password' } };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { status: 401, body: { error: 'Invalid email or password' } };

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  return {
    status: 200,
    body: {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    },
  };
}

async function register({ name, email, password, subjectIds }) {
  const trimmedName = (name || '').trim();
  const trimmedEmail = (email || '').trim();
  const ids = (subjectIds || []).filter((id) => typeof id === 'string' && id.trim());

  if (!trimmedName) return { status: 400, body: { error: 'Name is required' } };
  if (!EMAIL_RE.test(trimmedEmail)) return { status: 400, body: { error: 'Valid email is required' } };
  if (!password || password.length < 8) {
    return { status: 400, body: { error: 'Password must be at least 8 characters' } };
  }
  if (ids.length === 0) {
    return { status: 400, body: { error: 'Select at least one subject to practice' } };
  }

  const existing = await db.query(`SELECT id FROM users WHERE email = $1`, [trimmedEmail]);
  if (existing.rows[0]) return { status: 409, body: { error: 'Email already registered' } };

  const subjects = await db.query(`SELECT id FROM subjects WHERE id = ANY($1::text[])`, [ids]);
  if (subjects.rows.length === 0) {
    return {
      status: 400,
      body: { error: 'No subjects available. Run npm run db:seed in the server folder.' },
    };
  }

  const userId = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  const { getPool } = require('./pg');
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO users (id, name, email, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, 'USER', NOW())
       RETURNING id, name, email, role`,
      [userId, trimmedName, trimmedEmail, passwordHash]
    );
    for (const subjectId of subjects.rows.map((r) => r.id)) {
      await client.query(
        `INSERT INTO user_subjects (id, user_id, subject_id, created_at)
         VALUES ($1, $2, $3, NOW()) ON CONFLICT (user_id, subject_id) DO NOTHING`,
        [randomUUID(), userId, subjectId]
      );
    }
    await client.query('COMMIT');
    const user = rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
    return { status: 201, body: { token, user } };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function me(userId) {
  const { rows } = await db.query(
    `SELECT id, name, email, role FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );
  if (!rows[0]) return { status: 401, body: { error: 'User not found' } };
  return { status: 200, body: { user: rows[0] } };
}

async function catalog() {
  const { rows } = await db.query(
    `SELECT s.id, s.name, COUNT(t.id)::int AS "topicCount"
     FROM subjects s
     LEFT JOIN topics t ON t.subject_id = s.id
     GROUP BY s.id, s.name
     ORDER BY s.name ASC`
  );
  return rows;
}

module.exports = { login, register, me, catalog };
