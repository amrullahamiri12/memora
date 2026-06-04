const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('./pgPool');

async function loginWithDatabase(email, password) {
  const pool = getPool();
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
}

module.exports = { loginWithDatabase };
