const { randomUUID } = require('crypto');
const db = require('./pg');
const { clientIp } = require('./rateLimitFast');

/** @typedef {'APP' | 'DB_TRIGGER'} AuditSource */

const AUDIT_ACTIONS = {
  AUTH_LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGIN_FAILED: 'AUTH_LOGIN_FAILED',
  AUTH_GOOGLE_FAILED: 'AUTH_GOOGLE_FAILED',
  AUTH_REGISTER: 'AUTH_REGISTER',
  AUTH_VERIFY_EMAIL: 'AUTH_VERIFY_EMAIL',
  AUTH_RESEND_VERIFICATION: 'AUTH_RESEND_VERIFICATION',
  AUTH_CLOSE_ACCOUNT: 'AUTH_CLOSE_ACCOUNT',
  AUTH_FORGOT_PASSWORD: 'AUTH_FORGOT_PASSWORD',
  AUTH_RESET_PASSWORD: 'AUTH_RESET_PASSWORD',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  USER_REACTIVATED: 'USER_REACTIVATED',
  USER_DELETED_DB: 'USER_DELETED_DB',
  ADMIN_USER_CREATED: 'ADMIN_USER_CREATED',
  ADMIN_USER_UPDATED: 'ADMIN_USER_UPDATED',
  ADMIN_VERIFY_EMAIL: 'ADMIN_VERIFY_EMAIL',
  SUBJECT_CREATED: 'SUBJECT_CREATED',
  SUBJECT_UPDATED: 'SUBJECT_UPDATED',
  SUBJECT_DELETED: 'SUBJECT_DELETED',
  TOPIC_CREATED: 'TOPIC_CREATED',
  TOPIC_UPDATED: 'TOPIC_UPDATED',
  TOPIC_DELETED: 'TOPIC_DELETED',
  FLASHCARD_CREATED: 'FLASHCARD_CREATED',
  FLASHCARD_UPDATED: 'FLASHCARD_UPDATED',
  FLASHCARD_DELETED: 'FLASHCARD_DELETED',
  FLASHCARD_CSV_IMPORTED: 'FLASHCARD_CSV_IMPORTED',
  FLASHCARD_CSV_EXPORTED: 'FLASHCARD_CSV_EXPORTED',
  CONTACT_FORM_SUBMITTED: 'CONTACT_FORM_SUBMITTED',
  RATE_LIMIT_HIT: 'RATE_LIMIT_HIT',
};

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'password_hash',
  'token',
  'credential',
  'verificationTokenHash',
  'verification_token_hash',
  'resetTokenHash',
  'reset_token_hash',
  'jwt',
  'authorization',
]);

function buildRequestContext(req) {
  if (!req) return {};
  return {
    ipAddress: clientIp(req),
    userAgent:
      typeof req.headers?.['user-agent'] === 'string'
        ? req.headers['user-agent'].slice(0, 512)
        : typeof req.headers?.['User-Agent'] === 'string'
          ? req.headers['User-Agent'].slice(0, 512)
          : null,
  };
}

function actorFromUser(user) {
  if (!user) return {};
  return {
    actorUserId: user.id ?? null,
    actorEmail: user.email ?? null,
    actorRole: user.role ?? null,
  };
}

function sanitizeMetadata(value, depth = 0) {
  if (value == null || depth > 6) return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadata(item, depth + 1));
  }
  if (typeof value !== 'object') return value;

  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(key)) continue;
    out[key] = sanitizeMetadata(val, depth + 1);
  }
  return out;
}

function userSnapshot(row) {
  if (!row) return null;
  return sanitizeMetadata({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    emailVerified: Boolean(row.emailVerifiedAt ?? row.email_verified_at),
    deactivatedAt: row.deactivatedAt ?? row.deactivated_at ?? null,
  });
}

async function recordAuditEvent(event) {
  const {
    source = 'APP',
    action,
    actorUserId = null,
    actorEmail = null,
    actorRole = null,
    entityType = null,
    entityId = null,
    targetUserId = null,
    ipAddress = null,
    userAgent = null,
    metadata = null,
  } = event;

  if (!action) return;

  const cleanMetadata = metadata ? sanitizeMetadata(metadata) : null;

  await db.query(
    `INSERT INTO audit_events (
       id, source, action,
       actor_user_id, actor_email, actor_role,
       entity_type, entity_id, target_user_id,
       ip_address, user_agent, metadata
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      randomUUID(),
      source,
      action,
      actorUserId,
      actorEmail,
      actorRole,
      entityType,
      entityId,
      targetUserId,
      ipAddress,
      userAgent,
      cleanMetadata ? JSON.stringify(cleanMetadata) : null,
    ]
  );
}

function auditFire(event) {
  recordAuditEvent(event).catch((err) => {
    console.error('[audit] Failed to record event:', event.action, err.message);
  });
}

function auditFromActor(actor, action, fields = {}) {
  auditFire({
    action,
    ...actorFromUser(actor),
    ...fields,
  });
}

async function listAuditEvents({
  page = 1,
  limit = 50,
  action = null,
  source = null,
  actorUserId = null,
  targetUserId = null,
  from = null,
  to = null,
} = {}) {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safePage = Math.max(page, 1);
  const offset = (safePage - 1) * safeLimit;

  const conditions = [];
  const params = [];
  let idx = 1;

  if (action) {
    conditions.push(`action = $${idx++}`);
    params.push(action);
  }
  if (source) {
    conditions.push(`source = $${idx++}::"AuditSource"`);
    params.push(source);
  }
  if (actorUserId) {
    conditions.push(`actor_user_id = $${idx++}`);
    params.push(actorUserId);
  }
  if (targetUserId) {
    conditions.push(`target_user_id = $${idx++}`);
    params.push(targetUserId);
  }
  if (from) {
    conditions.push(`occurred_at >= $${idx++}`);
    params.push(from);
  }
  if (to) {
    conditions.push(`occurred_at <= $${idx++}`);
    params.push(to);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(
    `SELECT COUNT(*)::int AS total FROM audit_events ${where}`,
    params
  );
  const total = countResult.rows[0]?.total ?? 0;

  const { rows } = await db.query(
    `SELECT id, occurred_at AS "occurredAt", source, action,
            actor_user_id AS "actorUserId", actor_email AS "actorEmail", actor_role AS "actorRole",
            entity_type AS "entityType", entity_id AS "entityId",
            target_user_id AS "targetUserId",
            ip_address AS "ipAddress", user_agent AS "userAgent",
            metadata
     FROM audit_events
     ${where}
     ORDER BY occurred_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, safeLimit, offset]
  );

  return {
    items: rows,
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

function buildRequestContextFromHeaders(headers = {}) {
  return buildRequestContext({ headers, socket: {} });
}

module.exports = {
  AUDIT_ACTIONS,
  buildRequestContext,
  buildRequestContextFromHeaders,
  actorFromUser,
  sanitizeMetadata,
  userSnapshot,
  recordAuditEvent,
  auditFire,
  auditFromActor,
  listAuditEvents,
};
