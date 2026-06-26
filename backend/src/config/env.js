import dotenv from 'dotenv';

dotenv.config();

const requiredInProduction = ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN'];

if (process.env.NODE_ENV === 'production') {
  for (const key of requiredInProduction) {
    if (!process.env[key]) {
      throw new Error(`[config] Missing required environment variable in production: ${key}`);
    }
  }
}

export const env = {
  // NOTE: defaults to 4000 to match frontend/vite.config.js's dev proxy
  // target and frontend/.env's VITE_API_URL default. If you change this,
  // update those two as well (or set PORT explicitly in backend/.env).
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Phase 9A — Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  // Phase 9B + 9C — Gemini
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};
