const db = require('./pg');
const bcrypt = require('bcryptjs');
const { USER_PUBLIC_COLUMNS, publicUser } = require('./authUser');
const { canDeleteUser } = require('./roles');
const { isGuestEmail } = require('./guestIdentity');
const { auditFire, AUDIT_ACTIONS, actorFromUser, userSnapshot } = require('./audit');

async function countActiveSuperAdmins(excludeUserId) {
  if (excludeUserId) {
    const { rows } = await db.query(
      `SELECT COUNT(*)::int AS total FROM users
       WHERE role = 'SUPER_ADMIN' AND deactivated_at IS NULL AND id <> $1`,
      [excludeUserId]
    );
    return rows[0]?.total ?? 0;
  }
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS total FROM users
     WHERE role = 'SUPER_ADMIN' AND deactivated_at IS NULL`
  );
  return rows[0]?.total ?? 0;
}

async function findUserRow(userId) {
  const { rows } = await db.query(
    `SELECT ${USER_PUBLIC_COLUMNS}, deactivated_at AS "deactivatedAt"
     FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function deactivateUser(actor, targetId, ctx = {}) {
  const existing = await findUserRow(targetId);
  if (!existing) {
    return { status: 404, body: { error: 'User not found' } };
  }

  if (existing.deactivatedAt) {
    return { status: 400, body: { error: 'User is already deactivated' } };
  }

  if (!canDeleteUser(actor, existing)) {
    const message =
      targetId === actor.id
        ? 'Use Account settings to close your own account'
        : 'You cannot deactivate this user';
    return { status: 403, body: { error: message } };
  }

  if (existing.role === 'SUPER_ADMIN' && (await countActiveSuperAdmins(targetId)) === 0) {
    return { status: 400, body: { error: 'Cannot deactivate the last active super admin' } };
  }

  const { rows } = await db.query(
    `UPDATE users SET deactivated_at = NOW() WHERE id = $1
     RETURNING ${USER_PUBLIC_COLUMNS}, deactivated_at AS "deactivatedAt"`,
    [targetId]
  );

  auditFire({
    action: AUDIT_ACTIONS.USER_DEACTIVATED,
    ...actorFromUser(actor),
    ...ctx,
    entityType: 'user',
    entityId: targetId,
    targetUserId: targetId,
    metadata: { before: userSnapshot(existing), after: userSnapshot(rows[0]) },
  });

  return {
    status: 200,
    body: { message: 'User deactivated', user: publicUser(rows[0]) },
  };
}

async function reactivateUser(actor, targetId, ctx = {}) {
  if (actor.role !== 'SUPER_ADMIN') {
    return { status: 403, body: { error: 'Super admin access required' } };
  }

  const existing = await findUserRow(targetId);
  if (!existing) {
    return { status: 404, body: { error: 'User not found' } };
  }

  if (!existing.deactivatedAt) {
    return { status: 400, body: { error: 'User is already active' } };
  }

  const { rows } = await db.query(
    `UPDATE users SET deactivated_at = NULL WHERE id = $1
     RETURNING ${USER_PUBLIC_COLUMNS}, deactivated_at AS "deactivatedAt"`,
    [targetId]
  );

  auditFire({
    action: AUDIT_ACTIONS.USER_REACTIVATED,
    ...actorFromUser(actor),
    ...ctx,
    entityType: 'user',
    entityId: targetId,
    targetUserId: targetId,
    metadata: { before: userSnapshot(existing), after: userSnapshot(rows[0]) },
  });

  return {
    status: 200,
    body: { message: 'User reactivated', user: publicUser(rows[0]) },
  };
}

async function closeAccount(userId, password, ctx = {}) {
  const user = await findUserRow(userId);
  if (!user) {
    return { status: 401, body: { error: 'User not found' } };
  }

  if (user.deactivatedAt) {
    return { status: 400, body: { error: 'This account is already closed' } };
  }

  if (user.passwordHash) {
    if (!password) {
      return { status: 400, body: { error: 'Password is required to close your account' } };
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return { status: 401, body: { error: 'Password is incorrect' } };
    }
  }

  if (user.role === 'SUPER_ADMIN' && (await countActiveSuperAdmins(userId)) === 0) {
    return {
      status: 400,
      body: { error: 'Cannot close the last active super admin account' },
    };
  }

  await db.query(`UPDATE users SET deactivated_at = NOW() WHERE id = $1`, [userId]);

  auditFire({
    action: AUDIT_ACTIONS.AUTH_CLOSE_ACCOUNT,
    ...actorFromUser(user),
    ...ctx,
    entityType: 'user',
    entityId: userId,
    targetUserId: userId,
    metadata: { before: userSnapshot(user) },
  });

  return {
    status: 200,
    body: {
      message: isGuestEmail(user.email)
        ? 'Guest session closed'
        : 'Your account has been closed. You can sign up again only after an admin reactivates this email.',
    },
  };
}

module.exports = {
  countActiveSuperAdmins,
  deactivateUser,
  reactivateUser,
  closeAccount,
};
