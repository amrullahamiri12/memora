/**
 * Applies guest_device_bindings migration SQL to PostgreSQL (Supabase).
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const migrationPath = path.join(
  __dirname,
  '../prisma/migrations/20260605140000_guest_device_bindings/migration.sql'
);

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL or DIRECT_URL required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: url,
    ssl: url.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  const exists = await pool.query(
    "SELECT to_regclass('public.guest_device_bindings') AS t"
  );
  if (exists.rows[0]?.t) {
    console.log('guest_device_bindings already exists — skipping migration SQL');
    await pool.end();
    return;
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  await pool.query(sql);
  console.log('Applied guest_device_bindings migration');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
