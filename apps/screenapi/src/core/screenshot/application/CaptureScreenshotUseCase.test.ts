import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CaptureScreenshotUseCase, InvalidApiKeyError, NoActiveSubscriptionError } from './CaptureScreenshotUseCase';
import type { IScreenshotService } from './interfaces/IScreenshotService';
import type { IApiKeyRepository, ApiKeyData } from './interfaces/IApiKeyRepository';
import type { ISubscriptionRepository, SubscriptionData } from './interfaces/ISubscriptionRepository';
import type { IScreenshotRepository } from './interfaces/IScreenshotRepository';
import type { IRateLimiter, RateLimitResult } from './interfaces/IRateLimiter';
import type { IUsageLogger } from './interfaces/IUsageLogger';
import { success, failure, SubscriptionPlan, SubscriptionStatus } from '@/lib/types';

// Mock implementations
class MockScreenshotService implements IScreenshotService {
  captureResult: any = success({
    buffer: Buffer.from('fake-image'),
    width: 1920,
    height: 1080,
    format: 'PNG' as const,
    fileSizeBytes: 1024,
    durationMs: 500,
  });

  async capture() {
    return this.captureResult;
  }

  async healthCheck() {
    return true;
  }
}

class MockApiKeyRepository implements IApiKeyRepository {
  apiKey: ApiKeyData | null = {
    id: 'key-123',
    key: 'sk_test_valid',
    userId: 'user-123',
    isActive: true,
    rateLimit: 60,
    expiresAt: null,
  };

  async findByKey(_key: string) {
    return this.apiKey;
  }

  async updateLastUsed() {}

  async isValid() {
    return true;
  }
}

class MockSubscriptionRepository implements ISubscriptionRepository {
  subscription: SubscriptionData | null = {
    id: 'sub-123',
    userId: 'user-123',
    plan: 'PRO' as SubscriptionPlan,
    status: 'ACTIVE' as SubscriptionStatus,
    creditsTotal: 5000,
    creditsUsed: 100,
    creditsRemaining: 4900,
  };

  async findByUserId() {
    return this.subscription;
  }

  async deductCredits() {}

  async hasEnoughCredits() {
    return true;
  }

  async getRemainingCredits() {
    return 4900;
  }
}

class MockScreenshotRepository implements IScreenshotRepository {
  screenshots: any[] = [];

  async save(screenshot: any) {
    this.screenshots.push(screenshot);
  }

  async findById() {
    return null;
  }

  async findByUserId() {
    return {
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }

  async delete() {}

  async deleteExpired() {
    return 0;
  }
}

class MockRateLimiter implements IRateLimiter {
  result: RateLimitResult = {
    allowed: true,
    limit: 60,
    remaining: 59,
    resetAt: new Date(Date.now() + 60000),
  };

  async check() {
    return this.result;
  }

  async increment() {}

  async reset() {}
}

class MockUsageLogger implements IUsageLogger {
  successLogs: any[] = [];
  failureLogs: any[] = [];
  rateLimitLogs: any[] = [];

  async logSuccess(data: any) {
    this.successLogs.push(data);
  }

  async logFailure(data: any) {
    this.failureLogs.push(data);
  }

  async logRateLimit(data: any) {
    this.rateLimitLogs.push(data);
  }
}

describe('CaptureScreenshotUseCase', () => {
  let useCase: CaptureScreenshotUseCase;
  let mockScreenshotService: MockScreenshotService;
  let mockApiKeyRepository: MockApiKeyRepository;
  let mockSubscriptionRepository: MockSubscriptionRepository;
  let mockScreenshotRepository: MockScreenshotRepository;
  let mockRateLimiter: MockRateLimiter;
  let mockUsageLogger: MockUsageLogger;

  beforeEach(() => {
    mockScreenshotService = new MockScreenshotService();
    mockApiKeyRepository = new MockApiKeyRepository();
    mockSubscriptionRepository = new MockSubscriptionRepository();
    mockScreenshotRepository = new MockScreenshotRepository();
    mockRateLimiter = new MockRateLimiter();
    mockUsageLogger = new MockUsageLogger();

    useCase = new CaptureScreenshotUseCase(
      mockScreenshotService,
      mockApiKeyRepository,
      mockSubscriptionRepository,
      mockScreenshotRepository,
      mockRateLimiter,
      mockUsageLogger,
    );
  });

  describe('when all conditions are valid', () => {
    it('should capture screenshot successfully', async () => {
      const request = {
        apiKey: 'sk_test_valid',
        url: 'https://example.com',
        format: 'PNG' as const,
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.width).toBe(1920);
        expect(result.value.height).toBe(1080);
        expect(result.value.format).toBe('PNG');
      }
    });

    it('should log success', async () => {
      const request = {
        apiKey: 'sk_test_valid',
        url: 'https://example.com',
      };

      await useCase.execute(request);

      expect(mockUsageLogger.successLogs).toHaveLength(1);
      expect(mockUsageLogger.successLogs[0]).toMatchObject({
        userId: 'user-123',
        apiKeyId: 'key-123',
        url: 'https://example.com',
        creditsUsed: 1,
      });
    });

    it('should deduct 1 credit', async () => {
      const deductSpy = vi.spyOn(mockSubscriptionRepository, 'deductCredits');

      const request = {
        apiKey: 'sk_test_valid',
        url: 'https://example.com',
      };

      await useCase.execute(request);

      expect(deductSpy).toHaveBeenCalledWith('sub-123', 1);
    });
  });

  describe('when API key is invalid', () => {
    it('should return InvalidApiKeyError if key not found', async () => {
      mockApiKeyRepository.apiKey = null;

      const request = {
        apiKey: 'sk_test_invalid',
        url: 'https://example.com',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(InvalidApiKeyError);
      }
    });

    it('should return InvalidApiKeyError if key is inactive', async () => {
      mockApiKeyRepository.apiKey = {
        id: 'key-123',
        key: 'sk_test_valid',
        userId: 'user-123',
        isActive: false,
        rateLimit: 60,
        expiresAt: null,
      };

      const request = {
        apiKey: 'sk_test_valid',
        url: 'https://example.com',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(InvalidApiKeyError);
      }
    });

    it('should return InvalidApiKeyError if key is expired', async () => {
      mockApiKeyRepository.apiKey = {
        id: 'key-123',
        key: 'sk_test_valid',
        userId: 'user-123',
        isActive: true,
        rateLimit: 60,
        expiresAt: new Date('2020-01-01'),
      };

      const request = {
        apiKey: 'sk_test_valid',
        url: 'https://example.com',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(InvalidApiKeyError);
      }
    });
  });

  describe('when rate limit is exceeded', () => {
    it('should return RateLimitExceededError', async () => {
      mockRateLimiter.result = {
        allowed: false,
        limit: 60,
        remaining: 0,
        resetAt: new Date(Date.now() + 30000),
        retryAfter: 30,
      };

      const request = {
        apiKey: 'sk_test_valid',
        url: 'https://example.com',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect((result.error as any).code).toBe('RATE_LIMIT_EXCEEDED');
      }
    });

    it('should log rate limit hit', async () => {
      mockRateLimiter.result = {
        allowed: false,
        limit: 60,
        remaining: 0,
        resetAt: new Date(Date.now() + 30000),
        retryAfter: 30,
      };

      const request = {
        apiKey: 'sk_test_valid',
        url: 'https://example.com',
      };

      await useCase.execute(request);

      expect(mockUsageLogger.rateLimitLogs).toHaveLength(1);
    });
  });

  describe('when subscription is invalid', () => {
    it('should return NoActiveSubscriptionError if no subscription', async () => {
      mockSubscriptionRepository.subscription = null;

      const request = {
        apiKey: 'sk_test_valid',
        url: 'https://example.com',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NoActiveSubscriptionError);
      }
    });

    it('should return NoActiveSubscriptionError if subscription not active', async () => {
      mockSubscriptionRepository.subscription = {
        id: 'sub-123',
        userId: 'user-123',
        plan: 'PRO' as SubscriptionPlan,
        status: 'CANCELED' as SubscriptionStatus,
        creditsTotal: 5000,
        creditsUsed: 5000,
        creditsRemaining: 0,
      };

      const request = {
        apiKey: 'sk_test_valid',
        url: 'https://example.com',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NoActiveSubscriptionError);
      }
    });
  });

  describe('when credits are insufficient', () => {
    it('should return InsufficientCreditsError', async () => {
      mockSubscriptionRepository.subscription = {
        id: 'sub-123',
        userId: 'user-123',
        plan: 'PRO' as SubscriptionPlan,
        status: 'ACTIVE' as SubscriptionStatus,
        creditsTotal: 5000,
        creditsUsed: 5000,
        creditsRemaining: 0,
      };

      const request = {
        apiKey: 'sk_test_valid',
        url: 'https://example.com',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect((result.error as any).code).toBe('INSUFFICIENT_CREDITS');
      }
    });
  });

  describe('when URL is invalid (SSRF)', () => {
    it.each([
      'http://localhost',
      'http://127.0.0.1',
      'http://10.0.0.1',
      'http://169.254.169.254',
      'http://metadata.google.internal',
    ])('should reject %s', async (url) => {
      const request = {
        apiKey: 'sk_test_valid',
        url,
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(mockUsageLogger.failureLogs).toHaveLength(1);
      expect(mockUsageLogger.failureLogs[0].errorCode).toBe('INVALID_URL');
    });
  });

  describe('when screenshot capture fails', () => {
    it('should return error and log failure', async () => {
      mockScreenshotService.captureResult = failure({
        message: 'Browser timeout',
        code: 'TIMEOUT',
        name: 'CaptureError',
      });

      const request = {
        apiKey: 'sk_test_valid',
        url: 'https://example.com',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(mockUsageLogger.failureLogs).toHaveLength(1);
    });
  });
});
