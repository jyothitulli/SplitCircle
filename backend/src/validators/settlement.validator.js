import { AppError } from '../utils/AppError.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`${fieldName} is required`, 400);
  }
  return value.trim();
}

export function validateSettlementIdParam(params) {
  const id = requireString(params.id, 'Settlement ID');
  if (!UUID_REGEX.test(id)) {
    throw new AppError('Invalid Settlement ID', 400);
  }
  return id;
}
