const timestamp = () => new Date().toISOString();

// Minimal logger for now. Phase 20 (Production Readiness) will replace
// this with a structured logger (e.g. pino/winston) and log levels
// driven by NODE_ENV.
export const logger = {
  info: (...args) => console.log(`[INFO] ${timestamp()} -`, ...args),
  warn: (...args) => console.warn(`[WARN] ${timestamp()} -`, ...args),
  error: (...args) => console.error(`[ERROR] ${timestamp()} -`, ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${timestamp()} -`, ...args);
    }
  },
};

// Default export kept in sync with the named export so that both
// `import { logger } from '...'` and `import logger from '...'` resolve
// to the same object (several Phase 9 modules import the default).
export default logger;
