import { prisma } from './src/config/prisma.js';
import * as authService from './src/services/auth.service.js';
import * as circleService from './src/services/circle.service.js';
import * as expenseService from './src/services/expense.service.js';
import * as choreService from './src/services/chore.service.js';
import * as settlementService from './src/services/settlement.service.js';
import * as fairnessService from './src/services/fairness.service.js';

async function run() {
  console.log('--- Starting Phase 8 Fairness Score Engine Tests ---');

  try {
    // 1. Clean up existing test data
    console.log('Cleaning up existing test data...');
    await prisma.fairnessScore.deleteMany({
      where: { circle: { name: 'Test Fairness Circle' } },
    });
    await prisma.settlement.deleteMany({
      where: { circle: { name: 'Test Fairness Circle' } },
    });
    await prisma.choreAssignment.deleteMany({
      where: { chore: { circle: { name: 'Test Fairness Circle' } } },
    });
    await prisma.chore.deleteMany({
      where: { circle: { name: 'Test Fairness Circle' } },
    });
    await prisma.expenseParticipant.deleteMany({
      where: { expense: { circle: { name: 'Test Fairness Circle' } } },
    });
    await prisma.expense.deleteMany({
      where: { circle: { name: 'Test Fairness Circle' } },
    });
    await prisma.member.deleteMany({
      where: { circle: { name: 'Test Fairness Circle' } },
    });
    await prisma.circle.deleteMany({
      where: { name: 'Test Fairness Circle' },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test_fair_a@example.com', 'test_fair_b@example.com'],
        },
      },
    });

    // 2. Create Users
    console.log('Creating test users A and B...');
    const userA = await authService.registerUser({
      name: 'Fair User A',
      email: 'test_fair_a@example.com',
      password: 'Password123!',
    });
    const userB = await authService.registerUser({
      name: 'Fair User B',
      email: 'test_fair_b@example.com',
      password: 'Password123!',
    });

    // 3. Create Circle
    console.log('Creating Test Fairness Circle...');
    const circle = await circleService.createCircle(userA.user.id, {
      name: 'Test Fairness Circle',
      description: 'A circle for testing fairness',
    });

    // 4. Add User B to Circle
    console.log('Adding User B to Circle...');
    await circleService.addMemberByEmail(userA.user.id, circle.id, { email: userB.user.email });

    // 5. Create Expense: A paid 1200, split between A and B (600 each)
    console.log('Creating Expense: A paid 1200...');
    await expenseService.createExpense(userA.user.id, circle.id, {
      description: 'Test split',
      amount: 1200.0,
      splitMethod: 'EQUAL',
      paidById: userA.user.id,
      participants: [{ userId: userA.user.id }, { userId: userB.user.id }],
    });

    // 6. Create Chores
    console.log('Creating Chores and Assignments...');
    // Chore 1 (A): completed
    const chore1 = await choreService.createChore(userA.user.id, circle.id, {
      title: 'Chore A',
      description: 'Assign to A',
      isRecurring: false,
      assignedUserId: userA.user.id,
      dueDate: new Date(),
    });
    // Chore 2 (B): pending (missed)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const chore2 = await choreService.createChore(userA.user.id, circle.id, {
      title: 'Chore B',
      description: 'Assign to B',
      isRecurring: false,
      assignedUserId: userB.user.id,
      dueDate: yesterday,
    });

    console.log('Completing A\'s chore...');
    await choreService.completeChoreAssignment(userA.user.id, chore1.assignments[0].id);

    // 7. Calculate Fairness (A has 100, B has 10)
    console.log('Calculating initial fairness...');
    let scores = await fairnessService.calculateCircleFairness(userA.user.id, circle.id);
    console.log('Initial Fairness Scores:', JSON.stringify(scores, null, 2));

    const checkScores = (email, expVal, choreVal, partVal, overVal) => {
      const s = scores.find((x) => x.user.email === email);
      if (!s) throw new Error(`User with email ${email} not found in scores`);
      if (Number(s.expenseScore) !== expVal) throw new Error(`${email} expenseScore ${s.expenseScore} != ${expVal}`);
      if (Number(s.choreScore) !== choreVal) throw new Error(`${email} choreScore ${s.choreScore} != ${choreVal}`);
      if (Number(s.participationScore) !== partVal) {
        throw new Error(`${email} participationScore ${s.participationScore} != ${partVal}`);
      }
      if (Number(s.overallScore) !== overVal) throw new Error(`${email} overallScore ${s.overallScore} != ${overVal}`);
    };

    checkScores('test_fair_a@example.com', 100, 100, 100, 100);
    checkScores('test_fair_b@example.com', 0, 0, 50, 10);
    console.log('Initial fairness scores verified successfully!');

    // 8. B pays A 600 to settle
    console.log('Recording Settlement payment B -> A (600)...');
    // We optimize to get a settlement id, then pay it
    const opts = await settlementService.optimizeSettlements(userA.user.id, circle.id);
    const sB = opts.find((x) => x.fromUser.email === 'test_fair_b@example.com');
    await settlementService.paySettlement(userA.user.id, sB.id);
    console.log('Settlement paid.');

    // 9. Complete Chore 2 for User B
    console.log('Completing B\'s chore...');
    await choreService.completeChoreAssignment(userB.user.id, chore2.assignments[0].id);
    console.log('Chore completed.');

    // 10. Re-calculate Fairness (A has 100, B has 96)
    console.log('Re-calculating fairness...');
    scores = await fairnessService.calculateCircleFairness(userA.user.id, circle.id);
    console.log('Updated Fairness Scores:', JSON.stringify(scores, null, 2));

    checkScores('test_fair_a@example.com', 100, 100, 100, 100);
    checkScores('test_fair_b@example.com', 100, 100, 80, 96);
    console.log('Updated fairness scores verified successfully!');

    // 11. Retrieve Leaderboard via GET
    console.log('Retrieving leaderboard...');
    const leaderboard = await fairnessService.getCircleFairness(userA.user.id, circle.id);
    console.log('Leaderboard:', JSON.stringify(leaderboard, null, 2));
    if (leaderboard.length !== 2) throw new Error('Expected 2 users in leaderboard');
    if (leaderboard[0].user.email !== 'test_fair_a@example.com') throw new Error('Expected User A first');
    if (leaderboard[1].user.email !== 'test_fair_b@example.com') throw new Error('Expected User B second');
    console.log('Leaderboard verified successfully!');

    console.log('--- ALL TESTS PASSED SUCCESSFULLY! ---');
  } catch (error) {
    console.error('TEST FAILED WITH ERROR:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
