import { validateCircleIdParam } from '../validators/circle.validator.js';
import { validateCreateExpenseInput } from '../validators/expense.validator.js';
import { processReceiptOcr, buildExpensePayloadFromDraft } from '../services/ocr.service.js';
import * as expenseService from '../services/expense.service.js';
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

    const draftPayload = {
      merchant: draft.merchant,
      amount: draft.amount ?? draft.totalAmount,
      totalAmount: draft.totalAmount,
      subtotal: draft.subtotal,
      tax: draft.tax,
      currency: draft.currency,
      items: draft.items || [],
      date: draft.date,
      expenseDate: draft.expenseDate,
      description: draft.merchant || 'Receipt expense',
      category: draft.category || 'General',
      imageUrl: draft.imageUrl,
      receiptUrl: draft.imageUrl,
      publicId: draft.publicId,
      confidence: draft.confidence,
      warnings: buildWarnings(draft),
      rawText: draft.rawText,
      ocrExtracted: {
        merchant: draft.merchant,
        amount: draft.amount ?? draft.totalAmount,
        subtotal: draft.subtotal,
        tax: draft.tax,
        currency: draft.currency,
        items: draft.items || [],
        expenseDate: draft.expenseDate,
        date: draft.date,
        category: draft.category || 'General',
        confidence: draft.confidence,
        rawText: draft.rawText,
      },
    };

    return res.status(200).json({
      success: true,
      message: 'Receipt scanned successfully. Review the draft before creating an expense.',
      data: {
        draft: draftPayload,
        // rawText is returned for debugging; clients may hide it in production
        rawText: draft.rawText,
        warnings: buildWarnings(draft),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createExpenseFromOcr(req, res, next) {
  try {
    const circleId = validateCircleIdParam({ circleId: req.body.circleId });
    const payload = buildExpensePayloadFromDraft(req.body.draft || {}, req.body);
    const input = validateCreateExpenseInput(payload);
    const expense = await expenseService.createExpense(req.user.id, circleId, input);

    return res.status(201).json({
      success: true,
      message: 'Expense created from receipt successfully',
      data: { expense },
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
