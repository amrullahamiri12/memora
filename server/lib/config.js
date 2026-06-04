const MIN_JWT_SECRET_LENGTH = 32;
const DEFAULT_MAX_STUDY_CARDS = 500;
const DEFAULT_MAX_CSV_BYTES = 2 * 1024 * 1024;

function validateConfig() {
  const errors = [];

  if (process.env.VERCEL) {
    const db = process.env.DATABASE_URL || '';
    if (!db || db.startsWith('file:')) {
      errors.push(
        'Set DATABASE_URL to your Supabase pooler URL (port 6543, include ?pgbouncer=true) in Vercel → Settings → Environment Variables.'
      );
    }
    if (!process.env.DIRECT_URL) {
      errors.push(
        'Set DIRECT_URL to your Supabase direct URL (port 5432) in Vercel → Settings → Environment Variables.'
      );
    }
    if (db && !db.includes('pgbouncer=true') && db.includes(':6543')) {
      console.warn(
        'Warning: DATABASE_URL uses port 6543 but missing ?pgbouncer=true — add it for Supabase pooler + Prisma on Vercel.'
      );
    }
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    errors.push('JWT_SECRET environment variable is required.');
  } else if (secret.length < MIN_JWT_SECRET_LENGTH) {
    const msg = `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters.`;
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      errors.push(msg);
    } else {
      console.warn(`Warning: ${msg}`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, errors: [] };
}

function getMaxStudyCards() {
  const n = parseInt(process.env.MAX_STUDY_CARDS, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_STUDY_CARDS;
}

function getMaxCsvBytes() {
  const n = parseInt(process.env.MAX_CSV_BYTES, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_CSV_BYTES;
}

module.exports = {
  validateConfig,
  getMaxStudyCards,
  getMaxCsvBytes,
  DEFAULT_MAX_STUDY_CARDS,
  DEFAULT_MAX_CSV_BYTES,
};
