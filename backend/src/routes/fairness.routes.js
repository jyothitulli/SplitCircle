import { Router } from 'express';
import * as fairnessController from '../controllers/fairness.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

// POST /api/circles/:circleId/fairness/calculate
router.post('/calculate', fairnessController.calculate);

// GET /api/circles/:circleId/fairness
router.get('/', fairnessController.getLeaderboard);

export default router;
