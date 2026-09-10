import cron from 'node-cron';
import { prisma } from '../db/client';
import { logger } from '../middleware/logging.middleware';

/**
 * Initializes the lightweight background job poller (per SRS §2.2 / recruitment-platform-dev)
 * Runs purely in-process via node-cron without Redis/BullMQ.
 */
export function initBackgroundJobs() {
  logger.info('Initializing background job scheduler...');

  // Poll for pending background jobs every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const pendingJobs = await prisma.backgroundJob.findMany({
        where: {
          status: 'PENDING',
          scheduledAt: { lte: new Date() },
        },
        take: 5,
        orderBy: { scheduledAt: 'asc' },
      });

      if (pendingJobs.length > 0) {
        logger.info(`Found ${pendingJobs.length} pending background jobs to process`);
      }

      for (const job of pendingJobs) {
        await prisma.backgroundJob.update({
          where: { id: job.id },
          data: { status: 'PROCESSING', startedAt: new Date() },
        });

        try {
          // Process job based on jobType
          logger.info(`Processing background job ${job.id} of type ${job.jobType}`);

          await prisma.backgroundJob.update({
            where: { id: job.id },
            data: { status: 'COMPLETED', completedAt: new Date() },
          });
        } catch (jobErr) {
          logger.error(`Failed executing background job ${job.id}:`, jobErr);
          const nextAttempts = job.attempts + 1;
          await prisma.backgroundJob.update({
            where: { id: job.id },
            data: {
              attempts: nextAttempts,
              status: nextAttempts >= job.maxAttempts ? 'FAILED' : 'PENDING',
              errorMessage: (jobErr as Error).message,
            },
          });
        }
      }
    } catch (err) {
      logger.error('Error polling background jobs:', err);
    }
  });

  logger.info('Background job poller scheduled.');
}
