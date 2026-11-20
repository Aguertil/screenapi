import { Result, success, failure, DomainError } from '@/lib/types';
import { ScreenshotOptions } from '../domain/ScreenshotOptions';
import { Screenshot, ScreenshotId } from '../domain/Screenshot';
import { UrlValidator } from '../domain/UrlValidator';
import type { IScreenshotService, ScreenshotResult } from './interfaces/IScreenshotService';
import type { IApiKeyRepository } from './interfaces/IApiKeyRepository';
import type { ISubscriptionRepository, InsufficientCreditsError } from './interfaces/ISubscriptionRepository';
import type { IRateLimiter, RateLimitExceededError } from './interfaces/IRateLimiter';
import type { IUsageLogger } from './interfaces/IUsageLogger';
import type { IScreenshotRepository } from './interfaces/IScreenshotRepository';
import { screenshotCache } from '../infrastructure/ScreenshotCache';
import { getPlan } from '@/lib/plans';

export interface CaptureScreenshotRequest {
  apiKey: string;
  url: string;
  format?: 'PNG' | 'JPEG' | 'WEBP' | 'PDF';
  quality?: number;
  viewportType?: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'CUSTOM';
  viewportWidth?: number;
  viewportHeight?: number;
  fullPage?: boolean;
  waitForSelector?: string;
  waitForTimeout?: number;
  hideElements?: string[];
  blockCookies?: boolean;
  blockAds?: boolean;
  userAgent?: string;
  darkMode?: boolean;
  deviceScaleFactor?: number;
  selector?: string;
  delay?: number;
  /** Durée de mise en cache en secondes (0 = pas de cache) */
  cacheTtl?: number;
  ipAddress?: string;
  userAgentHeader?: string;
}

export class InvalidApiKeyError extends DomainError {
  constructor() {
    super('Invalid or expired API key', 'INVALID_API_KEY');
  }
}

export class NoActiveSubscriptionError extends DomainError {
  constructor() {
    super('No active subscription found', 'NO_ACTIVE_SUBSCRIPTION');
  }
}

export type CaptureScreenshotError =
  | InvalidApiKeyError
  | RateLimitExceededError
  | InsufficientCreditsError
  | NoActiveSubscriptionError
  | DomainError;

export class CaptureScreenshotUseCase {
  constructor(
    private screenshotService: IScreenshotService,
    private apiKeyRepository: IApiKeyRepository,
    private subscriptionRepository: ISubscriptionRepository,
    private screenshotRepository: IScreenshotRepository,
    private rateLimiter: IRateLimiter,
    private usageLogger: IUsageLogger,
  ) {}

  async execute(
    request: CaptureScreenshotRequest,
  ): Promise<Result<ScreenshotResult, CaptureScreenshotError>> {
    const startTime = Date.now();

    // 1. Validate and find API key
    const apiKeyData = await this.apiKeyRepository.findByKey(request.apiKey);
    if (!apiKeyData || !apiKeyData.isActive) {
      return failure(new InvalidApiKeyError());
    }

    // Check expiration
    if (apiKeyData.expiresAt && apiKeyData.expiresAt < new Date()) {
      return failure(new InvalidApiKeyError());
    }

    const userId = apiKeyData.userId;
    const apiKeyId = apiKeyData.id;

    // 3. Check subscription and credits
    const subscription = await this.subscriptionRepository.findByUserId(userId);
    if (!subscription || (subscription.status !== 'ACTIVE' && subscription.status !== 'PAST_DUE')) {
      return failure(new NoActiveSubscriptionError());
    }

    // 3b. Limite de débit du plan (par clé)
    const rateLimitResult = await this.rateLimiter.check(
      apiKeyId,
      getPlan(subscription.plan).ratePerMinute,
      60,
    );

    if (!rateLimitResult.allowed) {
      // Log rate limit hit
      await this.usageLogger.logRateLimit({
        userId,
        apiKeyId,
        limit: rateLimitResult.limit,
        ipAddress: request.ipAddress,
        userAgent: request.userAgentHeader,
      });

      const retryAfter = rateLimitResult.retryAfter || 60;
      return failure(
        {
          name: 'RateLimitExceededError',
          message: `Rate limit exceeded`,
          code: 'RATE_LIMIT_EXCEEDED',
          limit: rateLimitResult.limit,
          resetAt: rateLimitResult.resetAt,
          retryAfter,
        } as RateLimitExceededError,
      );
    }


    if (subscription.creditsRemaining < 1) {
      return failure(
        {
          name: 'InsufficientCreditsError',
          message: 'Insufficient credits',
          code: 'INSUFFICIENT_CREDITS',
          creditsRemaining: subscription.creditsRemaining,
          creditsRequired: 1,
        } as InsufficientCreditsError,
      );
    }

    // 4. Validate URL (anti-SSRF)
    const urlValidation = UrlValidator.validate(request.url);
    if (!urlValidation.success) {
      // Log validation failure
      await this.usageLogger.logFailure({
        userId,
        apiKeyId,
        url: request.url,
        errorMessage: urlValidation.error.message,
        errorCode: 'INVALID_URL',
        durationMs: Date.now() - startTime,
        ipAddress: request.ipAddress,
        userAgent: request.userAgentHeader,
      });

      return failure(urlValidation.error);
    }

    // 5. Create screenshot options
    const optionsResult = ScreenshotOptions.create({
      url: request.url,
      format: request.format,
      quality: request.quality,
      viewportType: request.viewportType,
      viewportWidth: request.viewportWidth,
      viewportHeight: request.viewportHeight,
      fullPage: request.fullPage,
      waitForSelector: request.waitForSelector,
      waitForTimeout: request.waitForTimeout,
      hideElements: request.hideElements,
      blockCookies: request.blockCookies,
      blockAds: request.blockAds,
      userAgent: request.userAgent,
      darkMode: request.darkMode,
      deviceScaleFactor: request.deviceScaleFactor,
      selector: request.selector,
      delay: request.delay,
    });

    if (!optionsResult.success) {
      // Log validation failure
      await this.usageLogger.logFailure({
        userId,
        apiKeyId,
        url: request.url,
        errorMessage: optionsResult.error.message,
        errorCode: 'INVALID_OPTIONS',
        durationMs: Date.now() - startTime,
        ipAddress: request.ipAddress,
        userAgent: request.userAgentHeader,
      });

      return failure(optionsResult.error);
    }

    const options = optionsResult.value;
    const cacheTtl = Math.min(Math.max(Math.floor(request.cacheTtl ?? 0), 0), 30 * 24 * 3600);

    // 5b. Cache : gratuit et immédiat si la même capture a déjà été faite
    if (cacheTtl > 0) {
      const hit = screenshotCache.get(userId, options.cacheKey());
      if (hit) {
        await this.rateLimiter.increment(apiKeyId, 60);
        return success({ ...hit, cached: true, durationMs: Date.now() - startTime, creditsRemaining: subscription.creditsRemaining });
      }
    }

    // 6. Capture screenshot
    const captureResult = await this.screenshotService.capture(options);

    if (!captureResult.success) {
      // Log capture failure
      await this.usageLogger.logFailure({
        userId,
        apiKeyId,
        url: request.url,
        errorMessage: captureResult.error.message,
        errorCode: captureResult.error.code,
        durationMs: Date.now() - startTime,
        ipAddress: request.ipAddress,
        userAgent: request.userAgentHeader,
      });

      return failure(
        new DomainError(captureResult.error.message, captureResult.error.code),
      );
    }

    const screenshotResult = captureResult.value;

    // 7. Deduct credits (atomique : refuse si un autre appel a pris le dernier crédit)
    try {
      await this.subscriptionRepository.deductCredits(subscription.id, 1);
    } catch (error) {
      if (error && typeof error === 'object' && 'creditsRemaining' in error) {
        return failure({ ...(error as InsufficientCreditsError), code: 'INSUFFICIENT_CREDITS' } as InsufficientCreditsError);
      }
      console.error('Failed to deduct credits:', error);
    }
    if (cacheTtl > 0) screenshotCache.set(userId, options.cacheKey(), screenshotResult, cacheTtl);

    // 8. Save screenshot metadata (optional, for history)
    const screenshot = Screenshot.create({
      id: crypto.randomUUID() as ScreenshotId,
      url: request.url,
      format: options.format,
      dimensions: {
        width: screenshotResult.width,
        height: screenshotResult.height,
      },
      viewportType: options.viewportType,
      metadata: {
        url: request.url,
        fileSizeBytes: screenshotResult.fileSizeBytes,
        durationMs: screenshotResult.durationMs,
        capturedAt: new Date(),
      },
    });

    if (screenshot.success) {
      try {
        await this.screenshotRepository.save(screenshot.value);
      } catch (error) {
        // Log but don't fail
        console.error('Failed to save screenshot metadata:', error);
      }
    }

    // 9. Log successful usage
    await this.usageLogger.logSuccess({
      userId,
      apiKeyId,
      url: request.url,
      format: options.format,
      viewportType: options.viewportType,
      viewportWidth: options.viewport.width,
      viewportHeight: options.viewport.height,
      fullPage: options.fullPage,
      durationMs: Date.now() - startTime,
      fileSizeBytes: screenshotResult.fileSizeBytes,
      creditsUsed: 1,
      ipAddress: request.ipAddress,
      userAgent: request.userAgentHeader,
    });

    // 10. Update API key last used
    try {
      await this.apiKeyRepository.updateLastUsed(apiKeyId);
    } catch (error) {
      // Log but don't fail
      console.error('Failed to update API key last used:', error);
    }

    // 11. Increment rate limit counter
    await this.rateLimiter.increment(apiKeyId, 60);

    return success({ ...screenshotResult, cached: false, creditsRemaining: Math.max(0, subscription.creditsRemaining - 1) });
  }
}
