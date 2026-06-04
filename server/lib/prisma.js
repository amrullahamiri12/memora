const path = require('path');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { withServerlessParams } = require('./dbUrl');

const globalForPrisma = globalThis;

function loadPrismaClient() {
  const clientPath = path.join(__dirname, '..', 'node_modules', '@prisma', 'client');
  return require(clientPath).PrismaClient;
}

function createPrismaClient() {
  const PrismaClient = loadPrismaClient();
  const connectionString = withServerlessParams(process.env.DATABASE_URL);
  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 5_000,
  });
  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

const prisma = getPrisma();

async function checkDatabaseConnection(timeoutMs = 8000) {
  const query = prisma.$queryRaw`SELECT 1`;
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Database connection timed out')), timeoutMs);
  });
  await Promise.race([query, timeout]);
}

module.exports = prisma;
module.exports.checkDatabaseConnection = checkDatabaseConnection;
