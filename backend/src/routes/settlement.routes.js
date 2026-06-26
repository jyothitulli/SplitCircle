import { Router } from 'express';
import * as settlementController from '../controllers/settlement.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Secure all routes under /api/settlements
router.use(authenticate);

// POST /api/settlements/:id/pay
router.post('/:id/pay', settlementController.pay);

export default router;
