import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import {
  assertShareTotalMatchesAmount,
  computeCustomShares,
  computeEqualShares,
  computePercentageShares,
} from '../utils/money.js';
import { getCircleMemberIds, requireMembership } from '../utils/membership.js';

const payerSelect = {
  id: true,
  name: true,
  email: true,
};

const expenseInclude = {
  paidBy: { select: payerSelect },
  participants: {
    include: {
      user: { select: payerSelect },
    },
    orderBy: { createdAt: 'asc' },
  },
};

function decimalToNumber(value) {
  return Number(value);
}

function formatParticipant(participant) {
  return {
    id: participant.id,
    userId: participant.userId,
    name: participant.user.name,
    email: participant.user.email,
    shareAmount: decimalToNumber(participant.shareAmount),
    sharePercentage:
      participant.sharePercentage === null ? null : decimalToNumber(participant.sharePercentage),
  };
}

function formatExpense(expense) {
  return {
    id: expense.id,
    circleId: expense.circleId,
    description: expense.description,
    amount: decimalToNumber(expense.amount),
    splitMethod: expense.splitMethod,
    expenseDate: expense.expenseDate,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
    paidBy: expense.paidBy,
    participants: expense.participants.map(formatParticipant),
  };
}

function assertUsersAreMembers(userIds, memberIds) {
  for (const userId of userIds) {
    if (!memberIds.has(userId)) {
      throw new AppError('All participants and payer must be members of this circle', 400);
    }
  }
}

function computeShares(splitMethod, amount, participants) {
  let shares;

  switch (splitMethod) {
    case 'EQUAL':
      shares = computeEqualShares(
        amount,
        participants.map((participant) => participant.userId)
      );
      break;
    case 'PERCENTAGE':
      shares = computePercentageShares(amount, participants);
      break;
    case 'CUSTOM':
      shares = computeCustomShares(amount, participants);
      break;
    default:
      throw new AppError('Unsupported split method', 400);
  }

  assertShareTotalMatchesAmount(shares, amount);
  return shares;
}

export async function createExpense(userId, circleId, input) {
  await requireMembership(userId, circleId);

  const memberIds = await getCircleMemberIds(circleId);
  const paidById = input.paidById ?? userId;

  const participantUserIds = input.participants.map((participant) => participant.userId);
  assertUsersAreMembers([paidById, ...participantUserIds], memberIds);

  const shares = computeShares(input.splitMethod, input.amount, input.participants);

  const expense = await prisma.$transaction(async (tx) => {
    return tx.expense.create({
      data: {
        circleId,
        paidById,
        description: input.description,
        amount: input.amount,
        splitMethod: input.splitMethod,
        expenseDate: input.expenseDate,
        participants: {
          create: shares.map((share) => ({
            userId: share.userId,
            shareAmount: share.shareAmount,
            sharePercentage: share.sharePercentage,
          })),
        },
      },
      include: expenseInclude,
    });
  });

  return formatExpense(expense);
}

export async function getExpensesForCircle(userId, circleId) {
  await requireMembership(userId, circleId);

  const expenses = await prisma.expense.findMany({
    where: { circleId },
    include: expenseInclude,
    orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
  });

  return expenses.map(formatExpense);
}

export async function getExpenseById(userId, circleId, expenseId) {
  await requireMembership(userId, circleId);

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, circleId },
    include: expenseInclude,
  });

  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  return formatExpense(expense);
}
