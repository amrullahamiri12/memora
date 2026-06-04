require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { validateConfig } = require('./lib/config');
const { authLimiter, progressLimiter } = require('./middleware/rateLimit');

function lazyRouter(loader) {
  let router;
  return (req, res, next) => {
    if (!router) router = loader();
    return router(req, res, next);
  };
}

function createApp() {
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

  app.use(
    helmet({
      contentSecurityPolicy: process.env.VERCEL ? false : undefined,
    })
  );
  app.use(
    cors({
      origin: clientOrigins.length === 1 ? clientOrigins[0] : clientOrigins,
      credentials: false,
    })
  );
  app.use(express.json({ limit: '2mb' }));

  app.use('/api', (req, res, next) => {
    if (configError) {
      return res.status(503).json({ error: configError });
    }
    next();
  });

  app.get('/api/health', async (_req, res) => {
    try {
      const { checkDatabaseConnection } = require('./lib/prisma');
      await checkDatabaseConnection();
      res.json({ status: 'ok', database: 'connected' });
    } catch (err) {
      console.error('Health check DB error:', err);
      res.status(500).json({
        status: 'error',
        database: 'disconnected',
        hint: 'Check DATABASE_URL (Supabase pooler port 6543 with ?pgbouncer=true) and DIRECT_URL on Vercel.',
      });
    }
  });

  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth', lazyRouter(() => require('./routes/auth')));
  app.use('/api/subjects', lazyRouter(() => require('./routes/subjects')));
  app.use('/api/topics', lazyRouter(() => require('./routes/topics')));
  app.use('/api/progress', progressLimiter, lazyRouter(() => require('./routes/progress')));
  app.use('/api/profile', lazyRouter(() => require('./routes/profile')));
  app.use('/api/admin', lazyRouter(() => require('./routes/admin')));

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = createApp;
