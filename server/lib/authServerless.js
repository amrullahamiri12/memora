const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { withPool } = require('./pgPool');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function loginWithDatabase(email, password) {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, password_hash AS "passwordHash"
       FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );

    const user = rows[0];
    if (!user) {
      return { status: 401, body: { error: 'Invalid email or password' } };
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return { status: 401, body: { error: 'Invalid email or password' } };
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    return {
      status: 200,
      body: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    };
  });
}

async function getUserById(userId) {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT id, name, email, role FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  });
}

async function getSubjectsCatalog() {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT s.id, s.name, COUNT(t.id)::int AS "topicCount"
       FROM subjects s
       LEFT JOIN topics t ON t.subject_id = s.id
       GROUP BY s.id, s.name
       ORDER BY s.name ASC`
    );
    return rows;
  });
}

async function registerUser({ name, email, password, subjectIds }) {
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';
  const ids = (subjectIds || []).filter((id) => typeof id === 'string' && id.trim());

  if (!trimmedName) {
    return { status: 400, body: { error: 'Name is required' } };
  }
  if (!EMAIL_RE.test(trimmedEmail)) {
    return { status: 400, body: { error: 'Valid email is required' } };
  }
  if (typeof password !== 'string' || password.length < 8) {
    return { status: 400, body: { error: 'Password must be at least 8 characters' } };
  }
  if (ids.length === 0) {
    return { status: 400, body: { error: 'Select at least one subject to practice' } };
  }

  return withPool(async (pool) => {
    const existing = await pool.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [
      trimmedEmail,
    ]);
    if (existing.rows[0]) {
      return { status: 409, body: { error: 'Email already registered' } };
    }

    const subjectCheck = await pool.query(
      `SELECT id FROM subjects WHERE id = ANY($1::text[])`,
      [ids]
    );
    if (subjectCheck.rows.length === 0) {
      return {
        status: 400,
        body: {
          error:
            'No subjects available. An admin must seed the database (npm run db:seed) before you can register.',
        },
      };
    }

    const validIds = subjectCheck.rows.map((r) => r.id);
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const userResult = await client.query(
        `INSERT INTO users (id, name, email, password_hash, role, created_at)
         VALUES ($1, $2, $3, $4, 'USER', NOW())
         RETURNING id, name, email, role`,
        [userId, trimmedName, trimmedEmail, passwordHash]
      );
      const user = userResult.rows[0];

      for (const subjectId of validIds) {
        await client.query(
          `INSERT INTO user_subjects (id, user_id, subject_id, created_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (user_id, subject_id) DO NOTHING`,
          [randomUUID(), userId, subjectId]
        );
      }

      await client.query('COMMIT');

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
  });
}

module.exports = { loginWithDatabase, getUserById, getSubjectsCatalog, registerUser };
