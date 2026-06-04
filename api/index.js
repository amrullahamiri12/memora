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

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

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

async function handleLogin(req, res) {
  try {
    const body = await readJsonBody(req);
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      respondJson(res, 400, { error: 'Email and password are required' });
      return;
    }

    const { loginWithDatabase } = require('../server/lib/authServerless');
    const result = await loginWithDatabase(email, password);
    respondJson(res, result.status, result.body);
  } catch (err) {
    console.error('Fast login error:', err);
    if (err.message?.includes('timeout') || err.code === 'ETIMEDOUT') {
      respondJson(res, 503, {
        error:
          'Database connection timed out. Use the Supabase pooler URL (port 6543) for DATABASE_URL.',
      });
      return;
    }
    respondJson(res, 500, { error: 'Login failed' });
  }
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

  if (req.method === 'POST' && path.endsWith('/auth/login')) {
    handleLogin(req, res);
    return;
  }

  if (!expressHandler) {
    const createApp = require('../server/app');
    expressHandler = serverless(createApp());
  }
  return expressHandler(req, res);
};
