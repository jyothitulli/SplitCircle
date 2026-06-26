/**
 * Voice Expense Service — Phase 9B
 *
 * Accepts a free-text transcript (e.g. "I paid 420 rupees for groceries yesterday")
 * and uses Gemini to extract a structured expense draft.
 *
 * No expense is created in the DB.
 */

import { getGeminiModel } from '../config/gemini.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Category list (matches common expense categories used across the app)
// ---------------------------------------------------------------------------
const VALID_CATEGORIES = [
  'groceries',
  'food & dining',
  'transport',
  'utilities',
  'rent',
  'entertainment',
  'healthcare',
  'shopping',
  'household',
  'subscriptions',
  'travel',
  'education',
  'personal care',
  'other',
];

// ---------------------------------------------------------------------------
// Prompt template
// ---------------------------------------------------------------------------

function buildVoicePrompt(transcript) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  return `You are a financial assistant for a shared-expense app called SplitCircle.
The user has spoken an expense and it has been transcribed as:

"${transcript}"

Today's date is ${today}.

Extract the following information from the transcript and return ONLY valid JSON with no markdown, no explanation, no code fences.

Return this exact JSON structure:
{
  "amount": <number or null>,
  "currency": <string or null, e.g. "INR", "USD">,
  "category": <one of: ${VALID_CATEGORIES.map((c) => `"${c}"`).join(', ')} — pick the closest match, or "other">,
  "description": <short human-readable description, max 80 characters>,
  "date": <ISO date string YYYY-MM-DD based on relative words like "yesterday", "today", "last Monday" relative to ${today}, or null if not mentioned>,
  "confidence": <number between 0 and 1 representing how confident you are in the extraction>
}

Rules:
- If the amount is unclear, set "amount" to null.
- If a currency symbol or word is present (₹, Rs, rupees, $, dollars, £, euros), set "currency" accordingly.
- Default currency to "INR" if the context strongly suggests India (rupees, paise).
- Do not invent information not present in the transcript.
- description should summarise the expense naturally, e.g. "Groceries from Big Bazaar" or "Dinner with flatmates".
- Return ONLY the JSON object. No preamble, no trailing text.`;
}

// ---------------------------------------------------------------------------
// Gemini call + response parser
// ---------------------------------------------------------------------------

async function callGeminiForVoice(transcript) {
  const model = getGeminiModel();
  const prompt = buildVoicePrompt(transcript);

  logger.info('Calling Gemini for voice expense extraction');

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  logger.debug('Gemini raw response', { text });

  // Strip any accidental markdown fences
  const clean = text.replace(/```json|```/gi, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch {
    logger.error('Gemini returned non-JSON for voice extraction', { text });
    throw new AppError('AI failed to parse the transcript. Please try rephrasing.', 422);
  }

  return parsed;
}

// ---------------------------------------------------------------------------
// Validation & normalisation of Gemini output
// ---------------------------------------------------------------------------

function normaliseVoiceDraft(raw) {
  const amount = typeof raw.amount === 'number' && raw.amount > 0 ? raw.amount : null;

  const category = VALID_CATEGORIES.includes(raw.category?.toLowerCase())
    ? raw.category.toLowerCase()
    : 'other';

  const description =
    typeof raw.description === 'string' && raw.description.trim().length > 0
      ? raw.description.trim().slice(0, 80)
      : 'Expense from voice log';

  // Validate date format
  let date = null;
  if (raw.date && /^\d{4}-\d{2}-\d{2}$/.test(raw.date)) {
    const d = new Date(raw.date);
    if (!isNaN(d)) date = raw.date;
  }

  const confidence = typeof raw.confidence === 'number'
    ? Math.min(1, Math.max(0, raw.confidence))
    : null;

  return {
    amount,
    currency: raw.currency || 'INR',
    category,
    description,
    date,
    confidence,
  };
}

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------

/**
 * Extract a structured expense draft from a voice transcript.
 *
 * @param {string} transcript
 * @returns {Promise<VoiceExpenseDraft>}
 *
 * @typedef {Object} VoiceExpenseDraft
 * @property {number|null}  amount
 * @property {string}       currency
 * @property {string}       category
 * @property {string}       description
 * @property {string|null}  date
 * @property {number|null}  confidence
 */
export async function extractVoiceExpense(transcript) {
  if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
    throw new AppError('Transcript must be a non-empty string.', 400);
  }

  if (transcript.trim().length > 1000) {
    throw new AppError('Transcript is too long. Maximum 1000 characters.', 400);
  }

  const raw = await callGeminiForVoice(transcript.trim());
  const draft = normaliseVoiceDraft(raw);

  logger.info('Voice expense extraction complete', { draft });

  return draft;
}
