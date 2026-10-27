// Infrastructure implementations
export { PlaywrightScreenshotService } from './PlaywrightScreenshotService';
export { RedisRateLimiter } from './RedisRateLimiter';
export { PrismaApiKeyRepository } from './PrismaApiKeyRepository';
export { PrismaSubscriptionRepository } from './PrismaSubscriptionRepository';
export { PrismaScreenshotRepository } from './PrismaScreenshotRepository';
export { PrismaUsageLogger } from './PrismaUsageLogger';

// Factory function for easy setup
import { PlaywrightScreenshotService } from './PlaywrightScreenshotService';
import { RedisRateLimiter } from './RedisRateLimiter';
import { PrismaApiKeyRepository } from './PrismaApiKeyRepository';
import { PrismaSubscriptionRepository } from './PrismaSubscriptionRepository';
import { PrismaScreenshotRepository } from './PrismaScreenshotRepository';
import { PrismaUsageLogger } from './PrismaUsageLogger';
import { CaptureScreenshotUseCase } from '../application/CaptureScreenshotUseCase';

/**
 * Create a fully configured CaptureScreenshotUseCase with production dependencies
 */
export function createCaptureScreenshotUseCase(redisUrl?: string): CaptureScreenshotUseCase {
  const screenshotService = new PlaywrightScreenshotService();
  const apiKeyRepository = new PrismaApiKeyRepository();
  const subscriptionRepository = new PrismaSubscriptionRepository();
  const screenshotRepository = new PrismaScreenshotRepository();
  const rateLimiter = new RedisRateLimiter(redisUrl);
  const usageLogger = new PrismaUsageLogger();

  return new CaptureScreenshotUseCase(
    screenshotService,
    apiKeyRepository,
    subscriptionRepository,
    screenshotRepository,
    rateLimiter,
    usageLogger,
  );
}
