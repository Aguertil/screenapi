import { Result, success, failure, ValidationError } from '@/lib/types';
import type { ImageFormat, ViewportType, Dimensions } from './Screenshot';

export interface Geolocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface ScreenshotOptionsParams {
  url?: string;
  /** HTML à rendre à la place d'une URL */
  html?: string;
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
  blockChats?: boolean;
  userAgent?: string;
  darkMode?: boolean;
  deviceScaleFactor?: number;
  selector?: string;
  delay?: number;
  click?: string;
  styles?: string;
  scripts?: string;
  lazyLoad?: boolean;
  omitBackground?: boolean;
  reducedMotion?: boolean;
  geolocation?: Geolocation;
  timezone?: string;
  locale?: string;
}

export const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_CODE_BYTES = 100 * 1024;

export class ScreenshotOptions {
  private constructor(
    public readonly url: string,
    public readonly html: string | undefined,
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
    public readonly blockChats: boolean,
    public readonly userAgent: string | undefined,
    public readonly darkMode: boolean,
    public readonly deviceScaleFactor: number,
    public readonly selector: string | undefined,
    public readonly delay: number,
    public readonly click: string | undefined,
    public readonly styles: string | undefined,
    public readonly scripts: string | undefined,
    public readonly lazyLoad: boolean,
    public readonly omitBackground: boolean,
    public readonly reducedMotion: boolean,
    public readonly geolocation: Geolocation | undefined,
    public readonly timezone: string | undefined,
    public readonly locale: string | undefined,
  ) {}

  /** La capture part-elle d'un HTML fourni (et non d'une URL) ? */
  get isHtml(): boolean {
    return this.html !== undefined;
  }

  static create(params: ScreenshotOptionsParams): Result<ScreenshotOptions, ValidationError> {
    const html = params.html;
    if (html !== undefined) {
      if (params.url) return failure(new ValidationError('Send either url or html, not both'));
      if (!html.trim()) return failure(new ValidationError('html is empty'));
      if (Buffer.byteLength(html) > MAX_HTML_BYTES) return failure(new ValidationError('html must be at most 2 MB'));
    } else if (!params.url || !this.isValidUrl(params.url)) {
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
    if (params.omitBackground && format === 'JPEG') {
      return failure(new ValidationError('omit_background needs PNG or WEBP (JPEG has no transparency)'));
    }
    for (const [name, code] of [['styles', params.styles], ['scripts', params.scripts]] as const) {
      if (code && Buffer.byteLength(code) > MAX_CODE_BYTES) {
        return failure(new ValidationError(`${name} must be at most 100 KB`));
      }
    }

    const geo = params.geolocation;
    if (geo) {
      if (!(geo.latitude >= -90 && geo.latitude <= 90) || !(geo.longitude >= -180 && geo.longitude <= 180)) {
        return failure(new ValidationError('geolocation needs a latitude between -90 and 90 and a longitude between -180 and 180'));
      }
    }
    if (params.timezone) {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: params.timezone });
      } catch {
        return failure(new ValidationError(`Unknown time zone: ${params.timezone} (use an IANA name like Europe/Paris)`));
      }
    }
    if (params.locale && !/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(params.locale)) {
      return failure(new ValidationError('locale must look like fr-FR or en'));
    }

    return success(
      new ScreenshotOptions(
        html !== undefined ? 'about:blank' : (params.url as string),
        html,
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
        params.blockChats ?? false,
        params.userAgent,
        params.darkMode ?? false,
        scale,
        params.selector,
        delay,
        params.click,
        params.styles,
        params.scripts,
        params.lazyLoad ?? false,
        params.omitBackground ?? false,
        params.reducedMotion ?? false,
        geo,
        params.timezone,
        params.locale,
      ),
    );
  }

  /** Clé stable décrivant le rendu demandé (pour le cache). */
  cacheKey(): string {
    return JSON.stringify([
      this.url, this.html, this.format, this.quality, this.viewport, this.fullPage, this.waitForSelector,
      this.hideElements, this.blockCookies, this.blockAds, this.blockChats, this.userAgent, this.darkMode,
      this.deviceScaleFactor, this.selector, this.delay, this.click, this.styles, this.scripts, this.lazyLoad,
      this.omitBackground, this.reducedMotion, this.geolocation, this.timezone, this.locale,
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
