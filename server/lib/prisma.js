const { PrismaClient } = require('@prisma/client');
const { withServerlessParams } = require('./dbUrl');

const globalForPrisma = globalThis;

function createPrismaClient() {
  const url = withServerlessParams(process.env.DATABASE_URL);
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    ...(url ? { datasources: { db: { url } } } : {}),
  });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production' || process.env.VERCEL) {
  globalForPrisma.prisma = prisma;
}

async function checkDatabaseConnection(timeoutMs = 8000) {
  const query = prisma.$queryRaw`SELECT 1`;
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Database connection timed out')), timeoutMs);
  });
  await Promise.race([query, timeout]);
}

module.exports = prisma;
module.exports.checkDatabaseConnection = checkDatabaseConnection;
