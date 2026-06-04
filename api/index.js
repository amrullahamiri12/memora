const serverless = require('serverless-http');

let expressHandler;

function requestPath(req) {
  return (req.url || '/').split('?')[0];
}

function respondJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

/** Runs before Express/Prisma load — must stay dependency-free beyond serverless-http. */
function handleHealth(res) {
  const errors = [];

  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    const db = process.env.DATABASE_URL || '';
    if (!db || db.startsWith('file:')) {
      errors.push('Set DATABASE_URL (Supabase pooler port 6543, include ?pgbouncer=true).');
    }
    if (!process.env.DIRECT_URL) {
      errors.push('Set DIRECT_URL (Supabase direct port 5432).');
    }
    if (!process.env.JWT_SECRET) {
      errors.push('JWT_SECRET is required.');
    } else if (process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters.');
    }
  }

  if (errors.length) {
    respondJson(res, 503, { status: 'error', config: errors.join(' ') });
    return;
  }
  respondJson(res, 200, { status: 'ok', config: 'present' });
}

module.exports = (req, res) => {
  const path = requestPath(req);

  if (path.endsWith('/ping')) {
    respondJson(res, 200, { ok: true });
    return;
  }

  if (path.endsWith('/health')) {
    handleHealth(res);
    return;
  }

  if (!expressHandler) {
    const createApp = require('../server/app');
    expressHandler = serverless(createApp());
  }
  return expressHandler(req, res);
};
