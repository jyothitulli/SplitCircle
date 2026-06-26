import { processReceiptOcr } from '../services/ocr.service.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * POST /api/ocr/receipt
 *
 * Accepts a multipart form upload with field "receipt".
 * Returns a structured expense DRAFT — does NOT create an Expense record.
 */
export async function scanReceipt(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError('No receipt image provided. Upload a file using the "receipt" field.', 400);
    }

    logger.info('Processing receipt OCR request', {
      userId: req.user?.id,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    const draft = await processReceiptOcr(req.file);

    return res.status(200).json({
      success: true,
      message: 'Receipt scanned successfully. Review the draft before creating an expense.',
      data: {
        draft: {
          merchant: draft.merchant,
          totalAmount: draft.totalAmount,
          date: draft.date,
          imageUrl: draft.imageUrl,
          publicId: draft.publicId,
          confidence: draft.confidence,
        },
        // rawText is returned for debugging; clients may hide it in production
        rawText: draft.rawText,
        warnings: buildWarnings(draft),
      },
    });
  } catch (err) {
    next(err);
  }
}

function buildWarnings(draft) {
  const warnings = [];
  if (!draft.merchant) warnings.push('Could not detect merchant name. Please enter it manually.');
  if (!draft.totalAmount) warnings.push('Could not detect total amount. Please enter it manually.');
  if (!draft.date) warnings.push('Could not detect date. Please enter it manually.');
  if (draft.confidence < 0.5) {
    warnings.push(
      'Low OCR confidence. The receipt may be blurry or low-contrast. Please verify all fields.'
    );
  }
  return warnings;
}
