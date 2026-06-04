const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production' || process.env.VERCEL) {
  globalForPrisma.prisma = prisma;
}

async function checkDatabaseConnection() {
  await prisma.$queryRaw`SELECT 1`;
}

module.exports = prisma;
module.exports.checkDatabaseConnection = checkDatabaseConnection;
