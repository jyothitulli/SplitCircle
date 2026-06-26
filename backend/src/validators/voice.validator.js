import { AppError } from '../utils/AppError.js';

/**
 * Validates the request body for POST /api/voice/expense
 */
export function validateVoiceExpenseBody(req, res, next) {
  const { transcript } = req.body;

  if (transcript === undefined || transcript === null) {
    return next(new AppError('"transcript" field is required.', 400));
  }

  if (typeof transcript !== 'string') {
    return next(new AppError('"transcript" must be a string.', 400));
  }

  const trimmed = transcript.trim();

  if (trimmed.length === 0) {
    return next(new AppError('"transcript" must not be blank.', 400));
  }

  if (trimmed.length > 1000) {
    return next(new AppError('"transcript" must be 1000 characters or fewer.', 400));
  }

  // Sanitise — attach trimmed version
  req.body.transcript = trimmed;
  next();
}
