import { prisma } from '@repo/database';
import type { PaginationParams, PaginatedResponse } from '@repo/shared-types';
import type { IScreenshotRepository } from '../application/interfaces/IScreenshotRepository';
import { Screenshot, ScreenshotId, ImageFormat, ViewportType } from '../domain/Screenshot';

export class PrismaScreenshotRepository implements IScreenshotRepository {
  async save(screenshot: Screenshot): Promise<void> {
    try {
      const data = screenshot.toJSON();

      await prisma.screenshot.create({
        data: {
          id: data.id,
          userId: '', // Will be set by the use case
          url: data.url,
          format: data.format,
          width: data.dimensions.width,
          height: data.dimensions.height,
          fileSizeBytes: data.metadata.fileSizeBytes,
          viewportType: data.viewportType,
          expiresAt: data.expiresAt,
        },
      });
    } catch (error) {
      console.error('Error saving screenshot:', error);
      throw new Error('Failed to save screenshot');
    }
  }

  async findById(id: ScreenshotId): Promise<Screenshot | null> {
    try {
      const record = await prisma.screenshot.findUnique({
        where: { id: id as string },
      });

      if (!record) {
        return null;
      }

      return this.toDomain(record);
    } catch (error) {
      console.error('Error finding screenshot:', error);
      return null;
    }
  }

  async findByUserId(
    userId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResponse<Screenshot>> {
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      const [records, total] = await Promise.all([
        prisma.screenshot.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.screenshot.count({
          where: { userId },
        }),
      ]);

      const screenshots = records
        .map((record) => this.toDomain(record))
        .filter((s): s is Screenshot => s !== null);

      return {
        data: screenshots,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error finding screenshots:', error);
      return {
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }
  }

  async delete(id: ScreenshotId): Promise<void> {
    try {
      await prisma.screenshot.delete({
        where: { id: id as string },
      });
    } catch (error) {
      console.error('Error deleting screenshot:', error);
      throw new Error('Failed to delete screenshot');
    }
  }

  async deleteExpired(): Promise<number> {
    try {
      const result = await prisma.screenshot.deleteMany({
        where: {
          expiresAt: {
            lte: new Date(),
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error('Error deleting expired screenshots:', error);
      return 0;
    }
  }

  /**
   * Convert Prisma record to domain entity
   */
  private toDomain(record: any): Screenshot | null {
    const result = Screenshot.create({
      id: record.id as ScreenshotId,
      url: record.url,
      format: record.format as ImageFormat,
      dimensions: {
        width: record.width,
        height: record.height,
      },
      viewportType: record.viewportType as ViewportType,
      metadata: {
        url: record.url,
        fileSizeBytes: record.fileSizeBytes,
        durationMs: 0, // Not stored
        capturedAt: record.createdAt,
      },
    });

    return result.success ? result.value : null;
  }
}
