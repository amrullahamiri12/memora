/**
 * Applies audit_events migration SQL to PostgreSQL (Supabase).
 * Use when prisma migrate deploy cannot run (e.g. db push history, provider lock mismatch).
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const migrationPath = path.join(
  __dirname,
  '../prisma/migrations/20260605120000_audit_events/migration.sql'
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
    "SELECT to_regclass('public.audit_events') AS t"
  );
  if (exists.rows[0]?.t) {
    console.log('audit_events already exists — skipping migration SQL');
    await pool.end();
    return;
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  await pool.query(sql);
  console.log('Applied audit_events migration');

  const testEmail = `audit-migration-test-${Date.now()}@guest.memora.local`;
  const insert = await pool.query(
    `INSERT INTO users (id, name, email, password_hash, role, created_at)
     VALUES (gen_random_uuid()::text, 'Audit Test', $1, 'x', 'USER', NOW())
     RETURNING id, email`,
    [testEmail]
  );
  const { id, email } = insert.rows[0];
  await pool.query('DELETE FROM users WHERE id = $1', [id]);

  const audit = await pool.query(
    `SELECT action, source, metadata->'snapshot'->>'email' AS deleted_email
     FROM audit_events
     WHERE action = 'USER_DELETED_DB' AND target_user_id = $1`,
    [id]
  );

  if (audit.rows[0]?.deleted_email === email) {
    console.log('Trigger verification OK: USER_DELETED_DB recorded for test user');
  } else {
    console.error('Trigger verification FAILED');
    process.exitCode = 1;
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
