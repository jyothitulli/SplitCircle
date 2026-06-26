import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import circleRoutes from './routes/circle.routes.js';
import settlementRoutes from './routes/settlement.routes.js';
import { choreAssignmentRouter } from './routes/chore.routes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

// Phase 9 routes
import ocrRoutes from './routes/ocr.routes.js';
import voiceRoutes from './routes/voice.routes.js';
import circlePhase9Routes from './routes/circle.phase9.routes.js';

const app = express();

// Security headers
app.use(helmet());

// CORS - restricted to the configured frontend origin
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (skip during tests)
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Routes
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SplitCircle API is running — Phase 9',
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/circles', circleRoutes);
app.use('/api/circles', circlePhase9Routes);   // Phase 9C + 9D (insights, conflicts)
app.use('/api/settlements', settlementRoutes);
app.use('/api/chores/assignments', choreAssignmentRouter);
app.use('/api/ocr', ocrRoutes);                // Phase 9A (OCR receipt scanning)
app.use('/api/voice', voiceRoutes);            // Phase 9B (voice expense logging)

// 404 + error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
