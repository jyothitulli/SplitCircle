import { verifyToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';

/**
 * Verifies the Bearer JWT and attaches decoded payload to req.user.
 * Use on any route that requires authentication.
 */
export function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return next(new AppError('Authentication required', 401));
  }

  const decoded = verifyToken(token);
  req.user = { id: decoded.userId };
  next();
}
