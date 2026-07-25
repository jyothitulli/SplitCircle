import multer from 'multer';
import { AppError } from '../utils/AppError.js';

// Allowed MIME types for receipts
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Use memory storage so we can pipe to Cloudinary directly
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Unsupported file type "${file.mimetype}". Only JPEG, PNG, WEBP, and GIF are allowed.`,
        400
      ),
      false
    );
  }
}

export const receiptUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('receipt'); // field name must be "receipt"

/** Express middleware that wraps multer and converts multer errors → AppError */
export function handleReceiptUpload(req, res, next) {
  receiptUpload(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('Receipt image must be smaller than 5 MB.', 400));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError('Unexpected field. Use "receipt" as the form field name.', 400));
    }
    if (err instanceof AppError) return next(err);
    return next(new AppError(err.message || 'File upload failed.', 400));
  });
}
