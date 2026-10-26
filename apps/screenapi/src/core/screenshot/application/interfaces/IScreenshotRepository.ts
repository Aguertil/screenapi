import { Screenshot, ScreenshotId } from '../../domain/Screenshot';
import type { PaginationParams, PaginatedResponse } from '@repo/shared-types';

export interface IScreenshotRepository {
  /**
   * Save a screenshot to the repository
   */
  save(screenshot: Screenshot): Promise<void>;

  /**
   * Find a screenshot by its ID
   */
  findById(id: ScreenshotId): Promise<Screenshot | null>;

  /**
   * Find all screenshots for a user with pagination
   */
  findByUserId(
    userId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResponse<Screenshot>>;

  /**
   * Delete a screenshot by its ID
   */
  delete(id: ScreenshotId): Promise<void>;

  /**
   * Delete expired screenshots (cleanup job)
   */
  deleteExpired(): Promise<number>;
}
