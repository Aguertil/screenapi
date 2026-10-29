import { Result, success, failure, ValidationError } from '@/lib/types';

export type ScreenshotId = string & { readonly __brand: 'ScreenshotId' };
export type ImageFormat = 'PNG' | 'JPEG' | 'WEBP';
export type ViewportType = 'DESKTOP' | 'MOBILE' | 'TABLET' | 'CUSTOM';

export interface Dimensions {
  width: number;
  height: number;
}

export interface ScreenshotMetadata {
  url: string;
  fileSizeBytes: number;
  durationMs: number;
  capturedAt: Date;
}

export interface CreateScreenshotParams {
  id: ScreenshotId;
  url: string;
  format: ImageFormat;
  dimensions: Dimensions;
  viewportType: ViewportType;
  metadata: ScreenshotMetadata;
}

export class Screenshot {
  private constructor(
    public readonly id: ScreenshotId,
    public readonly url: string,
    public readonly format: ImageFormat,
    public readonly dimensions: Dimensions,
    public readonly viewportType: ViewportType,
    public readonly metadata: ScreenshotMetadata,
    public readonly expiresAt: Date | null = null,
  ) {}

  static create(params: CreateScreenshotParams): Result<Screenshot, ValidationError> {
    // Validate URL
    if (!this.isValidUrl(params.url)) {
      return failure(new ValidationError('Invalid URL format'));
    }

    // Validate dimensions
    if (params.dimensions.width < 200 || params.dimensions.width > 3840) {
      return failure(new ValidationError('Width must be between 200 and 3840 pixels'));
    }

    if (params.dimensions.height < 200 || params.dimensions.height > 2160) {
      return failure(new ValidationError('Height must be between 200 and 2160 pixels'));
    }

    // Validate file size
    if (params.metadata.fileSizeBytes <= 0) {
      return failure(new ValidationError('File size must be positive'));
    }

    // Create screenshot entity
    const screenshot = new Screenshot(
      params.id,
      params.url,
      params.format,
      params.dimensions,
      params.viewportType,
      params.metadata,
    );

    return success(screenshot);
  }

  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  toJSON() {
    return {
      id: this.id,
      url: this.url,
      format: this.format,
      dimensions: this.dimensions,
      viewportType: this.viewportType,
      metadata: this.metadata,
      expiresAt: this.expiresAt,
    };
  }
}
