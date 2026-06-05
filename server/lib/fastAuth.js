const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./pg');
const { isGuestEmail, createGuest, upgradeGuest } = require('./guestAuth');
const { hashToken, generateToken, verificationExpiry, resetExpiry } = require('./authTokens');
const {
  isEmailConfigured,
  emailSendFailureMessage,
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('./email');
const { verifyGoogleCredential } = require('./googleAuth');
const {
  USER_PUBLIC_COLUMNS,
  publicUser,
  authSuccess,
  authCreated,
  deactivatedAccountResponse,
  isUserActive,
} = require('./authUser');
const { closeAccount } = require('./userLifecycle');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function assignVerificationToken(userId) {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expires = verificationExpiry();
  await db.query(
    `UPDATE users SET verification_token_hash = $1, verification_token_expires = $2
     WHERE id = $3`,
    [tokenHash, expires, userId]
  );
  return token;
}

async function findUserByEmail(email) {
  const { rows } = await db.query(
    `SELECT ${USER_PUBLIC_COLUMNS} FROM users WHERE email = $1 LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function findUserById(userId) {
  const { rows } = await db.query(
    `SELECT ${USER_PUBLIC_COLUMNS} FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function login(email, password) {
  const trimmedEmail = (email || '').trim().toLowerCase();
  const user = await findUserByEmail(trimmedEmail);
  if (!user) {
    return { status: 401, body: { error: 'Invalid email or password' } };
  }
  if (user.deactivatedAt) {
    return deactivatedAccountResponse();
  }
  if (!user.passwordHash) {
    if (user.googleId) {
      return { status: 401, body: { error: 'This account uses Google sign-in' } };
    }
    return { status: 401, body: { error: 'Invalid email or password' } };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { status: 401, body: { error: 'Invalid email or password' } };

  return authSuccess(user);
}

async function register({ name, email, password, subjectIds }) {
  const trimmedName = (name || '').trim();
  const trimmedEmail = (email || '').trim().toLowerCase();
  const ids = (subjectIds || []).filter((id) => typeof id === 'string' && id.trim());

  if (!trimmedName) return { status: 400, body: { error: 'Name is required' } };
  if (!EMAIL_RE.test(trimmedEmail)) return { status: 400, body: { error: 'Valid email is required' } };
  if (!password || password.length < 8) {
    return { status: 400, body: { error: 'Password must be at least 8 characters' } };
  }
  if (ids.length === 0) {
    return { status: 400, body: { error: 'Select at least one subject to practice' } };
  }

  const { MAX_ACTIVE_SUBJECTS } = require('./enrollmentLimits');
  if (ids.length > MAX_ACTIVE_SUBJECTS) {
    return {
      status: 422,
      body: {
        error: `You can enroll in a maximum of ${MAX_ACTIVE_SUBJECTS} subjects at a time.`,
        code: 'SUBJECT_LIMIT_REACHED',
      },
    };
  }

  const existing = await findUserByEmail(trimmedEmail);
  if (existing) {
    if (existing.deactivatedAt) {
      return {
        status: 409,
        body: {
          error:
            'An account with this email was closed. Contact support to reactivate it, or use a different email.',
          code: 'ACCOUNT_DEACTIVATED',
        },
      };
    }
    return { status: 409, body: { error: 'Email already registered' } };
  }

  const subjects = await db.query(`SELECT id FROM subjects WHERE id = ANY($1::text[])`, [ids]);
  if (subjects.rows.length === 0) {
    return {
      status: 400,
      body: { error: 'No subjects available. Run npm run db:seed in the server folder.' },
    };
  }

  const userId = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  const verifyToken = generateToken();
  const verifyHash = hashToken(verifyToken);
  const verifyExpires = verificationExpiry();
  const { getPool } = require('./pg');
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO users (id, name, email, password_hash, role, created_at,
                          verification_token_hash, verification_token_expires)
       VALUES ($1, $2, $3, $4, 'USER', NOW(), $5, $6)
       RETURNING ${USER_PUBLIC_COLUMNS}`,
      [userId, trimmedName, trimmedEmail, passwordHash, verifyHash, verifyExpires]
    );
    for (const subjectId of subjects.rows.map((r) => r.id)) {
      await client.query(
        `INSERT INTO user_subjects (id, user_id, subject_id, created_at)
         VALUES ($1, $2, $3, NOW()) ON CONFLICT (user_id, subject_id) DO NOTHING`,
        [randomUUID(), userId, subjectId]
      );
    }
    await client.query('COMMIT');
    const emailResult = await sendVerificationEmail(trimmedEmail, verifyToken);
    const created = authCreated(rows[0]);
    created.body.emailSent = Boolean(emailResult?.ok);
    created.body.emailConfigured = isEmailConfigured();
    if (!created.body.emailSent && created.body.emailConfigured) {
      created.body.emailWarning = emailSendFailureMessage(emailResult);
    }
    return created;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function verifyEmail(token, { userId } = {}) {
  if (!token || typeof token !== 'string') {
    return { status: 400, body: { error: 'Verification token is required' } };
  }
  const trimmed = token.trim();
  const tokenHash = hashToken(trimmed);
  const { rows } = await db.query(
    `SELECT ${USER_PUBLIC_COLUMNS} FROM users
     WHERE verification_token_hash = $1
       AND verification_token_expires > NOW()
     LIMIT 1`,
    [tokenHash]
  );
  if (!rows[0]) {
    if (userId) {
      const current = await findUserById(userId);
      if (current?.emailVerifiedAt) {
        return authSuccess(current);
      }
    }

    const expired = await db.query(
      `SELECT id FROM users WHERE verification_token_hash = $1 LIMIT 1`,
      [tokenHash]
    );
    if (expired.rows[0]) {
      return {
        status: 400,
        body: {
          error: 'This verification link has expired. Sign in and request a new verification email.',
          code: 'VERIFICATION_EXPIRED',
        },
      };
    }

    return {
      status: 400,
      body: {
        error:
          'This link is invalid or was already used. Sign in and use the latest verification email, or request a new one.',
        code: 'VERIFICATION_INVALID',
      },
    };
  }

  const { rows: updated } = await db.query(
    `UPDATE users SET email_verified_at = NOW(),
                      verification_token_hash = NULL,
                      verification_token_expires = NULL
     WHERE id = $1
     RETURNING ${USER_PUBLIC_COLUMNS}`,
    [rows[0].id]
  );
  return authSuccess(updated[0]);
}

async function resendVerification(userId) {
  const user = await findUserById(userId);
  if (!user) return { status: 401, body: { error: 'User not found' } };
  if (isGuestEmail(user.email)) {
    return { status: 400, body: { error: 'Guest accounts do not need email verification' } };
  }
  if (user.emailVerifiedAt) {
    return { status: 400, body: { error: 'Email is already verified' } };
  }

  const token = await assignVerificationToken(userId);
  const emailResult = await sendVerificationEmail(user.email, token);
  if (!isEmailConfigured()) {
    return {
      status: 503,
      body: {
        error: 'Email delivery is not configured on the server',
        code: 'EMAIL_NOT_CONFIGURED',
        emailConfigured: false,
        emailSent: false,
      },
    };
  }
  if (!emailResult?.ok) {
    return {
      status: 503,
      body: {
        error: emailSendFailureMessage(emailResult),
        emailConfigured: true,
        emailSent: false,
      },
    };
  }
  return {
    status: 200,
    body: { message: 'Verification email sent', emailConfigured: true, emailSent: true },
  };
}

async function forgotPassword(email) {
  const trimmedEmail = (email || '').trim().toLowerCase();
  const generic = {
    status: 200,
    body: { message: 'If that email is registered, you will receive a reset link shortly.' },
  };

  if (!EMAIL_RE.test(trimmedEmail)) return generic;

  const user = await findUserByEmail(trimmedEmail);
  if (!user || isGuestEmail(user.email) || !user.passwordHash) return generic;

  const token = generateToken();
  const tokenHash = hashToken(token);
  await db.query(
    `UPDATE users SET reset_token_hash = $1, reset_token_expires = $2 WHERE id = $3`,
    [tokenHash, resetExpiry(), user.id]
  );
  await sendPasswordResetEmail(trimmedEmail, token);
  return generic;
}

async function resetPassword(token, password) {
  if (!token || typeof token !== 'string') {
    return { status: 400, body: { error: 'Reset token is required' } };
  }
  if (!password || password.length < 8) {
    return { status: 400, body: { error: 'Password must be at least 8 characters' } };
  }

  const tokenHash = hashToken(token.trim());
  const { rows } = await db.query(
    `SELECT id FROM users
     WHERE reset_token_hash = $1 AND reset_token_expires > NOW()
     LIMIT 1`,
    [tokenHash]
  );
  if (!rows[0]) {
    return { status: 400, body: { error: 'Invalid or expired reset link' } };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { rows: updated } = await db.query(
    `UPDATE users SET password_hash = $1,
                      reset_token_hash = NULL,
                      reset_token_expires = NULL
     WHERE id = $2
     RETURNING ${USER_PUBLIC_COLUMNS}`,
    [passwordHash, rows[0].id]
  );
  return authSuccess(updated[0]);
}

async function loginWithGoogle({ credential, subjectIds }) {
  if (!credential) {
    return { status: 400, body: { error: 'Google credential is required' } };
  }

  let profile;
  try {
    profile = await verifyGoogleCredential(credential);
  } catch (err) {
    return { status: 401, body: { error: err.message || 'Google sign-in failed' } };
  }

  const byGoogle = await db.query(
    `SELECT ${USER_PUBLIC_COLUMNS} FROM users WHERE google_id = $1 LIMIT 1`,
    [profile.googleId]
  );
  if (byGoogle.rows[0]) {
    if (!isUserActive(byGoogle.rows[0])) {
      return deactivatedAccountResponse();
    }
    return authSuccess(byGoogle.rows[0]);
  }

  const byEmail = await findUserByEmail(profile.email);
  if (byEmail) {
    if (!isUserActive(byEmail)) {
      return deactivatedAccountResponse();
    }
    if (isGuestEmail(byEmail.email)) {
      return { status: 409, body: { error: 'Use guest upgrade or a different Google account' } };
    }
    const { rows } = await db.query(
      `UPDATE users SET google_id = $1,
                        email_verified_at = COALESCE(email_verified_at, NOW())
       WHERE id = $2
       RETURNING ${USER_PUBLIC_COLUMNS}`,
      [profile.googleId, byEmail.id]
    );
    return authSuccess(rows[0]);
  }

  const ids = (subjectIds || []).filter((id) => typeof id === 'string' && id.trim());
  const { MAX_ACTIVE_SUBJECTS } = require('./enrollmentLimits');
  if (ids.length > MAX_ACTIVE_SUBJECTS) {
    return {
      status: 422,
      body: {
        error: `You can enroll in a maximum of ${MAX_ACTIVE_SUBJECTS} subjects at a time.`,
        code: 'SUBJECT_LIMIT_REACHED',
      },
    };
  }

  const userId = randomUUID();
  const { getPool } = require('./pg');
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO users (id, name, email, google_id, email_verified_at, role, created_at)
       VALUES ($1, $2, $3, $4, NOW(), 'USER', NOW())
       RETURNING ${USER_PUBLIC_COLUMNS}`,
      [userId, profile.name, profile.email, profile.googleId]
    );

    if (ids.length > 0) {
      const subjects = await client.query(
        `SELECT id FROM subjects WHERE id = ANY($1::text[])`,
        [ids]
      );
      for (const subjectId of subjects.rows.map((r) => r.id)) {
        await client.query(
          `INSERT INTO user_subjects (id, user_id, subject_id, created_at)
           VALUES ($1, $2, $3, NOW()) ON CONFLICT (user_id, subject_id) DO NOTHING`,
          [randomUUID(), userId, subjectId]
        );
      }
    }

    await client.query('COMMIT');
    const result = authCreated(rows[0]);
    result.body.needsSubjectSetup = ids.length === 0;
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function me(userId) {
  const user = await findUserById(userId);
  if (!user) return { status: 401, body: { error: 'User not found' } };
  if (!isUserActive(user)) return deactivatedAccountResponse();
  return { status: 200, body: { user: publicUser(user) } };
}

async function closeUserAccount(userId, password) {
  return closeAccount(userId, password);
}

function authConfig() {
  return {
    status: 200,
    body: {
      emailConfigured: isEmailConfigured(),
      googleConfigured: Boolean(process.env.GOOGLE_CLIENT_ID),
      appUrl: require('./email').appUrl(),
    },
  };
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

module.exports = {
  login,
  register,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  loginWithGoogle,
  me,
  closeUserAccount,
  authConfig,
  catalog,
  createGuest,
  upgradeGuest,
};
