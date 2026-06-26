import { AppError } from './AppError.js';

export function toCents(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value < 0) {
    throw new AppError('Invalid monetary amount', 400);
  }
  return Math.round(value * 100);
}

export function fromCents(cents) {
  return (cents / 100).toFixed(2);
}

function distributeEqualCents(totalCents, count) {
  const base = Math.floor(totalCents / count);
  const remainder = totalCents % count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

export function computeEqualShares(amount, participantUserIds) {
  if (participantUserIds.length === 0) {
    throw new AppError('At least one participant is required', 400);
  }

  const shareCents = distributeEqualCents(toCents(amount), participantUserIds.length);

  return participantUserIds.map((userId, index) => ({
    userId,
    shareAmount: fromCents(shareCents[index]),
    sharePercentage: null,
  }));
}

export function computePercentageShares(amount, participants) {
  if (participants.length === 0) {
    throw new AppError('At least one participant is required', 400);
  }

  const totalPercentage = participants.reduce(
    (sum, participant) => sum + Number(participant.sharePercentage),
    0
  );

  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new AppError('Participant percentages must sum to 100', 400);
  }

  const totalCents = toCents(amount);
  const allocations = participants.map((participant) => {
    const rawCents = (totalCents * Number(participant.sharePercentage)) / 100;
    return {
      userId: participant.userId,
      sharePercentage: Number(participant.sharePercentage),
      cents: Math.floor(rawCents),
      fraction: rawCents - Math.floor(rawCents),
    };
  });

  let remainder = totalCents - allocations.reduce((sum, row) => sum + row.cents, 0);
  const sortedByFraction = [...allocations].sort((a, b) => b.fraction - a.fraction);

  for (const row of sortedByFraction) {
    if (remainder <= 0) break;
    row.cents += 1;
    remainder -= 1;
  }

  return allocations.map((row) => ({
    userId: row.userId,
    shareAmount: fromCents(row.cents),
    sharePercentage: row.sharePercentage,
  }));
}

export function computeCustomShares(amount, participants) {
  if (participants.length === 0) {
    throw new AppError('At least one participant is required', 400);
  }

  const totalCents = toCents(amount);
  const participantCents = participants.map((participant) => ({
    userId: participant.userId,
    cents: toCents(participant.shareAmount),
  }));

  const sumCents = participantCents.reduce((sum, row) => sum + row.cents, 0);
  if (sumCents !== totalCents) {
    throw new AppError('Participant share amounts must sum to the expense total', 400);
  }

  return participantCents.map((row) => ({
    userId: row.userId,
    shareAmount: fromCents(row.cents),
    sharePercentage: null,
  }));
}

export function assertShareTotalMatchesAmount(shares, amount) {
  const totalCents = shares.reduce((sum, share) => sum + toCents(share.shareAmount), 0);
  if (totalCents !== toCents(amount)) {
    throw new AppError('Computed participant shares do not match expense total', 500);
  }
}
