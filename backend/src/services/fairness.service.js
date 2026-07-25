import { prisma } from '../config/prisma.js';
import { requireMembership } from '../utils/membership.js';

// Helper to round numbers to 2 decimal places
const roundToTwo = (val) => Number(Number(val).toFixed(2));

/**
 * Calculates fairness scores for all circle members and stores them in the DB.
 */
export async function calculateCircleFairness(userId, circleId) {
  // Check membership
  await requireMembership(userId, circleId);

  // 1. Fetch all circle members
  const members = await prisma.member.findMany({
    where: { circleId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });

  // 2. Fetch all expenses in the circle
  const expenses = await prisma.expense.findMany({
    where: { circleId },
    select: { amount: true, paidById: true },
  });

  // 3. Fetch all Splits (participants) in the circle
  const splits = await prisma.expenseParticipant.findMany({
    where: { expense: { circleId } },
    select: { userId: true, shareAmount: true },
  });

  // 4. Fetch all COMPLETED settlements
  const completedSettlements = await prisma.settlement.findMany({
    where: { circleId, status: 'COMPLETED' },
    select: { fromUserId: true, toUserId: true, amount: true },
  });

  // 5. Fetch all chore assignments
  const assignments = await prisma.choreAssignment.findMany({
    where: { chore: { circleId } },
    select: { userId: true, status: true },
  });

  // Initialize aggregation map
  const statsMap = new Map();
  for (const m of members) {
    statsMap.set(m.userId, {
      userId: m.userId,
      user: m.user,
      // Expense sums (cents)
      expensePaidCents: 0,
      expenseOwedCents: 0,
      settlementsSentCents: 0,
      settlementsReceivedCents: 0,
      // Chore counts
      choreAssignedCount: 0,
      choreCompletedCount: 0,
      // Action frequencies (for participation)
      expensesPaidCount: 0,
      expenseSharesCount: 0,
      choreAssignmentsCount: 0,
      choreCompletionsCount: 0,
      settlementsSentCount: 0,
      settlementsReceivedCount: 0,
    });
  }

  // Populate expense paid
  for (const exp of expenses) {
    const s = statsMap.get(exp.paidById);
    if (s) {
      s.expensePaidCents += Math.round(Number(exp.amount) * 100);
      s.expensesPaidCount++;
    }
  }

  // Populate expense shares
  for (const split of splits) {
    const s = statsMap.get(split.userId);
    if (s) {
      s.expenseOwedCents += Math.round(Number(split.shareAmount) * 100);
      s.expenseSharesCount++;
    }
  }

  // Populate settlements
  for (const set of completedSettlements) {
    const fromS = statsMap.get(set.fromUserId);
    const toS = statsMap.get(set.toUserId);
    const amtCents = Math.round(Number(set.amount) * 100);

    if (fromS) {
      fromS.settlementsSentCents += amtCents;
      fromS.settlementsSentCount++;
    }
    if (toS) {
      toS.settlementsReceivedCents += amtCents;
      toS.settlementsReceivedCount++;
    }
  }

  // Populate chore assignments and completions
  for (const a of assignments) {
    const s = statsMap.get(a.userId);
    if (s) {
      s.choreAssignedCount++;
      s.choreAssignmentsCount++;
      if (a.status === 'COMPLETED') {
        s.choreCompletedCount++;
        s.choreCompletionsCount++;
      }
    }
  }

  // Compute maximum activity action count for relative participation
  let maxActions = 0;
  for (const s of statsMap.values()) {
    const actionsCount =
      s.expensesPaidCount +
      s.expenseSharesCount +
      s.choreAssignmentsCount +
      s.choreCompletionsCount +
      s.settlementsSentCount +
      s.settlementsReceivedCount;
    if (actionsCount > maxActions) {
      maxActions = actionsCount;
    }
  }

  // Save/Upsert fairness scores in database
  const savedScores = await prisma.$transaction(async (tx) => {
    const promises = Array.from(statsMap.values()).map(async (s) => {
      // 1. Expense Score
      const effectivePaid = s.expensePaidCents + s.settlementsSentCents;
      const effectiveOwed = s.expenseOwedCents + s.settlementsReceivedCents;
      const expenseScore = effectiveOwed > 0 ? Math.min(100, (effectivePaid / effectiveOwed) * 100) : 100;

      // 2. Chore Score
      const choreScore = s.choreAssignedCount > 0 ? (s.choreCompletedCount / s.choreAssignedCount) * 100 : 100;

      // 3. Participation Score (relative to most active member)
      const actionsCount =
        s.expensesPaidCount +
        s.expenseSharesCount +
        s.choreAssignmentsCount +
        s.choreCompletionsCount +
        s.settlementsSentCount +
        s.settlementsReceivedCount;
      const participationScore = maxActions > 0 ? (actionsCount / maxActions) * 100 : 100;

      // 4. Overall Weighted Score
      const overallScore = expenseScore * 0.5 + choreScore * 0.3 + participationScore * 0.2;

      return tx.fairnessScore.upsert({
        where: {
          circleId_userId: {
            circleId,
            userId: s.userId,
          },
        },
        update: {
          expenseScore: roundToTwo(expenseScore),
          choreScore: roundToTwo(choreScore),
          participationScore: roundToTwo(participationScore),
          overallScore: roundToTwo(overallScore),
        },
        create: {
          circleId,
          userId: s.userId,
          expenseScore: roundToTwo(expenseScore),
          choreScore: roundToTwo(choreScore),
          participationScore: roundToTwo(participationScore),
          overallScore: roundToTwo(overallScore),
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });
    });

    return Promise.all(promises);
  });

  // Return list sorted by overallScore descending
  return savedScores.sort((a, b) => Number(b.overallScore) - Number(a.overallScore));
}

/**
 * Retrieves the stored fairness score leaderboard for a circle.
 * Automatically calculates it if no scores have been stored yet.
 */
export async function getCircleFairness(userId, circleId) {
  // Check membership
  await requireMembership(userId, circleId);

  // Fetch from DB
  const scores = await prisma.fairnessScore.findMany({
    where: { circleId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { overallScore: 'desc' },
  });

  // If no scores have been calculated, calculate now
  if (scores.length === 0) {
    return calculateCircleFairness(userId, circleId);
  }

  // Return the fetched scores
  return scores;
}
