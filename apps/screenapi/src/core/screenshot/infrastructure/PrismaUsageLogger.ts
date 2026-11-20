import { prisma } from '@/lib/prisma';
import type {
  IUsageLogger,
  SuccessLogData,
  FailureLogData,
  RateLimitLogData,
} from '../application/interfaces/IUsageLogger';

const RETENTION_DAYS = 90;
let lastPurge = 0;

/** Supprime une fois par heure au plus les journaux de plus de 90 jours (politique de confidentialité). */
function purgeOldLogs() {
  if (Date.now() - lastPurge < 3600_000) return;
  lastPurge = Date.now();
  const before = new Date(Date.now() - RETENTION_DAYS * 86400_000);
  Promise.all([
    prisma.screenshotUsageLog.deleteMany({ where: { createdAt: { lt: before } } }),
    prisma.screenshot.deleteMany({ where: { createdAt: { lt: before } } }),
  ]).catch((e) => console.error('Log purge failed:', e));
}

export class PrismaUsageLogger implements IUsageLogger {
  async logSuccess(data: SuccessLogData): Promise<void> {
    purgeOldLogs();
    try {
      await prisma.screenshotUsageLog.create({
        data: {
          userId: data.userId,
          apiKeyId: data.apiKeyId,
          url: data.url,
          status: 'SUCCESS',
          format: data.format,
          viewportType: data.viewportType,
          viewportWidth: data.viewportWidth,
          viewportHeight: data.viewportHeight,
          fullPage: data.fullPage,
          durationMs: data.durationMs,
          fileSizeBytes: data.fileSizeBytes,
          creditsUsed: data.creditsUsed,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      console.error('Error logging success:', error);
      // Don't throw - logging failure shouldn't break the main flow
    }
  }

  async logFailure(data: FailureLogData): Promise<void> {
    try {
      await prisma.screenshotUsageLog.create({
        data: {
          userId: data.userId,
          apiKeyId: data.apiKeyId,
          url: data.url,
          status: 'FAILED',
          durationMs: data.durationMs,
          creditsUsed: 0,
          errorMessage: data.errorMessage,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      console.error('Error logging failure:', error);
      // Don't throw
    }
  }

  async logRateLimit(data: RateLimitLogData): Promise<void> {
    try {
      await prisma.screenshotUsageLog.create({
        data: {
          userId: data.userId,
          apiKeyId: data.apiKeyId,
          url: 'rate-limited',
          status: 'RATE_LIMITED',
          creditsUsed: 0,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      console.error('Error logging rate limit:', error);
      // Don't throw
    }
  }
}
