import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { httpLogger } from './middleware/logging.middleware';
import { apiRateLimiter } from './middleware/rate-limit.middleware';
import { errorHandler, NotFoundError } from './middleware/error.middleware';

// Import domain module routers
import authRouter from './modules/auth/auth.routes';
import atsScoringRouter from './modules/ats-scoring/ats-scoring.routes';
import applicantProfileRouter from './modules/applicant-profile/applicant-profile.routes';
import jobVacancyRouter from './modules/job-vacancy/job-vacancy.routes';
import applicationPipelineRouter from './modules/application-pipeline/application-pipeline.routes';
import notificationsRouter from './modules/notifications/notifications.routes';
import adminRouter from './modules/admin/admin.routes';
import moderationRouter from './modules/moderation/moderation.routes';

export const createApp = (): Express => {
  const app = express();

  // Security Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
    })
  );

  // Request Parsing & Logging
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(httpLogger);

  // Rate Limiting
  app.use('/api', apiRateLimiter);

  // Health Check Endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      data: {
        status: 'ok',
        service: 'recruitment-ats-api',
        environment: config.NODE_ENV,
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
      },
      error: null,
    });
  });

  // Mount API Domain Routes (v1)
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/ats-scoring', atsScoringRouter);
  app.use('/api/v1/applicant-profiles', applicantProfileRouter);
  app.use('/api/v1/job-vacancies', jobVacancyRouter);
  app.use('/api/v1/application-pipelines', applicationPipelineRouter);
  app.use('/api/v1/notifications', notificationsRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/admin/moderation', moderationRouter);

  // 404 Handler
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
};

export const app = createApp();
export default app;
