const serverless = require('serverless-http');

let expressHandler;

/** Original path is kept on Vercel rewrites; x-forwarded-uri is a fallback. */
function requestPath(req) {
  const forwarded = req.headers['x-forwarded-uri'] || req.headers['x-invoke-path'];
  const raw = forwarded || req.url || '/';
  const path = raw.split('?')[0];
  if (path.startsWith('http')) {
    try {
      return new URL(path).pathname;
    } catch {
      return path;
    }
  }
  return path;
}

function respondJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined && req.body !== null) {
      if (typeof req.body === 'string') {
        try {
          resolve(req.body ? JSON.parse(req.body) : {});
        } catch (err) {
          reject(err);
        }
        return;
      }
      if (typeof req.body === 'object') {
        resolve(req.body);
        return;
      }
    }

    let data = '';
    const timer = setTimeout(() => reject(new Error('Request body read timeout')), 5000);

    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      clearTimeout(timer);
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
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

async function handleHealthDb(res) {
  try {
    const { withPool } = require('../server/lib/pgPool');
    await withPool((pool) => pool.query('SELECT 1'));
    respondJson(res, 200, { status: 'ok', database: 'connected' });
  } catch (err) {
    console.error('DB health error:', err);
    respondJson(res, 503, {
      status: 'error',
      database: 'disconnected',
      details: err.message,
    });
  }
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
    const msg = err.message || 'Login failed';
    if (msg.includes('timeout') || err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
      respondJson(res, 503, {
        error:
          'Cannot reach the database. Use Supabase Transaction pooler (port 6543) with ?pgbouncer=true for DATABASE_URL.',
        details: msg,
      });
      return;
    }
    respondJson(res, 500, { error: 'Login failed', details: msg });
  }
}

async function handleSubjectsCatalog(res) {
  try {
    const { getSubjectsCatalog } = require('../server/lib/authServerless');
    const subjects = await getSubjectsCatalog();
    respondJson(res, 200, subjects);
  } catch (err) {
    console.error('Catalog error:', err);
    respondJson(res, 500, {
      error: 'Failed to fetch subjects',
      details: err.message,
    });
  }
}

async function handleRegister(req, res) {
  try {
    const body = await readJsonBody(req);
    const { registerUser } = require('../server/lib/authServerless');
    const result = await registerUser({
      name: body.name,
      email: body.email,
      password: body.password,
      subjectIds: body.subjectIds,
    });
    respondJson(res, result.status, result.body);
  } catch (err) {
    console.error('Fast register error:', err);
    const msg = err.message || 'Registration failed';
    if (msg.includes('timeout') || err.code === 'ETIMEDOUT') {
      respondJson(res, 503, { error: 'Database connection timed out', details: msg });
      return;
    }
    respondJson(res, 500, { error: 'Registration failed', details: msg });
  }
}

async function handleMe(req, res) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    respondJson(res, 401, { error: 'Authentication required' });
    return;
  }

  try {
    const jwt = require('jsonwebtoken');
    const { getUserById } = require('../server/lib/authServerless');
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getUserById(payload.userId);

    if (!user) {
      respondJson(res, 401, { error: 'User not found' });
      return;
    }

    respondJson(res, 200, { user });
  } catch (err) {
    console.error('Fast /me error:', err);
    respondJson(res, 401, { error: 'Invalid or expired token' });
  }
}

function matchesPath(path, suffix) {
  return path === suffix || path.endsWith(suffix);
}

module.exports = (req, res) => {
  const path = requestPath(req);

  if (matchesPath(path, '/ping')) {
    respondJson(res, 200, { ok: true });
    return;
  }

  if (matchesPath(path, '/health/db')) {
    handleHealthDb(res);
    return;
  }

  if (matchesPath(path, '/health')) {
    handleHealth(res);
    return;
  }

  if (req.method === 'POST' && matchesPath(path, '/auth/login')) {
    handleLogin(req, res);
    return;
  }

  if (req.method === 'GET' && matchesPath(path, '/auth/me')) {
    handleMe(req, res);
    return;
  }

  if (req.method === 'GET' && matchesPath(path, '/subjects/catalog')) {
    handleSubjectsCatalog(res);
    return;
  }

  if (req.method === 'POST' && matchesPath(path, '/auth/register')) {
    handleRegister(req, res);
    return;
  }

  if (!expressHandler) {
    const createApp = require('../server/app');
    expressHandler = serverless(createApp());
  }
  return expressHandler(req, res);
};
