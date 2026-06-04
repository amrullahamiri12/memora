const { Pool } = require('pg');
const { withServerlessParams } = require('./dbUrl');

function createPool() {
  const connectionString = withServerlessParams(process.env.DATABASE_URL);
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

  return new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 5_000,
    allowExitOnIdle: true,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
}

/** One pool per query batch — avoids stale connections on Vercel serverless. */
async function withPool(fn) {
  const pool = createPool();
  try {
    return await fn(pool);
  } finally {
    await pool.end().catch(() => {});
  }
}

module.exports = { createPool, withPool };
