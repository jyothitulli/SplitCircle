import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { handleReceiptUpload } from '../config/multer.js';
import { scanReceipt } from '../controllers/ocr.controller.js';

const router = Router();

/**
 * POST /api/ocr/receipt
 *
 * Requires:  JWT auth
 * Body:      multipart/form-data  { receipt: <image file> }
 * Returns:   Structured expense draft (no DB write)
 */
router.post('/receipt', authenticate, handleReceiptUpload, scanReceipt);

export default router;
