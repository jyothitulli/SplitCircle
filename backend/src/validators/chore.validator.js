import { AppError } from '../utils/AppError.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const RECURRENCE_INTERVALS = ['DAILY', 'WEEKLY', 'MONTHLY'];

function requireString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`${fieldName} is required`, 400);
  }
  return value.trim();
}

function optionalUUID(value, fieldName) {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  if (str.length === 0) return null;
  if (!UUID_REGEX.test(str)) {
    throw new AppError(`Invalid UUID for ${fieldName}`, 400);
  }
  return str;
}

function optionalDate(value, fieldName) {
  if (value === undefined || value === null) return null;
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    throw new AppError(`Invalid date for ${fieldName}`, 400);
  }
  return parsed;
}

export function validateCreateChoreInput(body) {
  const title = requireString(body.title, 'Title');
  if (title.length < 3) {
    throw new AppError('Title must be at least 3 characters', 400);
  }

  const description =
    body.description === undefined || body.description === null
      ? null
      : typeof body.description === 'string'
        ? body.description.trim() || null
        : (() => {
            throw new AppError('Description must be a string', 400);
          })();

  const isRecurring = body.isRecurring === true;
  let recurrenceInterval = null;

  if (isRecurring) {
    recurrenceInterval = requireString(body.recurrenceInterval, 'Recurrence interval').toUpperCase();
    if (!RECURRENCE_INTERVALS.includes(recurrenceInterval)) {
      throw new AppError('Recurrence interval must be one of: DAILY, WEEKLY, MONTHLY', 400);
    }
  }

  const assignedUserId = optionalUUID(body.assignedUserId, 'Assigned User ID');
  const dueDate = optionalDate(body.dueDate, 'Due Date');

  if (assignedUserId && !dueDate) {
    throw new AppError('Due Date is required when assigning a chore', 400);
  }

  return {
    title,
    description,
    isRecurring,
    recurrenceInterval,
    assignedUserId,
    dueDate,
  };
}

export function validateAssignChoreInput(body) {
  const userId = requireString(body.userId, 'User ID');
  if (!UUID_REGEX.test(userId)) {
    throw new AppError('Invalid User ID', 400);
  }

  const dueDateStr = requireString(body.dueDate, 'Due Date');
  const dueDate = new Date(dueDateStr);
  if (isNaN(dueDate.getTime())) {
    throw new AppError('Invalid Due Date', 400);
  }

  return { userId, dueDate };
}

export function validateChoreIdParam(params) {
  const choreId = requireString(params.choreId, 'Chore ID');
  if (!UUID_REGEX.test(choreId)) {
    throw new AppError('Invalid Chore ID', 400);
  }
  return choreId;
}

export function validateAssignmentIdParam(params) {
  const id = requireString(params.id, 'Assignment ID');
  if (!UUID_REGEX.test(id)) {
    throw new AppError('Invalid Assignment ID', 400);
  }
  return id;
}
