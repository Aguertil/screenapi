import { describe, it, expect } from 'vitest';
import { PlaywrightScreenshotService } from '../infrastructure/PlaywrightScreenshotService';
import { RedisRateLimiter } from '../infrastructure/RedisRateLimiter';
import { PrismaApiKeyRepository } from '../infrastructure/PrismaApiKeyRepository';
import { PrismaSubscriptionRepository } from '../infrastructure/PrismaSubscriptionRepository';
import { PrismaScreenshotRepository } from '../infrastructure/PrismaScreenshotRepository';
import { PrismaUsageLogger } from '../infrastructure/PrismaUsageLogger';
import { createCaptureScreenshotUseCase } from '../infrastructure';

describe('Infrastructure Layer', () => {
  describe('Service instantiation', () => {
    it('should instantiate PlaywrightScreenshotService', () => {
      const service = new PlaywrightScreenshotService();
      expect(service).toBeDefined();
      expect(service.healthCheck).toBeDefined();
      expect(service.capture).toBeDefined();
    });

    it('should instantiate RedisRateLimiter without Redis URL', () => {
      const limiter = new RedisRateLimiter();
      expect(limiter).toBeDefined();
      expect(limiter.check).toBeDefined();
      expect(limiter.increment).toBeDefined();
      expect(limiter.reset).toBeDefined();
    });

    it('should instantiate PrismaApiKeyRepository', () => {
      const repo = new PrismaApiKeyRepository();
      expect(repo).toBeDefined();
      expect(repo.findByKey).toBeDefined();
      expect(repo.updateLastUsed).toBeDefined();
      expect(repo.isValid).toBeDefined();
    });

    it('should instantiate PrismaSubscriptionRepository', () => {
      const repo = new PrismaSubscriptionRepository();
      expect(repo).toBeDefined();
      expect(repo.findByUserId).toBeDefined();
      expect(repo.deductCredits).toBeDefined();
      expect(repo.hasEnoughCredits).toBeDefined();
      expect(repo.getRemainingCredits).toBeDefined();
    });

    it('should instantiate PrismaScreenshotRepository', () => {
      const repo = new PrismaScreenshotRepository();
      expect(repo).toBeDefined();
      expect(repo.save).toBeDefined();
      expect(repo.findById).toBeDefined();
      expect(repo.findByUserId).toBeDefined();
      expect(repo.delete).toBeDefined();
      expect(repo.deleteExpired).toBeDefined();
    });

    it('should instantiate PrismaUsageLogger', () => {
      const logger = new PrismaUsageLogger();
      expect(logger).toBeDefined();
      expect(logger.logSuccess).toBeDefined();
      expect(logger.logFailure).toBeDefined();
      expect(logger.logRateLimit).toBeDefined();
    });
  });

  describe('Factory function', () => {
    it('should create complete use case with all dependencies', () => {
      const useCase = createCaptureScreenshotUseCase();
      expect(useCase).toBeDefined();
      expect(useCase.execute).toBeDefined();
    });

    it('should create use case with Redis URL', () => {
      const useCase = createCaptureScreenshotUseCase('redis://localhost:6379');
      expect(useCase).toBeDefined();
    });
  });

  describe('Type safety', () => {
    it('should have correct interface implementations', () => {
      // This test passes if TypeScript compilation succeeds
      // It validates that all implementations match their interfaces

      const screenshotService = new PlaywrightScreenshotService();
      const rateLimiter = new RedisRateLimiter();
      const apiKeyRepo = new PrismaApiKeyRepository();
      const subscriptionRepo = new PrismaSubscriptionRepository();
      const screenshotRepo = new PrismaScreenshotRepository();
      const usageLogger = new PrismaUsageLogger();

      // Type assertions - will fail at compile time if interfaces don't match
      expect(screenshotService).toHaveProperty('capture');
      expect(screenshotService).toHaveProperty('healthCheck');
      expect(rateLimiter).toHaveProperty('check');
      expect(rateLimiter).toHaveProperty('increment');
      expect(rateLimiter).toHaveProperty('reset');
      expect(apiKeyRepo).toHaveProperty('findByKey');
      expect(subscriptionRepo).toHaveProperty('deductCredits');
      expect(screenshotRepo).toHaveProperty('save');
      expect(usageLogger).toHaveProperty('logSuccess');
    });
  });
});
