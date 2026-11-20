import { Result, success, failure, ValidationError } from '@/lib/types';
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
  darkMode?: boolean;
  deviceScaleFactor?: number;
  selector?: string;
  delay?: number;
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
    public readonly darkMode: boolean,
    public readonly deviceScaleFactor: number,
    public readonly selector: string | undefined,
    public readonly delay: number,
  ) {}

  static create(params: ScreenshotOptionsParams): Result<ScreenshotOptions, ValidationError> {
    if (!this.isValidUrl(params.url)) {
      return failure(new ValidationError('Invalid URL format'));
    }

    const format = params.format || 'PNG';
    if (!['PNG', 'JPEG', 'WEBP', 'PDF'].includes(format)) {
      return failure(new ValidationError('Format must be PNG, JPEG, WEBP or PDF'));
    }

    if (params.quality !== undefined) {
      if (format !== 'JPEG' && format !== 'WEBP') {
        return failure(new ValidationError('Quality is only supported for JPEG and WEBP'));
      }
      if (params.quality < 1 || params.quality > 100) {
        return failure(new ValidationError('Quality must be between 1 and 100'));
      }
    }

    const viewportType = params.viewportType || 'DESKTOP';
    let viewport: Dimensions;
    if (viewportType === 'CUSTOM' || params.viewportWidth || params.viewportHeight) {
      const base = viewportType === 'CUSTOM' ? { width: 1280, height: 800 } : this.getPresetViewport(viewportType);
      viewport = { width: params.viewportWidth ?? base.width, height: params.viewportHeight ?? base.height };
    } else {
      viewport = this.getPresetViewport(viewportType);
    }
    if (viewport.width < 200 || viewport.width > 3840) {
      return failure(new ValidationError('Viewport width must be between 200 and 3840'));
    }
    if (viewport.height < 200 || viewport.height > 2160) {
      return failure(new ValidationError('Viewport height must be between 200 and 2160'));
    }

    const timeout = params.waitForTimeout || 30000;
    if (timeout < 1000 || timeout > 60000) {
      return failure(new ValidationError('Timeout must be between 1000ms and 60000ms'));
    }

    const scale = params.deviceScaleFactor ?? 1;
    if (scale < 1 || scale > 3) {
      return failure(new ValidationError('deviceScaleFactor must be between 1 and 3'));
    }

    const delay = params.delay ?? 0;
    if (delay < 0 || delay > 10000) {
      return failure(new ValidationError('delay must be between 0 and 10000 ms'));
    }

    if (format === 'PDF' && params.selector) {
      return failure(new ValidationError('selector cannot be used with PDF'));
    }

    return success(
      new ScreenshotOptions(
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
        params.darkMode ?? false,
        scale,
        params.selector,
        delay,
      ),
    );
  }

  /** Clé stable décrivant le rendu demandé (pour le cache). */
  cacheKey(): string {
    return JSON.stringify([
      this.url, this.format, this.quality, this.viewport, this.fullPage, this.waitForSelector,
      this.hideElements, this.blockCookies, this.blockAds, this.userAgent, this.darkMode,
      this.deviceScaleFactor, this.selector, this.delay,
    ]);
  }

  private static isValidUrl(url: string): boolean {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private static getPresetViewport(type: ViewportType): Dimensions {
    const presets: Record<Exclude<ViewportType, 'CUSTOM'>, Dimensions> = {
      DESKTOP: { width: 1280, height: 800 },
      MOBILE: { width: 390, height: 844 },
      TABLET: { width: 820, height: 1180 },
    };
    return presets[type as Exclude<ViewportType, 'CUSTOM'>] || presets.DESKTOP;
  }
}
