import { Result, success, failure, ValidationError } from '@repo/shared-types';
import type { ImageFormat, ViewportType, Dimensions } from './Screenshot';

export interface ScreenshotOptionsParams {
  url: string;
  format?: ImageFormat;
  quality?: number;
  viewportType?: ViewportType;
  viewportWidth?: number;
  viewportHeight?: number;
  fullPage?: boolean;
  waitForSelector?: string;
  waitForTimeout?: number;
  hideElements?: string[];
  blockCookies?: boolean;
  blockAds?: boolean;
  userAgent?: string;
}

export class ScreenshotOptions {
  private constructor(
    public readonly url: string,
    public readonly format: ImageFormat,
    public readonly quality: number | undefined,
    public readonly viewportType: ViewportType,
    public readonly viewport: Dimensions,
    public readonly fullPage: boolean,
    public readonly waitForSelector: string | undefined,
    public readonly waitForTimeout: number,
    public readonly hideElements: string[],
    public readonly blockCookies: boolean,
    public readonly blockAds: boolean,
    public readonly userAgent: string | undefined,
  ) {}

  static create(params: ScreenshotOptionsParams): Result<ScreenshotOptions, ValidationError> {
    // Validate URL
    if (!this.isValidUrl(params.url)) {
      return failure(new ValidationError('Invalid URL format'));
    }

    // Validate format
    const format = params.format || 'PNG';
    if (!['PNG', 'JPEG', 'WEBP'].includes(format)) {
      return failure(new ValidationError('Format must be PNG, JPEG, or WEBP'));
    }

    // Validate quality (only for JPEG)
    if (params.quality !== undefined) {
      if (format !== 'JPEG') {
        return failure(new ValidationError('Quality is only supported for JPEG format'));
      }
      if (params.quality < 1 || params.quality > 100) {
        return failure(new ValidationError('Quality must be between 1 and 100'));
      }
    }

    // Determine viewport
    const viewportType = params.viewportType || 'DESKTOP';
    let viewport: Dimensions;

    if (viewportType === 'CUSTOM') {
      if (!params.viewportWidth || !params.viewportHeight) {
        return failure(
          new ValidationError('Custom viewport requires both width and height'),
        );
      }
      viewport = {
        width: params.viewportWidth,
        height: params.viewportHeight,
      };
    } else {
      viewport = this.getPresetViewport(viewportType);
    }

    // Validate viewport dimensions
    if (viewport.width < 200 || viewport.width > 3840) {
      return failure(new ValidationError('Viewport width must be between 200 and 3840'));
    }
    if (viewport.height < 200 || viewport.height > 2160) {
      return failure(new ValidationError('Viewport height must be between 200 and 2160'));
    }

    // Validate timeout
    const timeout = params.waitForTimeout || 30000;
    if (timeout < 1000 || timeout > 60000) {
      return failure(new ValidationError('Timeout must be between 1000ms and 60000ms'));
    }

    const options = new ScreenshotOptions(
      params.url,
      format,
      params.quality,
      viewportType,
      viewport,
      params.fullPage ?? false,
      params.waitForSelector,
      timeout,
      params.hideElements ?? [],
      params.blockCookies ?? true,
      params.blockAds ?? false,
      params.userAgent,
    );

    return success(options);
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private static getPresetViewport(type: ViewportType): Dimensions {
    const presets: Record<Exclude<ViewportType, 'CUSTOM'>, Dimensions> = {
      DESKTOP: { width: 1920, height: 1080 },
      MOBILE: { width: 375, height: 667 },
      TABLET: { width: 768, height: 1024 },
    };
    return presets[type as Exclude<ViewportType, 'CUSTOM'>];
  }
}
