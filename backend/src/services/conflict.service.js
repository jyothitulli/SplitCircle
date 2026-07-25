/**
 * Conflict Prediction Engine — Phase 9D
 *
 * Pure rule-based system (no ML). Uses explainable thresholds to assign a
 * risk level and produce human-readable reasons.
 *
 * Rules:
 *  R1 — Fairness score < 60 for any member
 *  R2 — Chore completion rate < 50%
 *  R3 — Any member's expense contribution significantly below average (< 50% of avg)
 *
 * Risk aggregation:
 *  - 0 rules triggered → LOW
 *  - 1 rule triggered  → MEDIUM
 *  - 2+ rules triggered → HIGH
 */

import prisma from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Thresholds (tweak here — single source of truth)
// ---------------------------------------------------------------------------

const THRESHOLDS = {
  FAIRNESS_SCORE_LOW: 60,        // R1: individual fairness < 60
  CHORE_COMPLETION_LOW: 50,      // R2: circle-wide completion rate < 50%
  CONTRIBUTION_RATIO_LOW: 0.5,   // R3: member paid < 50% of the average
  CONTRIBUTION_MIN_EXPENSES: 3,  // R3: only evaluate circles with ≥3 expenses
};

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchConflictData(circleId) {
  const [members, fairnessScores, choreAssignments, expenses] = await Promise.all([
    prisma.member.findMany({
      where: { circleId },
      select: { user: { select: { id: true, name: true } } },
    }),

    prisma.fairnessScore.findMany({
      where: { circleId },
      select: {
        overallScore: true,
        expenseScore: true,
        choreScore: true,
        user: { select: { id: true, name: true } },
      },
    }),

    prisma.choreAssignment.findMany({
      where: { chore: { circleId } },
      select: { status: true, user: { select: { name: true } } },
    }),

    prisma.expense.findMany({
      where: { circleId },
      select: {
        amount: true,
        paidById: true,
        paidBy: { select: { name: true } },
      },
    }),
  ]);

  return { members, fairnessScores, choreAssignments, expenses };
}

// ---------------------------------------------------------------------------
// Rule evaluators
// ---------------------------------------------------------------------------

/**
 * R1 — Check if any member's fairness score is below the threshold.
 * @returns {{ triggered: boolean, reasons: string[] }}
 */
function checkFairnessScores(fairnessScores) {
  const reasons = [];

  for (const score of fairnessScores) {
    const overall = parseFloat(score.overallScore);
    if (overall < THRESHOLDS.FAIRNESS_SCORE_LOW) {
      reasons.push(
        `${score.user.name}'s fairness score is ${overall.toFixed(1)}/100, which is below the healthy threshold of ${THRESHOLDS.FAIRNESS_SCORE_LOW}.`
      );
    }
  }

  return { triggered: reasons.length > 0, reasons };
}

/**
 * R2 — Check if the circle-wide chore completion rate is below threshold.
 * @returns {{ triggered: boolean, reasons: string[] }}
 */
function checkChoreCompletion(choreAssignments) {
  const total = choreAssignments.length;

  if (total === 0) {
    return { triggered: false, reasons: [] };
  }

  const completed = choreAssignments.filter((c) => c.status === 'COMPLETED').length;
  const rate = (completed / total) * 100;

  if (rate < THRESHOLDS.CHORE_COMPLETION_LOW) {
    return {
      triggered: true,
      reasons: [
        `Only ${rate.toFixed(1)}% of chores have been completed (${completed}/${total}). This is below the expected ${THRESHOLDS.CHORE_COMPLETION_LOW}% completion rate.`,
      ],
    };
  }

  return { triggered: false, reasons: [] };
}

/**
 * R3 — Identify members whose expense contributions are significantly below average.
 * @returns {{ triggered: boolean, reasons: string[] }}
 */
function checkContributionImbalance(expenses, members) {
  if (expenses.length < THRESHOLDS.CONTRIBUTION_MIN_EXPENSES) {
    return { triggered: false, reasons: [] };
  }

  // Sum contributions per member
  const contributionMap = {};
  for (const member of members) {
    contributionMap[member.user.id] = { name: member.user.name, total: 0 };
  }
  for (const expense of expenses) {
    if (contributionMap[expense.paidById]) {
      contributionMap[expense.paidById].total += parseFloat(expense.amount);
    }
  }

  const contributions = Object.values(contributionMap);
  const totalSpend = contributions.reduce((s, c) => s + c.total, 0);
  const average = totalSpend / contributions.length;

  if (average === 0) return { triggered: false, reasons: [] };

  const reasons = [];
  for (const c of contributions) {
    const ratio = c.total / average;
    if (ratio < THRESHOLDS.CONTRIBUTION_RATIO_LOW) {
      const pct = (ratio * 100).toFixed(1);
      reasons.push(
        `${c.name} has contributed ₹${c.total.toFixed(2)}, which is only ${pct}% of the group average (₹${average.toFixed(2)}). This significant imbalance may cause tension.`
      );
    }
  }

  return { triggered: reasons.length > 0, reasons };
}

// ---------------------------------------------------------------------------
// Risk aggregation
// ---------------------------------------------------------------------------

function aggregateRisk(triggeredRules) {
  const count = triggeredRules.filter(Boolean).length;
  if (count === 0) return 'LOW';
  if (count === 1) return 'MEDIUM';
  return 'HIGH';
}

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------

/**
 * Predict conflicts for a circle using rule-based detection.
 *
 * @param {string} circleId
 * @returns {Promise<ConflictPrediction>}
 *
 * @typedef {Object} ConflictPrediction
 * @property {'LOW'|'MEDIUM'|'HIGH'} riskLevel
 * @property {string[]} reasons
 * @property {RuleBreakdown} ruleBreakdown
 * @property {string} evaluatedAt
 *
 * @typedef {Object} RuleBreakdown
 * @property {{ triggered: boolean, reasons: string[] }} fairnessScoreLow
 * @property {{ triggered: boolean, reasons: string[] }} choreCompletionLow
 * @property {{ triggered: boolean, reasons: string[] }} contributionImbalance
 */
export async function predictCircleConflicts(circleId) {
  // Verify circle exists
  const circleExists = await prisma.circle.findUnique({
    where: { id: circleId },
    select: { id: true },
  });
  if (!circleExists) {
    throw new AppError('Circle not found.', 404);
  }

  logger.info('Running conflict prediction', { circleId });

  const { members, fairnessScores, choreAssignments, expenses } =
    await fetchConflictData(circleId);

  // Evaluate all rules
  const r1 = checkFairnessScores(fairnessScores);
  const r2 = checkChoreCompletion(choreAssignments);
  const r3 = checkContributionImbalance(expenses, members);

  const riskLevel = aggregateRisk([r1.triggered, r2.triggered, r3.triggered]);
  const reasons = [...r1.reasons, ...r2.reasons, ...r3.reasons];

  logger.info('Conflict prediction complete', {
    circleId,
    riskLevel,
    triggeredRules: [r1.triggered, r2.triggered, r3.triggered].filter(Boolean).length,
  });

  return {
    riskLevel,
    reasons,
    ruleBreakdown: {
      fairnessScoreLow: r1,
      choreCompletionLow: r2,
      contributionImbalance: r3,
    },
    memberCount: members.length,
    evaluatedAt: new Date().toISOString(),
  };
}
