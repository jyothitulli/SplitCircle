import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { requireMembership } from '../utils/membership.js';

// Helper to convert decimal amounts to cents to avoid floating-point errors
function toCents(amount) {
  const num = Number(amount);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

// Helper to convert cents back to decimal numbers
function fromCents(cents) {
  return Number((cents / 100).toFixed(2));
}

/**
 * Calculates current balances for all members of a circle.
 * Net Balance = (Amount Paid - Amount Owed) + (Settlements Paid - Settlements Received)
 */
export async function getCircleBalances(userId, circleId) {
  // Check membership
  await requireMembership(userId, circleId);

  // 1. Get all circle members
  const members = await prisma.member.findMany({
    where: { circleId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  // Initialize a balances map for current members
  const balancesMap = new Map();
  for (const member of members) {
    balancesMap.set(member.userId, {
      user: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        avatarUrl: member.user.avatarUrl,
      },
      amountPaidCents: 0,
      amountOwedCents: 0,
      netBalanceCents: 0,
    });
  }

  // 2. Fetch all expenses in the circle
  const expenses = await prisma.expense.findMany({
    where: { circleId },
    select: {
      id: true,
      amount: true,
      paidById: true,
    },
  });

  // 3. Fetch all splits (participants) for all expenses in the circle
  const splits = await prisma.expenseParticipant.findMany({
    where: {
      expense: { circleId },
    },
    select: {
      userId: true,
      shareAmount: true,
    },
  });

  // 4. Fetch all COMPLETED settlements for the circle
  const completedSettlements = await prisma.settlement.findMany({
    where: {
      circleId,
      status: 'COMPLETED',
    },
    select: {
      fromUserId: true,
      toUserId: true,
      amount: true,
    },
  });

  // Aggregate expenses paid
  for (const exp of expenses) {
    const record = balancesMap.get(exp.paidById);
    if (record) {
      record.amountPaidCents += toCents(exp.amount);
    }
  }

  // Aggregate shares owed
  for (const split of splits) {
    const record = balancesMap.get(split.userId);
    if (record) {
      record.amountOwedCents += toCents(split.shareAmount);
    }
  }

  // Adjust net balances based on completed settlements
  for (const set of completedSettlements) {
    const fromRecord = balancesMap.get(set.fromUserId);
    const toRecord = balancesMap.get(set.toUserId);
    const amtCents = toCents(set.amount);

    if (fromRecord) {
      // Sending a settlement reduces outstanding debt (brings net balance closer to 0 / increases it)
      fromRecord.netBalanceCents += amtCents;
    }
    if (toRecord) {
      // Receiving a settlement reduces credit (brings net balance closer to 0 / decreases it)
      toRecord.netBalanceCents -= amtCents;
    }
  }

  // Compute final net balance for each member: (Paid - Owed) + adjusted settlements
  return Array.from(balancesMap.values()).map((r) => {
    const netBalanceCents = r.amountPaidCents - r.amountOwedCents + r.netBalanceCents;
    return {
      user: r.user,
      amountPaid: fromCents(r.amountPaidCents),
      amountOwed: fromCents(r.amountOwedCents),
      netBalance: fromCents(netBalanceCents),
      // Keep cent representation internally for optimization engine if needed
      _netBalanceCents: netBalanceCents,
    };
  });
}

/**
 * Optimizes debts in the circle using a Greedy Algorithm and saves them as PENDING settlements.
 */
export async function optimizeSettlements(userId, circleId) {
  // Compute the current balances (which includes completed settlements)
  const balances = await getCircleBalances(userId, circleId);

  // Filter out members who are already settled (net balance is 0)
  const activeBalances = balances.filter((b) => b._netBalanceCents !== 0);

  // Separate into debtors (negative balance) and creditors (positive balance)
  const debtors = activeBalances
    .filter((b) => b._netBalanceCents < 0)
    .map((b) => ({
      userId: b.user.id,
      balanceCents: b._netBalanceCents,
    }));

  const creditors = activeBalances
    .filter((b) => b._netBalanceCents > 0)
    .map((b) => ({
      userId: b.user.id,
      balanceCents: b._netBalanceCents,
    }));

  const transactions = [];

  // Greedy matching loop
  while (debtors.length > 0 && creditors.length > 0) {
    // Sort debtors ascending (most negative first, i.e., owes the most)
    debtors.sort((a, b) => a.balanceCents - b.balanceCents);
    // Sort creditors descending (most positive first, i.e., owed the most)
    creditors.sort((a, b) => b.balanceCents - a.balanceCents);

    const D = debtors[0];
    const C = creditors[0];

    const debtCents = Math.abs(D.balanceCents);
    const creditCents = C.balanceCents;

    const amountCents = Math.min(debtCents, creditCents);

    transactions.push({
      circleId,
      fromUserId: D.userId,
      toUserId: C.userId,
      amount: fromCents(amountCents),
      status: 'PENDING',
    });

    // Update balances
    D.balanceCents += amountCents;
    C.balanceCents -= amountCents;

    // Remove users whose balances have been fully cleared
    if (D.balanceCents === 0) {
      debtors.shift();
    }
    if (C.balanceCents === 0) {
      creditors.shift();
    }
  }

  // Store settlements in the database inside a transaction
  return prisma.$transaction(async (tx) => {
    // 1. Delete all existing PENDING settlements for this circle
    await tx.settlement.deleteMany({
      where: {
        circleId,
        status: 'PENDING',
      },
    });

    // 2. Create the new optimized pending settlements
    const promises = transactions.map((t) =>
      tx.settlement.create({
        data: {
          circleId: t.circleId,
          fromUserId: t.fromUserId,
          toUserId: t.toUserId,
          amount: t.amount,
          status: 'PENDING',
        },
        include: {
          fromUser: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          toUser: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      })
    );

    return Promise.all(promises);
  });
}

/**
 * Marks a specific settlement as completed.
 */
export async function paySettlement(userId, settlementId) {
  // Fetch settlement with its circle membership check
  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
    include: {
      circle: {
        include: {
          members: {
            select: { userId: true },
          },
        },
      },
    },
  });

  if (!settlement) {
    throw new AppError('Settlement not found', 404);
  }

  // Ensure the calling user is part of the circle
  const isMember = settlement.circle.members.some((m) => m.userId === userId);
  if (!isMember) {
    throw new AppError('You are not a member of this circle', 403);
  }

  // Ensure the settlement is not already completed
  if (settlement.status === 'COMPLETED') {
    throw new AppError('Settlement is already completed', 400);
  }

  // Update status to COMPLETED and set settledAt timestamp
  return prisma.settlement.update({
    where: { id: settlementId },
    data: {
      status: 'COMPLETED',
      settledAt: new Date(),
    },
    include: {
      fromUser: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      toUser: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });
}
