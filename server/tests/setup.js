process.env.NODE_ENV = 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-jwt-secret-with-enough-length-for-validation';
process.env.JWT_EXPIRES_IN = '1h';
delete process.env.VERCEL;
