const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    const local = url.includes('localhost') || url.includes('127.0.0.1');
    pool = new Pool({
      connectionString: url,
      max: 1,
      connectionTimeoutMillis: 8000,
      ssl: local ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function query(text, params) {
  return getPool().query(text, params);
}

module.exports = { query, getPool };
