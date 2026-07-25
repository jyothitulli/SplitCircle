import test from 'node:test';
import assert from 'node:assert/strict';

import { buildExpensePayloadFromDraft } from './ocr.service.js';

test('buildExpensePayloadFromDraft preserves OCR metadata and explicit overrides', () => {
  const payload = buildExpensePayloadFromDraft(
    {
      merchant: 'Coffee Corner',
      totalAmount: 12.34,
      date: '2026-06-29',
      imageUrl: 'https://img.example/receipt.jpg',
      confidence: 0.82,
      warnings: ['Low contrast'],
      rawText: 'Coffee Corner\n12.34',
    },
    {
      description: 'Coffee Corner',
      amount: '15.5',
      expenseDate: '2026-06-30',
      category: 'Food',
      paidById: 'user-1',
      splitMethod: 'EQUAL',
      participants: [{ userId: 'user-1' }],
      receiptUrl: 'https://img.example/receipt-final.jpg',
      merchant: 'Coffee Corner',
    }
  );

  assert.equal(payload.description, 'Coffee Corner');
  assert.equal(payload.amount, 15.5);
  assert.equal(payload.expenseDate, '2026-06-30');
  assert.equal(payload.paidById, 'user-1');
  assert.equal(payload.receiptUrl, 'https://img.example/receipt-final.jpg');
  assert.equal(payload.ocrExtracted.category, 'Food');
  assert.equal(payload.ocrExtracted.confidence, 0.82);
  assert.deepEqual(payload.ocrExtracted.warnings, ['Low contrast']);
});
