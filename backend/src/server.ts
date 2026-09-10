import { app } from './app';
import { config } from './config';
import { logger } from './middleware/logging.middleware';
import { prisma } from './db/client';
import { initBackgroundJobs } from './jobs';

const server = app.listen(config.PORT, () => {
  logger.info(`🚀 Recruitment & ATS API Server running on port ${config.PORT} [${config.NODE_ENV}]`);
  logger.info(`👉 Health check: http://localhost:${config.PORT}/api/health`);

  // Start background job poller (only in production or non-test dev)
  if (config.NODE_ENV !== 'test') {
    initBackgroundJobs();
  }
});

// Graceful Shutdown
const handleShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Database connection closed.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forceful shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default server;
