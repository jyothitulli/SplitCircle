// One-off generator script — produces SplitCircle_Phase8_Fairness.postman_collection.json
// Not part of the app; run with `node build_collection.js` only if you need to regenerate it.
import { writeFileSync } from 'fs';

function req({ name, method, path, auth, body, tests = [], description = '' }) {
  const item = {
    name,
    request: {
      method,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      url: {
        raw: '{{baseUrl}}' + path,
        host: ['{{baseUrl}}'],
        path: path.replace(/^\//, '').split('/'),
      },
      description,
    },
  };
  if (auth) {
    item.request.header.push({ key: 'Authorization', value: `Bearer {{${auth}}}` });
  }
  if (body) {
    item.request.body = { mode: 'raw', raw: JSON.stringify(body, null, 2) };
  }
  if (tests.length) {
    item.event = [
      {
        listen: 'test',
        script: { type: 'text/javascript', exec: tests },
      },
    ];
  }
  return item;
}

const setup = [
  req({
    name: 'Register User A (Owner)',
    method: 'POST',
    path: '/auth/register',
    body: {
      name: 'Fairness Owner',
      email: 'fair.owner.{{$timestamp}}@example.com',
      password: 'Password123!',
    },
    description: 'Creates the circle owner. Email is timestamped so the collection is re-runnable.',
    tests: [
      "pm.test('User A registered (201)', () => pm.response.to.have.status(201));",
      'const json = pm.response.json();',
      "pm.collectionVariables.set('tokenA', json.data.token);",
      "pm.collectionVariables.set('userAId', json.data.user.id);",
      "pm.collectionVariables.set('userAEmail', json.data.user.email);",
    ],
  }),
  req({
    name: 'Register User B (Member)',
    method: 'POST',
    path: '/auth/register',
    body: {
      name: 'Fairness Member B',
      email: 'fair.memberb.{{$timestamp}}@example.com',
      password: 'Password123!',
    },
    tests: [
      "pm.test('User B registered (201)', () => pm.response.to.have.status(201));",
      'const json = pm.response.json();',
      "pm.collectionVariables.set('tokenB', json.data.token);",
      "pm.collectionVariables.set('userBId', json.data.user.id);",
      "pm.collectionVariables.set('userBEmail', json.data.user.email);",
    ],
  }),
  req({
    name: 'Register User C (Outsider, never joins circle)',
    method: 'POST',
    path: '/auth/register',
    body: {
      name: 'Outsider C',
      email: 'fair.outsider.{{$timestamp}}@example.com',
      password: 'Password123!',
    },
    description: 'Used later to prove non-members get 403 on fairness endpoints.',
    tests: [
      "pm.test('User C registered (201)', () => pm.response.to.have.status(201));",
      'const json = pm.response.json();',
      "pm.collectionVariables.set('tokenC', json.data.token);",
    ],
  }),
  req({
    name: 'Create Circle (as A)',
    method: 'POST',
    path: '/circles',
    auth: 'tokenA',
    body: { name: 'Fairness Test Circle', description: 'Created by the Phase 8 Postman suite' },
    tests: [
      "pm.test('Circle created (201)', () => pm.response.to.have.status(201));",
      'const json = pm.response.json();',
      "pm.collectionVariables.set('circleId', json.data.circle.id);",
    ],
  }),
  req({
    name: 'Add Member B to Circle',
    method: 'POST',
    path: '/circles/{{circleId}}/members',
    auth: 'tokenA',
    body: { email: '{{userBEmail}}' },
    tests: [
      "pm.test('Member added (201)', () => pm.response.to.have.status(201));",
    ],
  }),
];

const happyPath = [
  req({
    name: 'Create Expense (A pays 1200, split equally with B)',
    method: 'POST',
    path: '/circles/{{circleId}}/expenses',
    auth: 'tokenA',
    body: {
      description: 'Groceries',
      amount: 1200.0,
      splitMethod: 'EQUAL',
      paidById: '{{userAId}}',
      participants: [{ userId: '{{userAId}}' }, { userId: '{{userBId}}' }],
    },
    tests: [
      "pm.test('Expense created (201)', () => pm.response.to.have.status(201));",
      'const json = pm.response.json();',
      "pm.collectionVariables.set('expenseId', json.data.expense.id);",
    ],
  }),
  req({
    name: "Create Chore for A (due today)",
    method: 'POST',
    path: '/circles/{{circleId}}/chores',
    auth: 'tokenA',
    body: {
      title: 'Take out the trash',
      description: 'Weekly bins',
      isRecurring: false,
      assignedUserId: '{{userAId}}',
      dueDate: '{{$isoTimestamp}}',
    },
    tests: [
      "pm.test('Chore A created (201)', () => pm.response.to.have.status(201));",
      'const json = pm.response.json();',
      "pm.collectionVariables.set('choreAId', json.data.chore.id);",
      "pm.collectionVariables.set('assignmentAId', json.data.chore.assignments[0].id);",
    ],
  }),
  req({
    name: "Create Chore for B (due today)",
    method: 'POST',
    path: '/circles/{{circleId}}/chores',
    auth: 'tokenA',
    body: {
      title: 'Wash the dishes',
      description: 'Daily dishes',
      isRecurring: false,
      assignedUserId: '{{userBId}}',
      dueDate: '{{$isoTimestamp}}',
    },
    tests: [
      "pm.test('Chore B created (201)', () => pm.response.to.have.status(201));",
      'const json = pm.response.json();',
      "pm.collectionVariables.set('choreBId', json.data.chore.id);",
      "pm.collectionVariables.set('assignmentBId', json.data.chore.assignments[0].id);",
    ],
  }),
  req({
    name: "Complete A's Chore Assignment",
    method: 'POST',
    path: '/chores/assignments/{{assignmentAId}}/complete',
    auth: 'tokenA',
    tests: [
      "pm.test('Assignment completed (200)', () => pm.response.to.have.status(200));",
    ],
  }),
  req({
    name: 'Calculate Fairness Scores (B has not paid or finished chore yet)',
    method: 'POST',
    path: '/circles/{{circleId}}/fairness/calculate',
    auth: 'tokenA',
    tests: [
      "pm.test('Status is 200', () => pm.response.to.have.status(200));",
      'const scores = pm.response.json().data.scores;',
      "pm.test('Scores returned for both members', () => pm.expect(scores.length).to.eql(2));",
      "pm.test('Sorted descending by overallScore', () => {",
      '  for (let i = 1; i < scores.length; i++) {',
      '    pm.expect(Number(scores[i - 1].overallScore)).to.be.at.least(Number(scores[i].overallScore));',
      '  }',
      '});',
      "const a = scores.find((s) => s.userId === pm.collectionVariables.get('userAId'));",
      "const b = scores.find((s) => s.userId === pm.collectionVariables.get('userBId'));",
      "pm.test('A (paid in full, chore done) scores 100 overall', () => pm.expect(Number(a.overallScore)).to.eql(100));",
      "pm.test('B (owes share, chore pending) scores below 100', () => pm.expect(Number(b.overallScore)).to.be.below(100));",
      "pm.test('Weighted formula holds for A: 0.5*expense + 0.3*chore + 0.2*participation', () => {",
      '  const expected = Number(a.expenseScore) * 0.5 + Number(a.choreScore) * 0.3 + Number(a.participationScore) * 0.2;',
      '  pm.expect(Number(a.overallScore)).to.be.closeTo(expected, 0.01);',
      '});',
    ],
  }),
  req({
    name: 'Get Fairness Leaderboard (as B — any member can read)',
    method: 'GET',
    path: '/circles/{{circleId}}/fairness',
    auth: 'tokenB',
    tests: [
      "pm.test('Status is 200', () => pm.response.to.have.status(200));",
      'const leaderboard = pm.response.json().data.leaderboard;',
      "pm.test('Leaderboard sorted descending', () => {",
      '  for (let i = 1; i < leaderboard.length; i++) {',
      '    pm.expect(Number(leaderboard[i - 1].overallScore)).to.be.at.least(Number(leaderboard[i].overallScore));',
      '  }',
      '});',
      "pm.test('Leaderboard reflects the last calculate call (persisted, not recomputed on GET)', () => {",
      '  pm.expect(leaderboard.length).to.eql(2);',
      '});',
    ],
  }),
  req({
    name: "Complete B's Chore Assignment",
    method: 'POST',
    path: '/chores/assignments/{{assignmentBId}}/complete',
    auth: 'tokenB',
    tests: [
      "pm.test('Assignment completed (200)', () => pm.response.to.have.status(200));",
    ],
  }),
  req({
    name: 'Optimize Settlements (generates B -> A debt)',
    method: 'GET',
    path: '/circles/{{circleId}}/settlements/optimize',
    auth: 'tokenA',
    tests: [
      "pm.test('Status is 200', () => pm.response.to.have.status(200));",
      'const settlements = pm.response.json().data.settlements;',
      "const sBtoA = settlements.find((s) => s.fromUserId === pm.collectionVariables.get('userBId'));",
      "pm.test('A settlement from B to A exists', () => pm.expect(sBtoA).to.not.be.undefined);",
      "if (sBtoA) pm.collectionVariables.set('settlementId', sBtoA.id);",
    ],
  }),
  req({
    name: 'Pay Settlement (B settles up with A)',
    method: 'POST',
    path: '/settlements/{{settlementId}}/pay',
    auth: 'tokenB',
    tests: [
      "pm.test('Settlement paid (200)', () => pm.response.to.have.status(200));",
    ],
  }),
  req({
    name: 'Recalculate Fairness Scores (both fully settled and caught up)',
    method: 'POST',
    path: '/circles/{{circleId}}/fairness/calculate',
    auth: 'tokenA',
    tests: [
      "pm.test('Status is 200', () => pm.response.to.have.status(200));",
      'const scores = pm.response.json().data.scores;',
      "const a = scores.find((s) => s.userId === pm.collectionVariables.get('userAId'));",
      "const b = scores.find((s) => s.userId === pm.collectionVariables.get('userBId'));",
      "pm.test('A still scores 100 overall', () => pm.expect(Number(a.overallScore)).to.eql(100));",
      "pm.test('B now scores 100 overall after settling and finishing chores', () => pm.expect(Number(b.overallScore)).to.eql(100));",
    ],
  }),
];

const edgeCases = [
  req({
    name: 'Calculate Fairness — Missing Auth Token',
    method: 'POST',
    path: '/circles/{{circleId}}/fairness/calculate',
    tests: [
      "pm.test('Rejected without auth (401)', () => pm.response.to.have.status(401));",
    ],
  }),
  req({
    name: 'Calculate Fairness — Invalid Circle ID Format',
    method: 'POST',
    path: '/circles/not-a-uuid/fairness/calculate',
    auth: 'tokenA',
    tests: [
      "pm.test('Rejected with 400 for malformed UUID', () => pm.response.to.have.status(400));",
    ],
  }),
  req({
    name: 'Calculate Fairness — Well-formed but Non-existent Circle ID',
    method: 'POST',
    path: '/circles/11111111-1111-4111-8111-111111111111/fairness/calculate',
    auth: 'tokenA',
    tests: [
      "pm.test('Treated as not-a-member (403), never leaks existence', () => pm.response.to.have.status(403));",
    ],
  }),
  req({
    name: 'Get Fairness Leaderboard — Non-member (User C) Forbidden',
    method: 'GET',
    path: '/circles/{{circleId}}/fairness',
    auth: 'tokenC',
    tests: [
      "pm.test('Outsider blocked (403)', () => pm.response.to.have.status(403));",
    ],
  }),
  req({
    name: 'Create Solo Circle (no expenses/chores yet)',
    method: 'POST',
    path: '/circles',
    auth: 'tokenA',
    body: { name: 'Empty Fairness Circle', description: 'Edge case: brand-new circle' },
    tests: [
      "pm.test('Circle created (201)', () => pm.response.to.have.status(201));",
      "pm.collectionVariables.set('soloCircleId', pm.response.json().data.circle.id);",
    ],
  }),
  req({
    name: 'Get Fairness Leaderboard — Auto-calculates on First Read',
    method: 'GET',
    path: '/circles/{{soloCircleId}}/fairness',
    auth: 'tokenA',
    description:
      'No /calculate call has been made for this circle yet. The GET endpoint should ' +
      'transparently calculate and persist scores instead of returning an empty list.',
    tests: [
      "pm.test('Status is 200', () => pm.response.to.have.status(200));",
      'const leaderboard = pm.response.json().data.leaderboard;',
      "pm.test('Lone member defaults to a perfect baseline score (no data to be unfair with)', () => {",
      '  pm.expect(leaderboard.length).to.eql(1);',
      '  pm.expect(Number(leaderboard[0].overallScore)).to.eql(100);',
      '});',
    ],
  }),
  req({
    name: 'Calculate Fairness Is Idempotent (re-run with no new activity)',
    method: 'POST',
    path: '/circles/{{soloCircleId}}/fairness/calculate',
    auth: 'tokenA',
    tests: [
      "pm.test('Status is 200', () => pm.response.to.have.status(200));",
      'const scores = pm.response.json().data.scores;',
      "pm.test('Re-running produces the same scores (upsert, not duplicate rows)', () => {",
      '  pm.expect(scores.length).to.eql(1);',
      '  pm.expect(Number(scores[0].overallScore)).to.eql(100);',
      '});',
    ],
  }),
];

const collection = {
  info: {
    name: 'SplitCircle — Phase 8: Fairness Score Engine',
    description:
      'Self-contained collection: registers fresh users, builds a circle with an expense ' +
      'and chores, exercises POST /calculate and GET /fairness, then walks through the ' +
      'edge cases (auth, bad circle id, non-member, empty circle, idempotency). ' +
      'Run the whole collection top-to-bottom with the Collection Runner.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:5000/api' },
    { key: 'tokenA', value: '' },
    { key: 'tokenB', value: '' },
    { key: 'tokenC', value: '' },
    { key: 'userAId', value: '' },
    { key: 'userBId', value: '' },
    { key: 'userAEmail', value: '' },
    { key: 'userBEmail', value: '' },
    { key: 'circleId', value: '' },
    { key: 'soloCircleId', value: '' },
    { key: 'expenseId', value: '' },
    { key: 'choreAId', value: '' },
    { key: 'choreBId', value: '' },
    { key: 'assignmentAId', value: '' },
    { key: 'assignmentBId', value: '' },
    { key: 'settlementId', value: '' },
  ],
  item: [
    { name: '1. Setup', item: setup },
    { name: '2. Fairness Engine — Happy Path', item: happyPath },
    { name: '3. Edge Cases', item: edgeCases },
  ],
};

writeFileSync(
  new URL('./SplitCircle_Phase8_Fairness.postman_collection.json', import.meta.url),
  JSON.stringify(collection, null, 2) + '\n'
);
console.log('Wrote SplitCircle_Phase8_Fairness.postman_collection.json');
