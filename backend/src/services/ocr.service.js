/**
 * OCR Receipt Service — Phase 9A
 *
 * Pipeline:
 *   1. Upload image buffer → Cloudinary (returns secure URL + public_id)
 *   2. Run Tesseract.js on the raw image buffer in-process
 *   3. Parse extracted text → merchant, amount, date
 *   4. Return structured draft (never creates an Expense)
 */

import { createWorker } from 'tesseract.js';
import { Readable } from 'stream';
import cloudinary from '../config/cloudinary.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Cloudinary upload helper
// ---------------------------------------------------------------------------

/**
 * Upload an image buffer to Cloudinary.
 * @param {Buffer} buffer - Raw image bytes
 * @param {string} originalname - Original filename (for logging)
 * @returns {{ url: string, publicId: string }}
 */
export async function uploadReceiptToCloudinary(buffer, originalname) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'splitcircle/receipts',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error', { error, originalname });
          return reject(new AppError('Failed to upload receipt image. Please try again.', 502));
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    // Pipe buffer → upload stream
    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
}

// ---------------------------------------------------------------------------
// OCR via Tesseract.js
// ---------------------------------------------------------------------------

/**
 * Run Tesseract OCR on an image buffer.
 * @param {Buffer} buffer
 * @returns {string} Extracted raw text
 */
export async function extractTextFromImage(buffer) {
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        logger.debug(`OCR progress: ${Math.round(m.progress * 100)}%`);
      }
    },
  });

  try {
    const { data } = await worker.recognize(buffer);
    return data.text || '';
  } finally {
    await worker.terminate();
  }
}

// ---------------------------------------------------------------------------
// Text parsers
// ---------------------------------------------------------------------------

/**
 * Attempt to extract a total monetary amount from OCR text.
 * Prioritises lines that contain "total", "amount", "grand total", etc.
 * Falls back to the largest number found.
 *
 * @param {string} text
 * @returns {number|null}
 */
export function parseAmount(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Priority: lines mentioning total / amount / net
  const totalKeywords = /\b(grand\s*total|net\s*total|total|amount|to\s*pay|payable|due)\b/i;

  for (const line of lines) {
    if (totalKeywords.test(line)) {
      const match = line.match(/[\d,]+\.?\d{0,2}/g);
      if (match) {
        const nums = match.map((n) => parseFloat(n.replace(/,/g, '')));
        const max = Math.max(...nums);
        if (max > 0) return max;
      }
    }
  }

  // Fallback: find all numbers and return the largest
  const allNums = text.match(/[\d,]+\.\d{2}/g);
  if (allNums) {
    const parsed = allNums.map((n) => parseFloat(n.replace(/,/g, ''))).filter((n) => n > 0);
    if (parsed.length) return Math.max(...parsed);
  }

  return null;
}

/**
 * Attempt to extract a merchant / store name from OCR text.
 * Heuristic: The merchant name is typically in the first non-empty lines
 * before any price or date information appears.
 *
 * @param {string} text
 * @returns {string|null}
 */
export function parseMerchant(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Skip lines that look like addresses, phone numbers, or dates
  const skipPattern = /(\d{3}[-.\s]\d{3}|\d{5}|www\.|http|@|invoice|receipt|bill|tax|gst|vat)/i;
  const datePattern = /\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}/;
  const pricePattern = /^\s*[\d,]+\.?\d*\s*$/;

  for (const line of lines.slice(0, 6)) {
    if (
      line.length > 2 &&
      line.length < 60 &&
      !skipPattern.test(line) &&
      !datePattern.test(line) &&
      !pricePattern.test(line)
    ) {
      return line;
    }
  }

  return null;
}

/**
 * Attempt to extract a date from OCR text.
 * Supports common date formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, etc.
 *
 * @param {string} text
 * @returns {string|null} ISO date string (YYYY-MM-DD) or null
 */
export function parseDate(text) {
  // Patterns ordered by specificity
  const patterns = [
    // ISO format: 2024-01-15
    /\b(\d{4})[/.-](\d{2})[/.-](\d{2})\b/,
    // DD/MM/YYYY or MM/DD/YYYY
    /\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/,
    // DD Mon YYYY  e.g. 15 Jan 2024
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{4})\b/i,
    // Mon DD, YYYY e.g. Jan 15, 2024
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{1,2})[\s,]+(\d{4})\b/i,
  ];

  const monthMap = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    try {
      // ISO: YYYY-MM-DD
      if (/^\d{4}$/.test(match[1])) {
        const d = new Date(`${match[1]}-${match[2]}-${match[3]}`);
        if (!isNaN(d)) return d.toISOString().split('T')[0];
      }

      // DD/MM/YYYY or MM/DD/YYYY (ambiguous when both parts are ≤ 12)
      if (/^\d{1,2}$/.test(match[1]) && /^\d{1,2}$/.test(match[2]) && /^\d{4}$/.test(match[3])) {
        const a = parseInt(match[1], 10);
        const b = parseInt(match[2], 10);
        const yyyy = match[3];

        // Try DD/MM first (international convention), then fall back to
        // MM/DD if the "month" part isn't a valid month (e.g. 01/15/2024).
        const candidates = [];
        if (b >= 1 && b <= 12) candidates.push({ dd: a, mm: b });
        if (a >= 1 && a <= 12 && a !== b) candidates.push({ dd: b, mm: a });

        for (const { dd, mm } of candidates) {
          const d = new Date(`${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`);
          if (!isNaN(d) && d.getUTCDate() === dd && d.getUTCMonth() + 1 === mm) {
            return d.toISOString().split('T')[0];
          }
        }
      }

      // Textual month variants (one of the groups is a month name, not a number)
      const rawMonth = !/^\d+$/.test(match[1]) ? match[1] : !/^\d+$/.test(match[2]) ? match[2] : null;
      const monthStr = rawMonth ? rawMonth.toLowerCase().slice(0, 3) : null;
      if (monthStr && monthMap[monthStr]) {
        const day = /^\d+$/.test(match[1]) ? match[1] : match[2];
        const year = match[3];
        const d = new Date(`${year}-${monthMap[monthStr]}-${day.padStart(2, '0')}`);
        if (!isNaN(d)) return d.toISOString().split('T')[0];
      }
    } catch {
      // continue to next pattern
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main service function
// ---------------------------------------------------------------------------

/**
 * Full OCR pipeline: upload → extract text → parse → return draft.
 *
 * @param {{ buffer: Buffer, originalname: string, mimetype: string }} file
 * @returns {Promise<OcrReceiptDraft>}
 *
 * @typedef {Object} OcrReceiptDraft
 * @property {string}      imageUrl     - Cloudinary secure URL
 * @property {string}      publicId     - Cloudinary public ID
 * @property {string}      rawText      - Full OCR output
 * @property {string|null} merchant     - Parsed merchant name
 * @property {number|null} totalAmount  - Parsed total amount
 * @property {string|null} date         - Parsed date (ISO string)
 * @property {number}      confidence   - Rough confidence 0–1
 */
export async function processReceiptOcr(file) {
  const { buffer, originalname } = file;

  // 1. Upload to Cloudinary
  logger.info('Uploading receipt to Cloudinary', { originalname });
  const { url: imageUrl, publicId } = await uploadReceiptToCloudinary(buffer, originalname);

  // 2. Run OCR
  logger.info('Running Tesseract OCR', { originalname });
  const rawText = await extractTextFromImage(buffer);

  if (!rawText || rawText.trim().length === 0) {
    throw new AppError(
      'Could not extract any text from the receipt image. Please upload a clearer photo.',
      422
    );
  }

  // 3. Parse fields
  const merchant = parseMerchant(rawText);
  const totalAmount = parseAmount(rawText);
  const date = parseDate(rawText);

  // 4. Rough confidence: how many of the 3 fields we extracted
  const found = [merchant, totalAmount, date].filter(Boolean).length;
  const confidence = parseFloat((found / 3).toFixed(2));

  logger.info('OCR parsing complete', { merchant, totalAmount, date, confidence });

  return {
    imageUrl,
    publicId,
    rawText: rawText.trim(),
    merchant,
    totalAmount,
    date,
    confidence,
  };
}
