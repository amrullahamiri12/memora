/** Config check only — no database connection (avoids serverless hangs). */
module.exports = (_req, res) => {
  const errors = [];

  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    const db = process.env.DATABASE_URL || '';
    if (!db || db.startsWith('file:')) {
      errors.push('DATABASE_URL must be a Supabase pooler URL (port 6543, ?pgbouncer=true).');
    }
    if (!process.env.DIRECT_URL) {
      errors.push('DIRECT_URL must be set (Supabase direct URL, port 5432).');
    }
    if (!process.env.JWT_SECRET) {
      errors.push('JWT_SECRET is required.');
    } else if (process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters.');
    }
  }

  res.setHeader('Content-Type', 'application/json');
  if (errors.length) {
    res.statusCode = 503;
    res.end(JSON.stringify({ status: 'error', config: errors.join(' ') }));
    return;
  }

  res.statusCode = 200;
  res.end(JSON.stringify({ status: 'ok', config: 'present' }));
};
