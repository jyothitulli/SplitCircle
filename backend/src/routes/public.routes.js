import { Router } from 'express';

import * as publicController from '../controllers/public.controller.js';

const router = Router();

// Intentionally unauthenticated: only aggregate counts/sums are returned,
// never per-user data. See public.service.js for exactly what's exposed.
router.get('/stats', publicController.getCommunityStats);

export default router;
