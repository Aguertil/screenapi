import { Result } from '@repo/shared-types';
import { ScreenshotOptions } from '../../domain/ScreenshotOptions';
import type { ImageFormat } from '../../domain/Screenshot';

export interface ScreenshotResult {
  buffer: Buffer;
  width: number;
  height: number;
  format: ImageFormat;
  fileSizeBytes: number;
  durationMs: number;
}

export class CaptureError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'CaptureError';
  }
}

export interface IScreenshotService {
  /**
   * Capture a screenshot with the given options
   */
  capture(options: ScreenshotOptions): Promise<Result<ScreenshotResult, CaptureError>>;

  /**
   * Check if the service is healthy and ready
   */
  healthCheck(): Promise<boolean>;
}
