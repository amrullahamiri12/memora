const { Pool } = require('pg');
const { withServerlessParams } = require('./dbUrl');

const globalForPool = globalThis;

function createPool() {
  const connectionString = withServerlessParams(process.env.DATABASE_URL);
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  return new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 5_000,
  });
}

function getPool() {
  if (!globalForPool.pgPool) {
    globalForPool.pgPool = createPool();
  }
  return globalForPool.pgPool;
}

module.exports = { getPool };
