function restoreEnv(snapshot) {
  for (const key of Object.keys(process.env)) {
    if (!(key in snapshot)) delete process.env[key];
  }
  Object.assign(process.env, snapshot);
}
const {
  validateConfig,
  getMaxStudyCards,
  getMaxCsvBytes,
  DEFAULT_MAX_STUDY_CARDS,
  DEFAULT_MAX_CSV_BYTES,
} = require('../lib/config');

describe('config', () => {
  let envSnapshot;

  beforeEach(() => {
    envSnapshot = { ...process.env };
  });

  afterEach(() => {
    restoreEnv(envSnapshot);
  });

  it('requires JWT_SECRET', () => {
    delete process.env.JWT_SECRET;
    const result = validateConfig();
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toMatch(/JWT_SECRET/);
  });

  it('passes with a long enough JWT_SECRET in test', () => {
    process.env.JWT_SECRET = 'test-jwt-secret-with-enough-length-for-validation';
    expect(validateConfig().ok).toBe(true);
  });

  it('requires postgres env on Vercel', () => {
    process.env.VERCEL = '1';
    process.env.JWT_SECRET = 'test-jwt-secret-with-enough-length-for-validation';
    process.env.DATABASE_URL = 'file:./dev.db';
    const result = validateConfig();
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('DATABASE_URL'))).toBe(true);
  });

  it('uses defaults for study and CSV limits', () => {
    delete process.env.MAX_STUDY_CARDS;
    delete process.env.MAX_CSV_BYTES;
    expect(getMaxStudyCards()).toBe(DEFAULT_MAX_STUDY_CARDS);
    expect(getMaxCsvBytes()).toBe(DEFAULT_MAX_CSV_BYTES);
  });
});
