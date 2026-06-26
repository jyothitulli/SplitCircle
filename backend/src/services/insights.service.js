/**
 * AI Insights Service — Phase 9C
 *
 * Gathers expenses, chores, fairness scores, and settlements for a circle,
 * then uses Gemini to generate 3–10 natural-language insights.
 *
 * Caching: In-memory LRU-style cache keyed by circleId, TTL = 5 minutes.
 * For production, replace with Redis (same interface).
 */

import prisma from '../config/prisma.js';
import { getGeminiModel } from '../config/gemini.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Simple in-memory cache (TTL-based)
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const insightsCache = new Map(); // circleId → { data, expiresAt }

function getCached(circleId) {
  const entry = insightsCache.get(circleId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    insightsCache.delete(circleId);
    return null;
  }
  return entry.data;
}

function setCache(circleId, data) {
  insightsCache.set(circleId, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateInsightsCache(circleId) {
  insightsCache.delete(circleId);
}

// ---------------------------------------------------------------------------
// Data gathering
// ---------------------------------------------------------------------------

async function gatherCircleData(circleId) {
  const [circle, expenses, choreAssignments, fairnessScores, settlements] = await Promise.all([
    prisma.circle.findUnique({
      where: { id: circleId },
      select: { id: true, name: true, members: { select: { user: { select: { id: true, name: true } } } } },
    }),

    prisma.expense.findMany({
      where: { circleId },
      orderBy: { expenseDate: 'desc' },
      take: 50,
      select: {
        id: true,
        description: true,
        amount: true,
        expenseDate: true,
        paidBy: { select: { name: true } },
      },
    }),

    prisma.choreAssignment.findMany({
      where: { chore: { circleId } },
      select: {
        status: true,
        dueDate: true,
        user: { select: { name: true } },
        chore: { select: { title: true } },
      },
    }),

    prisma.fairnessScore.findMany({
      where: { circleId },
      select: {
        overallScore: true,
        expenseScore: true,
        choreScore: true,
        user: { select: { name: true } },
      },
    }),

    prisma.settlement.findMany({
      where: { circleId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        amount: true,
        status: true,
        fromUser: { select: { name: true } },
        toUser: { select: { name: true } },
      },
    }),
  ]);

  return { circle, expenses, choreAssignments, fairnessScores, settlements };
}

// ---------------------------------------------------------------------------
// Prompt engineering
// ---------------------------------------------------------------------------

function buildInsightsPrompt(data) {
  const { circle, expenses, choreAssignments, fairnessScores, settlements } = data;

  const memberNames = circle.members.map((m) => m.user.name).join(', ');

  // Expense summary
  const totalSpend = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const spendByPayer = {};
  for (const e of expenses) {
    const name = e.paidBy.name;
    spendByPayer[name] = (spendByPayer[name] || 0) + parseFloat(e.amount);
  }
  const expenseSummary = Object.entries(spendByPayer)
    .map(([name, amt]) => `${name}: ₹${amt.toFixed(2)}`)
    .join(', ');

  // Chore summary
  const totalChores = choreAssignments.length;
  const completedChores = choreAssignments.filter((c) => c.status === 'COMPLETED').length;
  const missedChores = choreAssignments.filter((c) => c.status === 'MISSED').length;
  const choreCompletionRate =
    totalChores > 0 ? ((completedChores / totalChores) * 100).toFixed(1) : 'N/A';

  // Fairness summary
  const fairnessSummary = fairnessScores
    .map((f) => `${f.user.name}: overall=${parseFloat(f.overallScore).toFixed(1)}, expenses=${parseFloat(f.expenseScore).toFixed(1)}, chores=${parseFloat(f.choreScore).toFixed(1)}`)
    .join('\n');

  // Settlement summary
  const pendingSettlements = settlements.filter((s) => s.status === 'PENDING');
  const settledTotal = settlements
    .filter((s) => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + parseFloat(s.amount), 0);

  return `You are an AI assistant for SplitCircle, a shared-living expense and chore management app.

Analyse the following data for the circle "${circle.name}" (members: ${memberNames}) and generate between 3 and 10 natural-language insights that would be genuinely useful to the members.

--- EXPENSE DATA (last 50) ---
Total spent: ₹${totalSpend.toFixed(2)}
Spending by member: ${expenseSummary || 'No expenses yet'}
Number of expense records: ${expenses.length}

--- CHORE DATA ---
Total assignments: ${totalChores}
Completed: ${completedChores} (${choreCompletionRate}%)
Missed: ${missedChores}

--- FAIRNESS SCORES (out of 100) ---
${fairnessSummary || 'No fairness scores available yet'}

--- SETTLEMENT DATA ---
Pending settlements: ${pendingSettlements.length}
Total settled amount: ₹${settledTotal.toFixed(2)}

--- INSTRUCTIONS ---
Return ONLY a valid JSON array of insight strings. No markdown, no code fences, no preamble.
Each insight must be:
- 1–2 sentences, conversational and actionable
- Specific (use names and numbers where available)
- Varied in topic (mix expenses, chores, fairness, settlements)
- Between 3 and 10 items total

Example output format:
["Insight 1 text.", "Insight 2 text.", "Insight 3 text."]`;
}

// ---------------------------------------------------------------------------
// Gemini call
// ---------------------------------------------------------------------------

async function generateInsightsWithGemini(data) {
  const model = getGeminiModel();
  const prompt = buildInsightsPrompt(data);

  logger.info('Calling Gemini for circle insights', { circleId: data.circle.id });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  logger.debug('Gemini insights raw response', { text });

  const clean = text.replace(/```json|```/gi, '').trim();

  let insights;
  try {
    insights = JSON.parse(clean);
  } catch {
    logger.error('Gemini returned non-JSON for insights', { text });
    throw new AppError('AI failed to generate insights. Please try again.', 502);
  }

  if (!Array.isArray(insights)) {
    throw new AppError('Unexpected AI response format for insights.', 502);
  }

  // Sanitise: keep only strings, clamp to 3–10
  const sanitised = insights
    .filter((i) => typeof i === 'string' && i.trim().length > 0)
    .slice(0, 10);

  if (sanitised.length < 1) {
    throw new AppError('AI returned no usable insights.', 502);
  }

  return sanitised;
}

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------

/**
 * Generate AI insights for a circle.
 *
 * @param {string} circleId
 * @param {{ forceRefresh?: boolean }} options
 * @returns {Promise<{ insights: string[], cachedAt: string|null, circleId: string }>}
 */
export async function getCircleInsights(circleId, { forceRefresh = false } = {}) {
  // Check cache
  if (!forceRefresh) {
    const cached = getCached(circleId);
    if (cached) {
      logger.info('Returning cached insights', { circleId });
      return cached;
    }
  }

  // Verify circle exists
  const circleExists = await prisma.circle.findUnique({ where: { id: circleId }, select: { id: true } });
  if (!circleExists) {
    throw new AppError('Circle not found.', 404);
  }

  // Gather data and generate
  const data = await gatherCircleData(circleId);
  const insights = await generateInsightsWithGemini(data);

  const result = {
    circleId,
    insights,
    count: insights.length,
    generatedAt: new Date().toISOString(),
    cached: false,
  };

  setCache(circleId, { ...result, cached: true });

  return result;
}
