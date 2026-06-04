const serverless = require('serverless-http');

let expressHandler;

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
    req.on('data', (c) => { data += c; });
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

module.exports = async (req, res) => {
  const p = path(req);

  if (match(p, '/health')) {
    try {
      await require('../server/lib/pg').query('SELECT 1');
      return json(res, 200, { status: 'ok', database: 'connected' });
    } catch (err) {
      return json(res, 503, { status: 'error', database: 'disconnected', error: err.message });
    }
  }

  try {
    if (req.method === 'POST' && match(p, '/auth/login')) {
      const body = await parseBody(req);
      const result = await require('../server/lib/fastAuth').login(
        (body.email || '').trim(),
        body.password || ''
      );
      return json(res, result.status, result.body);
    }

    if (req.method === 'POST' && match(p, '/auth/register')) {
      const body = await parseBody(req);
      const result = await require('../server/lib/fastAuth').register(body);
      return json(res, result.status, result.body);
    }

    if (req.method === 'GET' && match(p, '/auth/me')) {
      const h = req.headers.authorization || req.headers.Authorization || '';
      if (!h.startsWith('Bearer ')) {
        return json(res, 401, { error: 'Authentication required' });
      }
      const payload = require('jsonwebtoken').verify(h.slice(7), process.env.JWT_SECRET);
      const result = await require('../server/lib/fastAuth').me(payload.userId);
      return json(res, result.status, result.body);
    }

    if (req.method === 'GET' && match(p, '/subjects/catalog')) {
      const rows = await require('../server/lib/fastAuth').catalog();
      return json(res, 200, rows);
    }
  } catch (err) {
    console.error('API error:', p, err);
    return json(res, 500, { error: err.message || 'Request failed' });
  }

  try {
    if (!expressHandler) {
      expressHandler = serverless(require('../server/app'));
    }
    return expressHandler(req, res);
  } catch (err) {
    console.error('Express handler error:', err);
    return json(res, 500, { error: 'Server failed to load', details: err.message });
  }
};
