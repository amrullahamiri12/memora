require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { validateConfig } = require('./lib/config');
const { authLimiter, progressLimiter, contactLimiter } = require('./middleware/rateLimit');
const pg = require('./lib/pg');

function lazy(loader) {
  let router;
  return (req, res, next) => {
    if (!router) router = loader();
    return router(req, res, next);
  };
}

const configCheck = validateConfig();
const configError = configCheck.ok ? null : configCheck.errors.join(' ');

const app = express();

function getClientOrigins() {
  const fromEnv = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  const previewOrigin = process.env.VERCEL_BRANCH_URL
    ? `https://${process.env.VERCEL_BRANCH_URL}`
    : null;
  return [...new Set([...fromEnv, vercelOrigin, previewOrigin].filter(Boolean))];
}

const clientOrigins = getClientOrigins();

app.use(helmet({ contentSecurityPolicy: process.env.VERCEL ? false : undefined }));
app.use(
  cors({
    origin: clientOrigins.length === 1 ? clientOrigins[0] : clientOrigins,
    credentials: false,
  })
);
app.use(express.json({ limit: '2mb' }));

app.use('/api', (req, res, next) => {
  if (configError && req.path !== '/health') {
    return res.status(503).json({ error: configError });
  }
  next();
});

app.get('/api/health', async (_req, res) => {
  try {
    await pg.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.use('/api/auth', (req, res, next) => {
  if (req.method === 'GET') return next();
  return authLimiter(req, res, next);
});
app.use('/api/auth', lazy(() => require('./routes/auth')));
app.use('/api/subjects', lazy(() => require('./routes/subjects')));
app.use('/api/topics', lazy(() => require('./routes/topics')));
app.use('/api/progress', progressLimiter, lazy(() => require('./routes/progress')));
app.use('/api/profile', lazy(() => require('./routes/profile')));
app.use('/api/admin', lazy(() => require('./routes/admin')));
app.use('/api/contact', contactLimiter, lazy(() => require('./routes/contact')));

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
