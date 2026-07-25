import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { AppError } from './AppError.js';

function getSecret() {
  if (!env.JWT_SECRET) {
    throw new AppError('JWT_SECRET is not configured', 500);
  }
  return env.JWT_SECRET;
}

export function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: env.JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
}
