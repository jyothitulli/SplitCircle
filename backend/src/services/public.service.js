import { prisma } from '../config/prisma.js';

/**
 * Real aggregate numbers for the landing page's social-proof strip.
 * Intentionally exposes ONLY counts and a single summed total — never
 * names, emails, or any other per-record field. Anything more detailed
 * belongs behind an authenticated/admin-only endpoint instead.
 */
export async function getCommunityStats() {
  const [userCount, circleCount, expenseAgg] = await Promise.all([
    prisma.user.count(),
    prisma.circle.count(),
    prisma.expense.aggregate({ _sum: { amount: true } }),
  ]);

  // Prisma returns Decimal | null for _sum.amount when there are no rows.
  const totalExpenseAmount = Number(expenseAgg._sum.amount ?? 0);

  return {
    userCount,
    circleCount,
    totalExpenseAmount,
  };
}
