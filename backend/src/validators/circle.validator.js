import { AppError } from '../utils/AppError.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`${fieldName} is required`, 400);
  }
  return value.trim();
}

export function validateCreateCircleInput(body) {
  const name = requireString(body.name, 'Name');
  if (name.length < 3) {
    throw new AppError('Name must be at least 3 characters', 400);
  }

  const description =
    body.description === undefined || body.description === null
      ? null
      : typeof body.description === 'string'
        ? body.description.trim() || null
        : (() => {
            throw new AppError('Description must be a string', 400);
          })();

  return { name, description };
}

export function validateAddMemberInput(body) {
  const email = requireString(body.email, 'Email').toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new AppError('A valid email is required', 400);
  }
  return { email };
}

export function validateCircleIdParam(params) {
  const circleId = requireString(params.circleId, 'Circle ID');
  if (!UUID_REGEX.test(circleId)) {
    throw new AppError('Invalid circle ID', 400);
  }
  return circleId;
}
