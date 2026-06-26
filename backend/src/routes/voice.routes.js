import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateVoiceExpenseBody } from '../validators/voice.validator.js';
import { logVoiceExpense } from '../controllers/voice.controller.js';

const router = Router();

/**
 * POST /api/voice/expense
 *
 * Requires:  JWT auth
 * Body:      { "transcript": "<spoken text>" }
 * Returns:   Structured expense draft (no DB write)
 */
router.post('/expense', authenticate, validateVoiceExpenseBody, logVoiceExpense);

export default router;
