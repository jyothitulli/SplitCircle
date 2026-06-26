import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { requireMembership } from '../utils/membership.js';

/**
 * Creates a chore definition. Optionally creates its first assignment.
 */
export async function createChore(userId, circleId, input) {
  // Check that the creator is a member of the circle
  await requireMembership(userId, circleId);

  // If assigning, ensure the assignee is also in the circle
  if (input.assignedUserId) {
    await requireMembership(input.assignedUserId, circleId);
  }

  return prisma.$transaction(async (tx) => {
    // 1. Create the chore
    const chore = await tx.chore.create({
      data: {
        circleId,
        title: input.title,
        description: input.description,
        isRecurring: input.isRecurring,
        recurrenceInterval: input.recurrenceInterval,
      },
    });

    // 2. If initial assignment is provided, create it
    if (input.assignedUserId && input.dueDate) {
      const assignment = await tx.choreAssignment.create({
        data: {
          choreId: chore.id,
          userId: input.assignedUserId,
          dueDate: input.dueDate,
          status: 'PENDING',
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      return {
        ...chore,
        assignments: [assignment],
      };
    }

    return {
      ...chore,
      assignments: [],
    };
  });
}

/**
 * Assigns an existing chore to a circle member.
 */
export async function assignChore(userId, circleId, choreId, input) {
  // Verify actor membership
  await requireMembership(userId, circleId);

  // Verify assignee membership
  await requireMembership(input.userId, circleId);

  // Verify chore exists in this circle
  const chore = await prisma.chore.findFirst({
    where: { id: choreId, circleId },
  });

  if (!chore) {
    throw new AppError('Chore not found in this circle', 404);
  }

  // Create the assignment
  return prisma.choreAssignment.create({
    data: {
      choreId,
      userId: input.userId,
      dueDate: input.dueDate,
      status: 'PENDING',
    },
    include: {
      chore: true,
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });
}

/**
 * Marks a chore assignment as completed and handles recurrence logic.
 */
export async function completeChoreAssignment(userId, assignmentId) {
  // Fetch assignment with circle membership check
  const assignment = await prisma.choreAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      chore: {
        include: {
          circle: {
            include: {
              members: { select: { userId: true } },
            },
          },
        },
      },
    },
  });

  if (!assignment) {
    throw new AppError('Chore assignment not found', 404);
  }

  // Verify membership
  const isMember = assignment.chore.circle.members.some((m) => m.userId === userId);
  if (!isMember) {
    throw new AppError('You are not a member of this circle', 403);
  }

  // Ensure assignment is pending
  if (assignment.status !== 'PENDING') {
    throw new AppError('Assignment is already completed or missed', 400);
  }

  return prisma.$transaction(async (tx) => {
    // 1. Mark as completed
    const completedAssignment = await tx.choreAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        chore: true,
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    // 2. Generate next instance if recurring
    if (completedAssignment.chore.isRecurring) {
      const interval = completedAssignment.chore.recurrenceInterval;
      const nextDueDate = new Date(completedAssignment.dueDate);

      if (interval === 'DAILY') {
        nextDueDate.setDate(nextDueDate.getDate() + 1);
      } else if (interval === 'WEEKLY') {
        nextDueDate.setDate(nextDueDate.getDate() + 7);
      } else if (interval === 'MONTHLY') {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }

      await tx.choreAssignment.create({
        data: {
          choreId: completedAssignment.choreId,
          userId: completedAssignment.userId,
          dueDate: nextDueDate,
          status: 'PENDING',
        },
      });
    }

    return completedAssignment;
  });
}

/**
 * Lists all chores in a circle.
 */
export async function listChores(userId, circleId) {
  await requireMembership(userId, circleId);

  return prisma.chore.findMany({
    where: { circleId },
    include: {
      assignments: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { dueDate: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Lists all chore assignments in a circle.
 */
export async function listAssignments(userId, circleId) {
  await requireMembership(userId, circleId);

  return prisma.choreAssignment.findMany({
    where: {
      chore: { circleId },
    },
    include: {
      chore: true,
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { dueDate: 'desc' },
  });
}

/**
 * Calculates analytics for all chores and users in a circle.
 */
export async function getChoreAnalytics(userId, circleId) {
  await requireMembership(userId, circleId);

  // 1. Fetch all members
  const members = await prisma.member.findMany({
    where: { circleId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });

  // 2. Fetch all chore definitions
  const chores = await prisma.chore.findMany({
    where: { circleId },
    select: { id: true, title: true, isRecurring: true },
  });

  // 3. Fetch all assignments
  const assignments = await prisma.choreAssignment.findMany({
    where: {
      chore: { circleId },
    },
    select: {
      id: true,
      choreId: true,
      userId: true,
      dueDate: true,
      status: true,
      completedAt: true,
    },
  });

  // Helper to determine if assignment is missed
  const isAssignmentMissed = (a) => {
    if (a.status === 'MISSED') return true;
    if (a.status !== 'PENDING') return false;

    const due = new Date(a.dueDate);
    due.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return due < today;
  };

  // Helper to calculate rate
  const calculateRate = (completed, total) => {
    if (total === 0) return 0;
    return Number(((completed / total) * 100).toFixed(2));
  };

  // --- Aggregate Circle Summary ---
  let circleAssigned = assignments.length;
  let circleCompleted = 0;
  let circleMissed = 0;

  for (const a of assignments) {
    if (a.status === 'COMPLETED') {
      circleCompleted++;
    } else if (isAssignmentMissed(a)) {
      circleMissed++;
    }
  }

  const summary = {
    totalAssigned: circleAssigned,
    totalCompleted: circleCompleted,
    totalMissed: circleMissed,
    overallCompletionRate: calculateRate(circleCompleted, circleAssigned),
  };

  // --- Aggregate User Analytics ---
  const userMap = new Map();
  for (const m of members) {
    userMap.set(m.userId, {
      user: m.user,
      assignedCount: 0,
      completedCount: 0,
      missedCount: 0,
      completionRate: 0,
    });
  }

  for (const a of assignments) {
    const stat = userMap.get(a.userId);
    if (stat) {
      stat.assignedCount++;
      if (a.status === 'COMPLETED') {
        stat.completedCount++;
      } else if (isAssignmentMissed(a)) {
        stat.missedCount++;
      }
    }
  }

  const userAnalytics = Array.from(userMap.values()).map((stat) => ({
    ...stat,
    completionRate: calculateRate(stat.completedCount, stat.assignedCount),
  }));

  // --- Aggregate Chore Analytics ---
  const choreMap = new Map();
  for (const c of chores) {
    choreMap.set(c.id, {
      chore: c,
      assignedCount: 0,
      completedCount: 0,
      missedCount: 0,
      completionRate: 0,
    });
  }

  for (const a of assignments) {
    const stat = choreMap.get(a.choreId);
    if (stat) {
      stat.assignedCount++;
      if (a.status === 'COMPLETED') {
        stat.completedCount++;
      } else if (isAssignmentMissed(a)) {
        stat.missedCount++;
      }
    }
  }

  const choreAnalytics = Array.from(choreMap.values()).map((stat) => ({
    ...stat,
    completionRate: calculateRate(stat.completedCount, stat.assignedCount),
  }));

  return {
    summary,
    userAnalytics,
    choreAnalytics,
  };
}
