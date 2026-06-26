import { AppError } from '../utils/AppError.js';
import { validateCircleIdParam } from './circle.validator.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SPLIT_METHODS = ['EQUAL', 'PERCENTAGE', 'CUSTOM'];

function requireString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`${fieldName} is required`, 400);
  }
  return value.trim();
}

function requireUuid(value, fieldName) {
  const id = requireString(value, fieldName);
  if (!UUID_REGEX.test(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
  return id;
}

function requirePositiveAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('Amount must be a positive number', 400);
  }
  return amount;
}

function parseParticipants(rawParticipants, splitMethod) {
  if (!Array.isArray(rawParticipants) || rawParticipants.length === 0) {
    throw new AppError('At least one participant is required', 400);
  }

  const seenUserIds = new Set();

  return rawParticipants.map((participant, index) => {
    if (!participant || typeof participant !== 'object') {
      throw new AppError(`Participant at index ${index} is invalid`, 400);
    }

    const userId = requireUuid(participant.userId, 'participant userId');

    if (seenUserIds.has(userId)) {
      throw new AppError('Duplicate participant userId in split', 400);
    }
    seenUserIds.add(userId);

    if (splitMethod === 'EQUAL') {
      return { userId };
    }

    if (splitMethod === 'PERCENTAGE') {
      const sharePercentage = Number(participant.sharePercentage);
      if (!Number.isFinite(sharePercentage) || sharePercentage <= 0) {
        throw new AppError(
          `sharePercentage is required for participant at index ${index}`,
          400
        );
      }
      return { userId, sharePercentage };
    }

    const shareAmount = Number(participant.shareAmount);
    if (!Number.isFinite(shareAmount) || shareAmount <= 0) {
      throw new AppError(`shareAmount is required for participant at index ${index}`, 400);
    }
    return { userId, shareAmount };
  });
}

function parseExpenseDate(value) {
  if (value === undefined || value === null) {
    return new Date();
  }

  const expenseDate = new Date(value);
  if (Number.isNaN(expenseDate.getTime())) {
    throw new AppError('expenseDate must be a valid date', 400);
  }

  return expenseDate;
}

export function validateCreateExpenseInput(body) {
  const description = requireString(body.description, 'Description');
  const amount = requirePositiveAmount(body.amount);

  const splitMethod = requireString(body.splitMethod, 'splitMethod').toUpperCase();
  if (!SPLIT_METHODS.includes(splitMethod)) {
    throw new AppError('splitMethod must be EQUAL, PERCENTAGE, or CUSTOM', 400);
  }

  const paidById =
    body.paidById === undefined || body.paidById === null
      ? null
      : requireUuid(body.paidById, 'paidById');

  const participants = parseParticipants(body.participants, splitMethod);
  const expenseDate = parseExpenseDate(body.expenseDate);

  return {
    description,
    amount,
    splitMethod,
    paidById,
    participants,
    expenseDate,
  };
}

export function validateExpenseIdParam(params) {
  return requireUuid(params.expenseId, 'Expense ID');
}

export function validateCircleIdFromParams(params) {
  return validateCircleIdParam(params);
}
