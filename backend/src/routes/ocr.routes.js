import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { handleReceiptUpload } from '../config/multer.js';
import { createExpenseFromOcr, scanReceipt } from '../controllers/ocr.controller.js';

const router = Router();

/**
 * POST /api/ocr/receipt
 *
 * Requires:  JWT auth
 * Body:      multipart/form-data  { receipt: <image file> }
 * Returns:   Structured expense draft (no DB write)
 */
router.post('/receipt', authenticate, handleReceiptUpload, scanReceipt);
router.post('/create-expense', authenticate, createExpenseFromOcr);

export default router;
