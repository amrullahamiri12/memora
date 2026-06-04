const serverless = require('serverless-http');
const { validateConfig } = require('../server/lib/config');
const { checkAuthRateLimit, checkProgressRateLimit } = require('../server/lib/rateLimitFast');

let expressHandler;

const GENERIC_SERVER_ERROR = { error: 'Internal server error' };

function path(req) {
  const raw = req.url || '/';
  return raw.split('?')[0];
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    if (typeof req.body === 'string') {
      try {
        return resolve(req.body ? JSON.parse(req.body) : {});
      } catch (e) {
        return reject(e);
      }
    }
    let data = '';
    req.on('data', (c) => {
      data += c;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function match(p, suffix) {
  return p === suffix || p.endsWith(suffix);
}

function parseQuery(url) {
  const i = (url || '').indexOf('?');
  if (i === -1) return {};
  return Object.fromEntries(new URLSearchParams(url.slice(i + 1)));
}

function applyRateLimit(res, result) {
  if (!result.allowed) {
    res.setHeader('Retry-After', String(result.retryAfterSec));
    json(res, 429, result.body);
    return false;
  }
  return true;
}

module.exports = async (req, res) => {
  const p = path(req);
  const query = parseQuery(req.url);
  const authHeader = req.headers.authorization || req.headers.Authorization || '';

  const config = validateConfig();
  if (!config.ok && !match(p, '/health')) {
    return json(res, 503, { error: config.errors.join(' ') });
  }

  if (match(p, '/health')) {
    try {
      await require('../server/lib/pg').query('SELECT 1');
      return json(res, 200, { status: 'ok', database: 'connected' });
    } catch (err) {
      console.error('Health check failed:', err);
      return json(res, 503, { status: 'error', database: 'disconnected' });
    }
  }

  try {
    if (req.method === 'POST' && match(p, '/auth/login')) {
      if (!applyRateLimit(res, checkAuthRateLimit(req))) return;
      const body = await parseBody(req);
      const result = await require('../server/lib/fastAuth').login(
        (body.email || '').trim(),
        body.password || ''
      );
      return json(res, result.status, result.body);
    }

    if (req.method === 'POST' && match(p, '/auth/register')) {
      if (!applyRateLimit(res, checkAuthRateLimit(req))) return;
      const body = await parseBody(req);
      const result = await require('../server/lib/fastAuth').register(body);
      return json(res, result.status, result.body);
    }

    if (req.method === 'POST' && match(p, '/auth/guest')) {
      if (!applyRateLimit(res, checkAuthRateLimit(req))) return;
      const result = await require('../server/lib/fastAuth').createGuest();
      return json(res, result.status, result.body);
    }

    if (req.method === 'POST' && match(p, '/auth/upgrade-guest')) {
      if (!applyRateLimit(res, checkAuthRateLimit(req))) return;
      const h = req.headers.authorization || req.headers.Authorization || '';
      if (!h.startsWith('Bearer ')) {
        return json(res, 401, { error: 'Authentication required' });
      }
      const payload = require('jsonwebtoken').verify(h.slice(7), process.env.JWT_SECRET, {
        algorithms: ['HS256'],
      });
      const body = await parseBody(req);
      const result = await require('../server/lib/fastAuth').upgradeGuest(payload.userId, body);
      return json(res, result.status, result.body);
    }

    if (req.method === 'GET' && match(p, '/auth/me')) {
      const h = req.headers.authorization || req.headers.Authorization || '';
      if (!h.startsWith('Bearer ')) {
        return json(res, 401, { error: 'Authentication required' });
      }
      const payload = require('jsonwebtoken').verify(h.slice(7), process.env.JWT_SECRET, {
        algorithms: ['HS256'],
      });
      const result = await require('../server/lib/fastAuth').me(payload.userId);
      return json(res, result.status, result.body);
    }

    if (req.method === 'GET' && match(p, '/subjects/catalog')) {
      const rows = await require('../server/lib/fastAuth').catalog();
      return json(res, 200, rows);
    }

    if (req.method === 'POST' && match(p, '/progress')) {
      if (!applyRateLimit(res, checkProgressRateLimit(req))) return;
    }

    const body =
      req.method === 'POST' || req.method === 'PUT' ? await parseBody(req) : null;

    const fast = await require('../server/lib/fastApi').tryHandle(
      req.method,
      p,
      query,
      authHeader,
      body
    );
    if (fast) return json(res, fast.status, fast.body);
  } catch (err) {
    console.error('API error:', p, err);
    return json(res, 500, GENERIC_SERVER_ERROR);
  }

  try {
    if (!expressHandler) {
      expressHandler = serverless(require('../server/app'));
    }
    return expressHandler(req, res);
  } catch (err) {
    console.error('Express handler error:', err);
    return json(res, 500, GENERIC_SERVER_ERROR);
  }
};
