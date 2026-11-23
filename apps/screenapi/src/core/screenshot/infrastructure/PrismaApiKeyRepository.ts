import { prisma } from '@/lib/prisma';
import { hashApiKey } from '@/lib/apiKeys';
import type {
  IApiKeyRepository,
  ApiKeyData,
} from '../application/interfaces/IApiKeyRepository';

export class PrismaApiKeyRepository implements IApiKeyRepository {
  async findByKey(key: string): Promise<ApiKeyData | null> {
    try {
      const apiKey = await prisma.apiKey.findUnique({
        where: { key: hashApiKey(key) },
        select: {
          id: true,
          key: true,
          userId: true,
          isActive: true,
          rateLimit: true,
          expiresAt: true,
        },
      });

      if (!apiKey) {
        return null;
      }

      return {
        id: apiKey.id,
        key: apiKey.key,
        userId: apiKey.userId,
        isActive: apiKey.isActive,
        rateLimit: apiKey.rateLimit,
        expiresAt: apiKey.expiresAt,
      };
    } catch (error) {
      console.error('Error finding API key:', error);
      throw new Error('Failed to find API key');
    }
  }

  async findById(id: string): Promise<ApiKeyData | null> {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
      select: { id: true, key: true, userId: true, isActive: true, rateLimit: true, expiresAt: true, signingSecret: true },
    });
    return apiKey;
  }

  async updateLastUsed(keyId: string): Promise<void> {
    try {
      await prisma.apiKey.update({
        where: { id: keyId },
        data: { lastUsedAt: new Date() },
      });
    } catch (error) {
      console.error('Error updating last used:', error);
      // Don't throw - this is not critical
    }
  }

  async isValid(key: string): Promise<boolean> {
    try {
      const apiKey = await this.findByKey(key);
      if (!apiKey || !apiKey.isActive) {
        return false;
      }

      // Check expiration
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}
