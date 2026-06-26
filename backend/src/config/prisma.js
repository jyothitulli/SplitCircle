import { PrismaClient } from '@prisma/client';

// In development, nodemon/ESM hot-reloading can re-import this module
// repeatedly. Without a singleton, each reload would create a new
// PrismaClient -> new connection pool -> eventually exhausts Postgres's
// max_connections. We cache the instance on `globalThis` in dev only.

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Default export kept in sync with the named export so that both
// `import { prisma } from '...'` and `import prisma from '...'` resolve
// to the same singleton client (conflict.service.js and insights.service.js
// import the default).
export default prisma;
