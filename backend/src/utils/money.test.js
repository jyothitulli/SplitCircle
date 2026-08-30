import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeEqualShares,
  computePercentageShares,
  computeCustomShares,
  assertShareTotalMatchesAmount,
} from './money.js';

test('computeEqualShares splits evenly when amount divides cleanly', () => {
  const shares = computeEqualShares('90.00', ['u1', 'u2', 'u3']);

  assert.equal(shares.length, 3);
  for (const share of shares) {
    assert.equal(share.shareAmount, '30.00');
    assert.equal(share.sharePercentage, null);
  }
  assertShareTotalMatchesAmount(shares, '90.00');
});

test('computeEqualShares distributes remainder cents to the first participants', () => {
  // 10.00 / 3 = 3.33333... — remainder cents must go somewhere, and the
  // total must still add back up to exactly 10.00.
  const shares = computeEqualShares('10.00', ['u1', 'u2', 'u3']);

  const amounts = shares.map((s) => s.shareAmount);
  assert.deepEqual(amounts, ['3.34', '3.33', '3.33']);
  assertShareTotalMatchesAmount(shares, '10.00');
});

test('computeEqualShares throws when there are no participants', () => {
  assert.throws(() => computeEqualShares('10.00', []), /At least one participant/);
});

test('computePercentageShares splits by percentage and rounds without losing cents', () => {
  const shares = computePercentageShares('100.00', [
    { userId: 'u1', sharePercentage: 33.33 },
    { userId: 'u2', sharePercentage: 33.33 },
    { userId: 'u3', sharePercentage: 33.34 },
  ]);

  assertShareTotalMatchesAmount(shares, '100.00');
  assert.equal(
    shares.reduce((sum, s) => sum + Number(s.shareAmount), 0).toFixed(2),
    '100.00'
  );
});

test('computePercentageShares rejects percentages that do not sum to 100', () => {
  assert.throws(
    () =>
      computePercentageShares('100.00', [
        { userId: 'u1', sharePercentage: 40 },
        { userId: 'u2', sharePercentage: 40 },
      ]),
    /must sum to 100/
  );
});

test('computeCustomShares accepts exact custom amounts that sum to the total', () => {
  const shares = computeCustomShares('50.00', [
    { userId: 'u1', shareAmount: '20.00' },
    { userId: 'u2', shareAmount: '30.00' },
  ]);

  assert.equal(shares[0].shareAmount, '20.00');
  assert.equal(shares[1].shareAmount, '30.00');
  assertShareTotalMatchesAmount(shares, '50.00');
});

test('computeCustomShares rejects custom amounts that do not sum to the total', () => {
  assert.throws(
    () =>
      computeCustomShares('50.00', [
        { userId: 'u1', shareAmount: '20.00' },
        { userId: 'u2', shareAmount: '20.00' },
      ]),
    /must sum to the expense total/
  );
});
