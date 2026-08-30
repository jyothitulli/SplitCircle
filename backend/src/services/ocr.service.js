import { Readable } from 'stream';
import { createWorker } from 'tesseract.js';
import cloudinary from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

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

export async function extractTextFromImage(buffer) {
  const worker = await createWorker('eng', 1, {
    logger: (message) => {
      if (message.status === 'recognizing text') {
        logger.debug(`OCR progress: ${Math.round(message.progress * 100)}%`);
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

export function parseAmount(text) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const totalKeywords = /\b(grand\s*total|net\s*total|total|amount|to\s*pay|payable|due)\b/i;

  for (const line of lines) {
    if (!totalKeywords.test(line)) continue;

    const matches = line.match(/[\d,]+\.?\d{0,2}/g);
    if (!matches) continue;

    const amounts = matches.map((value) => Number(value.replace(/,/g, ''))).filter(Boolean);
    if (amounts.length) return Math.max(...amounts);
  }

  const allAmounts = text.match(/[\d,]+\.\d{2}/g);
  if (!allAmounts) return null;

  const parsed = allAmounts.map((value) => Number(value.replace(/,/g, ''))).filter((value) => value > 0);
  return parsed.length ? Math.max(...parsed) : null;
}

export function parseMerchant(text) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
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
    jan: '01',
    feb: '02',
    mar: '03',
    apr: '04',
    may: '05',
    jun: '06',
    jul: '07',
    aug: '08',
    sep: '09',
    oct: '10',
    nov: '11',
    dec: '12',
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

function inferCategory(merchant) {
  const value = (merchant || '').toLowerCase();
  if (/(coffee|cafe|restaurant|pizza|burger|bakery|tea|bistro|bar|food)/.test(value)) return 'Food';
  if (/(hotel|taxi|uber|train|flight|fuel|parking|transport|metro)/.test(value)) return 'Transport';
  if (/(grocery|market|supermarket|pharmacy|store)/.test(value)) return 'Groceries';
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

  logger.info('Uploading receipt to Cloudinary', { originalname });
  const { url: imageUrl, publicId } = await uploadReceiptToCloudinary(buffer, originalname);

  logger.info('Running Tesseract OCR', { originalname });
  const rawText = await extractTextFromImage(buffer);

  if (!rawText.trim()) {
    throw new AppError('Could not extract any text from the receipt image. Please upload a clearer photo.', 422);
  }

  const merchant = parseMerchant(rawText);
  const totalAmount = parseAmount(rawText);
  const date = parseDate(rawText);
  const found = [merchant, totalAmount, date].filter(Boolean).length;
  const confidence = Number((found / 3).toFixed(2));

  logger.info('OCR parsing complete', { merchant, totalAmount, date, confidence });

  return {
    imageUrl,
    publicId,
    rawText: rawText.trim(),
    merchant,
    totalAmount,
    amount: totalAmount,
    date,
    expenseDate: date,
    category: inferCategory(merchant),
    confidence,
  };
}
