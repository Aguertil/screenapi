import type { ImageFormat, ViewportType } from '../../domain/Screenshot';

export interface SuccessLogData {
  userId: string;
  apiKeyId: string;
  url: string;
  format: ImageFormat;
  viewportType: ViewportType;
  viewportWidth: number;
  viewportHeight: number;
  fullPage: boolean;
  durationMs: number;
  fileSizeBytes: number;
  creditsUsed: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface FailureLogData {
  userId: string;
  apiKeyId: string;
  url: string;
  errorMessage: string;
  errorCode: string;
  durationMs: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface RateLimitLogData {
  userId: string;
  apiKeyId: string;
  limit: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface IUsageLogger {
  /**
   * Log a successful screenshot capture
   */
  logSuccess(data: SuccessLogData): Promise<void>;

  /**
   * Log a failed screenshot capture
   */
  logFailure(data: FailureLogData): Promise<void>;

  /**
   * Log a rate limit hit
   */
  logRateLimit(data: RateLimitLogData): Promise<void>;
}
