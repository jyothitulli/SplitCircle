import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import cloudinary from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The bundled English trained-data file lives at backend/eng.traineddata.
// We point tesseract.js at it directly (langPath) instead of letting it
// fall back to its default behaviour of fetching the file from a remote
// CDN (https://tessdata.projectnaptha.com or jsdelivr) on every cold
// worker start. That remote fetch is the actual root cause of the
// production 502s: on Render (and in any network-restricted environment)
// the request can be blocked/slow/rate-limited, and — critically — a
// failed fetch inside the tesseract.js worker thread is *thrown as an
// uncaught exception* that crashes the entire Node process, taking down
// every other route (auth included) until Render restarts the dyno.
// Using the local file removes the network dependency entirely.
const TRAINEDDATA_DIR = path.resolve(__dirname, '../../');
// A writable scratch directory for tesseract.js's on-disk cache. Render's
// filesystem is ephemeral but /tmp (os.tmpdir()) is always writable, unlike
// the project directory, which may be mounted read-only in some deploy
// environments.
const OCR_CACHE_DIR = os.tmpdir();

// Hard ceiling on how long a single OCR pass may take. Without this, a
// pathological image (or a stalled worker) can hang a request indefinitely,
// which is exactly what turns into a platform-level 502 (the reverse proxy
// gives up waiting on the origin) instead of a clean, informative error.
const OCR_TIMEOUT_MS = 45_000;

const MAX_ITEMS = 40;

function assertCloudinaryConfigured() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new AppError(
      'Receipt scanning is not configured on this server: CLOUDINARY_CLOUD_NAME, ' +
        'CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be set in backend/.env. ' +
        'Sign up at cloudinary.com (free tier) and copy the values from your dashboard.',
      503
    );
  }
}

export async function uploadReceiptToCloudinary(buffer, originalname) {
  assertCloudinaryConfigured();

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
          reject(new AppError('Failed to upload receipt image. Please try again.', 502));
          return;
        }

        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

/**
 * Deskews/cleans up a photographed receipt before OCR:
 *  - auto-rotates using the image's EXIF orientation (phone photos are
 *    frequently stored sideways)
 *  - converts to grayscale (color information only hurts Tesseract)
 *  - upscales small images (a bigger x-height meaningfully improves accuracy)
 *  - normalizes contrast and sharpens edges, which helps a lot on receipts
 *    photographed under uneven indoor lighting
 *
 * Falls back to the original buffer if preprocessing itself fails for any
 * reason (e.g. a corrupt image) — the raw buffer is still a valid, though
 * lower-quality, input to Tesseract, and validateReceiptImage() has already
 * confirmed it decodes as a real image.
 */
export async function preprocessReceiptImage(buffer) {
  try {
    const image = sharp(buffer, { failOn: 'none' }).rotate();
    const metadata = await image.metadata();

    let pipeline = image.grayscale();
    if (metadata.width && metadata.width < 1500) {
      pipeline = pipeline.resize({ width: 1600, withoutEnlargement: false });
    }
    pipeline = pipeline.normalize().sharpen();

    return await pipeline.toBuffer();
  } catch (err) {
    logger.warn('Receipt preprocessing failed, falling back to original image', {
      error: err.message,
    });
    return buffer;
  }
}

/** Confirms the buffer is a real, decodable image before we spend time OCR-ing it. */
export async function validateReceiptImage(buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error('no dimensions');
    }
    return metadata;
  } catch {
    throw new AppError(
      'The uploaded file could not be read as an image. Please upload a JPEG, PNG, WEBP, or GIF photo of the receipt.',
      400
    );
  }
}

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new AppError(message, 504)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function extractTextFromImage(buffer) {
  let worker;
  try {
    worker = await createWorker('eng', 1, {
      langPath: TRAINEDDATA_DIR,
      gzip: false,
      cachePath: OCR_CACHE_DIR,
      cacheMethod: 'none',
      logger: (message) => {
        if (message.status === 'recognizing text') {
          logger.debug(`OCR progress: ${Math.round(message.progress * 100)}%`);
        }
      },
    });

    const { data } = await withTimeout(
      worker.recognize(buffer),
      OCR_TIMEOUT_MS,
      'Receipt scanning took too long. Please try a clearer or smaller photo.'
    );
    return data.text || '';
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Tesseract OCR failed', { error: err.message });
    throw new AppError('Could not process the receipt image. Please try a clearer photo.', 502);
  } finally {
    // Always release the worker, even on failure/timeout, so we don't leak
    // native threads across requests.
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        /* already gone */
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Field extraction
// ---------------------------------------------------------------------------

function splitLines(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function lastNumberOnLine(line) {
  const matches = line.match(/[\d,]+\.\d{2}/g);
  if (!matches) return null;
  const numbers = matches.map((value) => Number(value.replace(/,/g, ''))).filter((value) => value > 0);
  return numbers.length ? numbers[numbers.length - 1] : null;
}

// Lines that describe a discount/subtotal/line-item-count rather than the
// final payable amount. These are excluded from "final total" candidates so
// a bill's "Total Items: 10" or "Sub Total" line never wins over the real
// grand total.
const NOT_FINAL_TOTAL = /(sub\s*total|total\s*items|taxable\s*amount|item(s)?\s*total|discount)/i;
// High-confidence "this is the final amount the customer pays" phrasing.
const FINAL_TOTAL_STRONG = /(grand\s*total|net\s*amount|net\s*payable|amount\s*payable|total\s*payable|balance\s*due|total\s*due|amount\s*due|net\s*total|total\s*amount)/i;
// Weaker fallback: a bare "Total" label.
const FINAL_TOTAL_WEAK = /\btotal\b/i;

/**
 * Finds the most likely final payable total.
 *
 * Receipts frequently contain several numbers that look like totals
 * (item count subtotal, taxable amount, discount, grand total). We avoid
 * naively taking "the biggest number on the page" — that misreads phone
 * numbers, GST/invoice numbers, and item counts as amounts. Instead we walk
 * the receipt in order and prefer the *last* line matching an explicit
 * "final amount" phrase (grand total / net payable / amount due / …),
 * since that phrasing — when present — is unambiguous and, on real
 * receipts, appears at the bottom of the bill.
 */
export function parseAmount(text) {
  const lines = splitLines(text);
  let strongMatch = null;
  let weakMatch = null;

  for (const line of lines) {
    if (NOT_FINAL_TOTAL.test(line)) continue;

    if (FINAL_TOTAL_STRONG.test(line)) {
      const value = lastNumberOnLine(line);
      if (value !== null) strongMatch = value;
    } else if (FINAL_TOTAL_WEAK.test(line)) {
      const value = lastNumberOnLine(line);
      if (value !== null) weakMatch = value;
    }
  }

  if (strongMatch !== null) return strongMatch;
  if (weakMatch !== null) return weakMatch;

  // Last resort: the largest properly-formatted decimal amount anywhere on
  // the receipt. This intentionally ignores bare integers (phone numbers,
  // GST/invoice numbers, dates) since it only matches values with a decimal
  // point and two-digit fraction — the format real currency amounts use.
  const allAmounts = text.match(/[\d,]+\.\d{2}/g);
  if (!allAmounts) return null;
  const parsed = allAmounts.map((value) => Number(value.replace(/,/g, ''))).filter((value) => value > 0);
  return parsed.length ? Math.max(...parsed) : null;
}

/** The pre-tax subtotal, distinct from the final (post-tax/discount) total. */
export function parseSubtotal(text) {
  const lines = splitLines(text);
  const subtotalRe = /(sub\s*total|taxable\s*amount)/i;
  for (const line of lines) {
    if (subtotalRe.test(line)) {
      const value = lastNumberOnLine(line);
      if (value !== null) return value;
    }
  }
  return null;
}

/**
 * Tax/GST amount. Indian receipts commonly split tax into CGST + SGST (or
 * IGST for inter-state sales) rather than showing one combined figure, so we
 * sum whichever split-tax lines are present. If none are found, we fall back
 * to a single combined GST/VAT/Tax line.
 */
export function parseTax(text) {
  const lines = splitLines(text);
  const splitTaxRe = /\b(cgst|sgst|igst)\b/i;

  let sum = 0;
  let found = false;
  for (const line of lines) {
    if (splitTaxRe.test(line)) {
      const value = lastNumberOnLine(line);
      if (value !== null) {
        sum += value;
        found = true;
      }
    }
  }
  if (found) return Number(sum.toFixed(2));

  const combinedTaxRe = /\b(gst|vat|tax)\b/i;
  for (const line of lines) {
    if (/gstin/i.test(line)) continue; // GST registration number, not an amount
    if (combinedTaxRe.test(line)) {
      const value = lastNumberOnLine(line);
      if (value !== null) return value;
    }
  }
  return null;
}

/** ₹/INR-aware currency detection with a sane default for this app's audience. */
export function parseCurrency(text) {
  if (/₹|Rs\.?\s?\d|\bINR\b/i.test(text)) return 'INR';
  if (/\$\s?\d|\bUSD\b/i.test(text)) return 'USD';
  if (/€|\bEUR\b/i.test(text)) return 'EUR';
  if (/£|\bGBP\b/i.test(text)) return 'GBP';
  // Default to INR: SplitCircle's receipt scanner is built around Indian
  // bills, and most Indian POS printers render the ₹ glyph in a way OCR
  // frequently mangles (e.g. reads it as "%" or "3"), so an outright miss
  // on the symbol is common even on genuinely INR receipts.
  return 'INR';
}

export function parseMerchant(text) {
  const lines = splitLines(text);
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

function isValidDate(year, month, day) {
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() + 1 === Number(month) &&
    date.getUTCDate() === Number(day)
  );
}

function toIsoDate(year, month, day) {
  if (!isValidDate(year, month, day)) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseDate(text) {
  const monthMap = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };

  const iso = text.match(/\b(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})\b/);
  if (iso) {
    const parsed = toIsoDate(iso[1], iso[2], iso[3]);
    if (parsed) return parsed;
  }

  const numeric = text.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/);
  if (numeric) {
    const first = Number(numeric[1]);
    const second = Number(numeric[2]);
    const year = numeric[3];
    const candidates = [];

    if (second >= 1 && second <= 12) candidates.push({ day: first, month: second });
    if (first >= 1 && first <= 12) candidates.push({ day: second, month: first });

    for (const candidate of candidates) {
      const parsed = toIsoDate(year, candidate.month, candidate.day);
      if (parsed) return parsed;
    }
  }

  const dayMonth = text.match(
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{4})\b/i
  );
  if (dayMonth) {
    const month = monthMap[dayMonth[2].toLowerCase().slice(0, 3)];
    const parsed = toIsoDate(dayMonth[3], month, dayMonth[1]);
    if (parsed) return parsed;
  }

  const monthDay = text.match(
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{1,2})[\s,]+(\d{4})\b/i
  );
  if (monthDay) {
    const month = monthMap[monthDay[1].toLowerCase().slice(0, 3)];
    const parsed = toIsoDate(monthDay[3], month, monthDay[2]);
    if (parsed) return parsed;
  }

  return null;
}

// Lines that are structurally part of the item table but are never
// themselves a purchasable line item (headers, totals, tax, metadata).
const ITEM_LINE_SKIP = /(total|tax|gst|vat|discount|invoice|bill\s*no|date|time|cashier|\bpos\b|hsn|description|qty|rate|amount|thank|save|visit|counter|state\s*name|gstin|order\s*no|payment)/i;
// "<description> <qty> <unit price> <line total>", optionally prefixed by an
// HSN/SKU code, which we strip separately. This intentionally requires all
// three numeric columns so we only report items we're confident about —
// per spec, anything less certain is better left out entirely than guessed.
const ITEM_LINE_PATTERN = /^(.{3,40}?)\s+(\d+(?:\.\d+)?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})$/;

/**
 * Best-effort itemized line extraction. Works across differently laid-out
 * receipts (supermarket HSN tables, restaurant qty/rate/amount rows, etc.)
 * because it looks for the generic "name ... qty ... rate ... amount"
 * shape rather than any single store's fixed column positions. Returns an
 * empty array (never fabricated data) when no lines confidently match.
 */
export function parseItems(text) {
  const lines = splitLines(text);
  const items = [];

  for (const rawLine of lines) {
    if (items.length >= MAX_ITEMS) break;
    // Strip a leading HSN/SKU code (a long digit run at the start of the line).
    const line = rawLine.replace(/^\d{4,}\s+/, '').trim();
    if (ITEM_LINE_SKIP.test(line)) continue;

    const match = line.match(ITEM_LINE_PATTERN);
    if (!match) continue;

    const name = match[1].replace(/\s+\d{6,}$/, '').trim(); // drop a trailing HSN code too
    const quantity = Number(match[2]);
    const unitPrice = Number(match[3].replace(/,/g, ''));
    const total = Number(match[4].replace(/,/g, ''));
    if (!name || Number.isNaN(quantity) || Number.isNaN(unitPrice) || Number.isNaN(total)) continue;

    items.push({ name, quantity, unitPrice, total });
  }

  return items;
}

function inferCategory(merchant) {
  const value = (merchant || '').toLowerCase();
  if (/(coffee|cafe|restaurant|pizza|burger|bakery|tea|bistro|bar|food)/.test(value)) return 'Food';
  if (/(hotel|taxi|uber|train|flight|fuel|parking|transport|metro)/.test(value)) return 'Transport';
  if (/(electricity|power|water|gas|utility|utilities|broadband|internet|dth)/.test(value)) return 'Utilities';
  if (/(grocery|market|supermarket|pharmacy|store|mart)/.test(value)) return 'Groceries';
  return 'General';
}

export function buildExpensePayloadFromDraft(draft = {}, overrides = {}) {
  const amount = overrides.amount ?? draft.amount ?? draft.totalAmount ?? null;
  const description = overrides.description ?? draft.description ?? draft.merchant ?? 'Receipt expense';
  const expenseDate = overrides.expenseDate ?? draft.expenseDate ?? draft.date ?? new Date().toISOString().split('T')[0];
  const receiptUrl = overrides.receiptUrl ?? draft.receiptUrl ?? draft.imageUrl ?? null;
  const merchant = overrides.merchant ?? draft.merchant ?? description;
  const category = overrides.category ?? draft.category ?? inferCategory(merchant);
  const ocrExtracted = {
    merchant,
    amount,
    expenseDate,
    date: draft.date || expenseDate,
    category,
    currency: draft.currency ?? 'INR',
    subtotal: draft.subtotal ?? null,
    tax: draft.tax ?? null,
    items: draft.items ?? [],
    confidence: draft.confidence ?? null,
    warnings: draft.warnings ?? [],
    rawText: draft.rawText ?? null,
    imageUrl: receiptUrl,
    publicId: draft.publicId ?? overrides.publicId ?? null,
    source: 'ocr',
  };

  return {
    description,
    amount: amount === null ? null : Number(amount),
    expenseDate,
    splitMethod: overrides.splitMethod ?? 'EQUAL',
    paidById: overrides.paidById ?? null,
    participants: overrides.participants ?? [],
    receiptUrl,
    merchant,
    ocrExtracted,
  };
}

export async function processReceiptOcr(file) {
  const { buffer, originalname } = file;

  await validateReceiptImage(buffer);

  logger.info('Uploading receipt to Cloudinary', { originalname });
  const { url: imageUrl, publicId } = await uploadReceiptToCloudinary(buffer, originalname);

  logger.info('Preprocessing receipt image', { originalname });
  const processedBuffer = await preprocessReceiptImage(buffer);

  logger.info('Running Tesseract OCR', { originalname });
  const rawText = await extractTextFromImage(processedBuffer);

  if (!rawText.trim()) {
    throw new AppError('Could not extract any text from the receipt image. Please upload a clearer photo.', 422);
  }

  const merchant = parseMerchant(rawText);
  const totalAmount = parseAmount(rawText);
  const subtotal = parseSubtotal(rawText);
  const tax = parseTax(rawText);
  const currency = parseCurrency(rawText);
  const date = parseDate(rawText);
  const items = parseItems(rawText);

  const found = [merchant, totalAmount, date].filter(Boolean).length;
  const confidence = Number((found / 3).toFixed(2));

  logger.info('OCR parsing complete', { merchant, totalAmount, subtotal, tax, date, itemCount: items.length, confidence });

  return {
    imageUrl,
    publicId,
    rawText: rawText.trim(),
    merchant,
    totalAmount,
    amount: totalAmount,
    subtotal,
    tax,
    currency,
    date,
    expenseDate: date,
    category: inferCategory(merchant),
    items,
    confidence,
  };
}
