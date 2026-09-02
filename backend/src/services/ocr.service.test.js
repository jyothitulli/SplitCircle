import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildExpensePayloadFromDraft,
  parseAmount,
  parseSubtotal,
  parseTax,
  parseCurrency,
  parseItems,
} from './ocr.service.js';

// Real (lightly cleaned) Tesseract output from the three sample receipts
// bundled with this project (dmart-bill.png, bill.png, gasbill.jpeg),
// captured to guard the field-extraction regexes against regressions.
const DMART_TEXT = `D:iMart
Avenue Supermarts Ltd.
DMART KUKATPALLY
GSTIN: 36AABCA3314H1ZP
State Name : Telangana, Code : 36
TAX INVOICE
Bill No. : KUKA100229004512 Date : 29/05/2025
HSN Description Qty Rate Amount
04011000 TONED MILK 1L 2 56.00 112.00
10019020 DAWAT RICE 5KG 1 349.00 349.00
Total Items: 10 1351.20
Sub Total 1351.20
Discount -51.20
Taxable Amount 1300.00
CGST @ 2.50% 32.50
SGST @ 2.50% 32.50
Grand Total % 1,365.00
Thank You ! Visit Again !!`;

const RELIANCE_TEXT = `Reliance SMART
GSTIN: 29AABCR1718E1Z5
Invoice No: RS1234/24-25/000567
Fortune Sunflower Oil 1L 15121110 1 175.00 175.00
Total Items: 12
Total 1,221.00
Discount - 21.00
Taxable Amount 1,200.00
CGST (2.5%) 30.00
SGST (2.5%) 30.00
Net Amount % 1,260.00
Thank you for shopping with Reliance Smart!`;

const GASBILL_TEXT = `HP GAS GAYATRI AGENCIES
GSTIN:37AASFG4769Q1Z6
Base Price (%) 922.38
Taxable Amount (%) 922.38
CGST (2.50%)(%) 23.06
SGST (2.50%)(%) 23.06
Total Amount (%) 968.50
Advance (Online) (%) 0.00
Net Payable (%) 968.50`;

test('parseAmount picks the final grand total, not "Total Items" or subtotal lines', () => {
  assert.equal(parseAmount(DMART_TEXT), 1365.0);
});

test('parseAmount prefers "Net Amount" over a plain pre-discount "Total" line', () => {
  assert.equal(parseAmount(RELIANCE_TEXT), 1260.0);
});

test('parseAmount picks "Net Payable" as the final amount on a utility bill', () => {
  assert.equal(parseAmount(GASBILL_TEXT), 968.5);
});

test('parseSubtotal reads the taxable/sub-total amount, distinct from the final total', () => {
  // DMART_TEXT has an explicit "Sub Total" line, which takes priority over
  // the (also present) "Taxable Amount" line.
  assert.equal(parseSubtotal(DMART_TEXT), 1351.2);
  // GASBILL_TEXT has no "Sub Total" line, so "Taxable Amount" is used.
  assert.equal(parseSubtotal(GASBILL_TEXT), 922.38);
});

test('parseTax sums split CGST + SGST lines', () => {
  assert.equal(parseTax(DMART_TEXT), 65.0);
  assert.equal(parseTax(RELIANCE_TEXT), 60.0);
  assert.equal(parseTax(GASBILL_TEXT), 46.12);
});

test('parseCurrency defaults to INR for Indian receipts', () => {
  assert.equal(parseCurrency(DMART_TEXT), 'INR');
});

test('parseItems extracts name/qty/unitPrice/total and strips leading HSN codes', () => {
  const items = parseItems(DMART_TEXT);
  assert.equal(items.length, 2);
  assert.deepEqual(items[0], { name: 'TONED MILK 1L', quantity: 2, unitPrice: 56, total: 112 });
});

test('parseItems returns an empty array (never fabricated data) when nothing confidently matches', () => {
  assert.deepEqual(parseItems(GASBILL_TEXT), []);
});

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
