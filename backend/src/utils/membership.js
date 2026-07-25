import { prisma } from '../config/prisma.js';
import { AppError } from './AppError.js';

export async function requireMembership(userId, circleId) {
  const membership = await prisma.member.findUnique({
    where: { userId_circleId: { userId, circleId } },
  });

  if (!membership) {
    throw new AppError('You are not a member of this circle', 403);
  }

  return membership;
}

export async function getCircleMemberIds(circleId) {
  const members = await prisma.member.findMany({
    where: { circleId },
    select: { userId: true },
  });

  return new Set(members.map((member) => member.userId));
}

// Alias used by the Phase 9C/9D controllers (insights, conflicts). Kept as a
// separate named export (rather than renaming `requireMembership`) so every
// existing call site — old and new — keeps working unchanged.
export const requireCircleMembership = requireMembership;
