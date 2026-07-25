import { AppError } from '../utils/AppError.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`${fieldName} is required`, 400);
  }
  return value.trim();
}

function requireEmail(value) {
  const email = requireString(value, 'Email').toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new AppError('A valid email is required', 400);
  }
  return email;
}

function requirePassword(value, { minLength = 8 } = {}) {
  const password = requireString(value, 'Password');
  if (password.length < minLength) {
    throw new AppError(`Password must be at least ${minLength} characters`, 400);
  }
  return password;
}

export function validateRegisterInput(body) {
  const name = requireString(body.name, 'Name');
  const email = requireEmail(body.email);
  const password = requirePassword(body.password);
  return { name, email, password };
}

export function validateLoginInput(body) {
  const email = requireEmail(body.email);
  const password = requireString(body.password, 'Password');
  return { email, password };
}
