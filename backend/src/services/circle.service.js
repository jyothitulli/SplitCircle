import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

const INVITE_ROLES = ['OWNER', 'ADMIN'];

const circleSelect = {
  id: true,
  name: true,
  description: true,
  inviteCode: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
};

function formatCircle(circle, { memberCount, expenseCount, myRole }) {
  return {
    id: circle.id,
    name: circle.name,
    description: circle.description,
    inviteCode: circle.inviteCode,
    createdById: circle.createdById,
    createdAt: circle.createdAt,
    updatedAt: circle.updatedAt,
    memberCount,
    expenseCount,
    myRole,
  };
}

async function findMembership(userId, circleId) {
  return prisma.member.findUnique({
    where: { userId_circleId: { userId, circleId } },
  });
}

async function requireMembership(userId, circleId) {
  const membership = await findMembership(userId, circleId);
  if (!membership) {
    throw new AppError('You are not a member of this circle', 403);
  }
  return membership;
}

function requireCanInvite(membership) {
  if (!INVITE_ROLES.includes(membership.role)) {
    throw new AppError('Only owners and admins can add members', 403);
  }
}

export async function createCircle(userId, { name, description }) {
  const circle = await prisma.$transaction(async (tx) => {
    return tx.circle.create({
      data: {
        name,
        description,
        createdById: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      select: {
        ...circleSelect,
        _count: { select: { members: true, expenses: true } },
      },
    });
  });

  return formatCircle(circle, {
    memberCount: circle._count.members,
    expenseCount: circle._count.expenses,
    myRole: 'OWNER',
  });
}

export async function getMyCircles(userId) {
  const memberships = await prisma.member.findMany({
    where: { userId },
    include: {
      circle: {
        select: {
          ...circleSelect,
          _count: { select: { members: true, expenses: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return memberships.map(({ role, circle }) =>
    formatCircle(circle, {
      memberCount: circle._count.members,
      expenseCount: circle._count.expenses,
      myRole: role,
    })
  );
}

export async function getCircleDetails(userId, circleId) {
  const membership = await requireMembership(userId, circleId);

  const circle = await prisma.circle.findUnique({
    where: { id: circleId },
    select: {
      ...circleSelect,
      _count: { select: { members: true, expenses: true } },
    },
  });

  if (!circle) {
    throw new AppError('Circle not found', 404);
  }

  return formatCircle(circle, {
    memberCount: circle._count.members,
    expenseCount: circle._count.expenses,
    myRole: membership.role,
  });
}

export async function addMemberByEmail(actorId, circleId, { email }) {
  const actorMembership = await requireMembership(actorId, circleId);
  requireCanInvite(actorMembership);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    throw new AppError('No registered user found with that email', 404);
  }

  try {
    const member = await prisma.member.create({
      data: {
        userId: user.id,
        circleId,
        role: 'MEMBER',
      },
      select: {
        role: true,
        joinedAt: true,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: member.role,
      joinedAt: member.joinedAt,
    };
  } catch (error) {
    if (error.code === 'P2002') {
      throw new AppError('User is already a member of this circle', 409);
    }
    throw error;
  }
}

export async function listMembers(userId, circleId) {
  await requireMembership(userId, circleId);

  const members = await prisma.member.findMany({
    where: { circleId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
  });

  return members.map((member) => ({
    id: member.user.id,
    name: member.user.name,
    email: member.user.email,
    role: member.role,
    joinedAt: member.joinedAt,
  }));
}

export async function leaveCircle(userId, circleId) {
  const membership = await requireMembership(userId, circleId);

  if (membership.role === 'OWNER') {
    throw new AppError(
      'Circle owner cannot leave. Transfer ownership or delete the circle first.',
      403
    );
  }

  await prisma.member.delete({
    where: { id: membership.id },
  });
}
