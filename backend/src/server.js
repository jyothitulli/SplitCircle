import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info(`SplitCircle backend running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
});

// Receipt OCR (upload + Cloudinary round-trip + Tesseract recognition) can
// legitimately take longer than Node's default per-request timeout. Give
// requests enough room to finish (the OCR service itself enforces its own
// 45s internal timeout, so this is just a generous outer safety margin).
server.requestTimeout = 120_000;
server.headersTimeout = 125_000;

// Belt-and-braces: if anything in a third-party dependency (e.g. a native
// module or worker thread) still manages to throw asynchronously outside of
// an Express request handler, log it and keep the process alive instead of
// letting the whole server go down and produce a platform-level 502 for
// unrelated requests (auth, circles, etc). Express's own route/middleware
// errors are already handled by errorHandler.js and never reach here.
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception (process kept alive)', { error: error?.stack || error });
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection (process kept alive)', { reason });
});
