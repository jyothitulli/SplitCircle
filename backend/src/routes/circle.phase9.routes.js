/**
 * Circle routes — consolidated (Phase 2 → 9)
 * Includes Phase 9C (insights) and Phase 9D (conflicts)
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getInsights } from '../controllers/insights.controller.js';
import { getConflictPrediction } from '../controllers/conflict.controller.js';

const router = Router();

// ── Phase 9C: AI Insights ──────────────────────────────────────────────────
/**
 * GET /api/circles/:circleId/insights
 * Query: ?refresh=true  → bypass cache
 */
router.get('/:circleId/insights', authenticate, getInsights);

// ── Phase 9D: Conflict Prediction ─────────────────────────────────────────
/**
 * GET /api/circles/:circleId/conflicts
 */
router.get('/:circleId/conflicts', authenticate, getConflictPrediction);

export default router;
