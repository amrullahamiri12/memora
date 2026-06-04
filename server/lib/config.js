const MIN_JWT_SECRET_LENGTH = 32;
const DEFAULT_MAX_STUDY_CARDS = 500;
const DEFAULT_MAX_CSV_BYTES = 2 * 1024 * 1024;

function validateConfig() {
  if (process.env.VERCEL) {
    const db = process.env.DATABASE_URL || '';
    if (!db || db.startsWith('file:')) {
      throw new Error(
        'Vercel requires PostgreSQL. Set DATABASE_URL to a Postgres connection string in Vercel → Settings → Environment Variables, and use provider = "postgresql" in server/prisma/schema.prisma.'
      );
    }
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    const msg = `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg);
    }
    console.warn(`Warning: ${msg}`);
  }
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
