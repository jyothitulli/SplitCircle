import { Router } from 'express';
import { prisma } from '../config/prisma.js';

const router = Router();

// GET /api/health - process liveness (no DB dependency)
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SplitCircle API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/health/db - database readiness (proves Prisma <-> Postgres works)
router.get('/db', async (req, res) => {
  try {
    // A trivial query that succeeds iff the DB connection is alive.
    // Doesn't depend on any specific table existing.
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: 'Database connection healthy',
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

export default router;
