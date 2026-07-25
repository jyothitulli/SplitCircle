import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env.js';
import { AppError } from '../utils/AppError.js';

let _genAI = null;

export function getGeminiClient() {
  if (!env.GEMINI_API_KEY) {
    throw new AppError('GEMINI_API_KEY is not configured on this server.', 503);
  }
  if (!_genAI) {
    _genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return _genAI;
}

/** Returns a GenerativeModel configured for structured JSON output */
export function getGeminiModel() {
  const client = getGeminiClient();
  return client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.2,      // Low temp = more deterministic / structured
      maxOutputTokens: 512,
      responseMimeType: 'application/json',
    },
  });
}
