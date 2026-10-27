import { chromium, Browser, BrowserContext, Page } from 'playwright-core';
import { Result, success, failure } from '@repo/shared-types';
import {
  IScreenshotService,
  ScreenshotResult,
  CaptureError,
} from '../application/interfaces/IScreenshotService';
import { ScreenshotOptions } from '../domain/ScreenshotOptions';

/**
 * Browser pool for reusing browser instances
 */
class BrowserPool {
  private browser: Browser | null = null;
  private isInitializing = false;
  private lastUsed = Date.now();
  private readonly IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  async getBrowser(): Promise<Browser> {
    // Close idle browser
    if (this.browser && Date.now() - this.lastUsed > this.IDLE_TIMEOUT) {
      await this.closeBrowser();
    }

    // Return existing browser
    if (this.browser?.isConnected()) {
      this.lastUsed = Date.now();
      return this.browser;
    }

    // Wait if already initializing
    if (this.isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.getBrowser();
    }

    // Launch new browser
    this.isInitializing = true;
    try {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-web-security',
          '--disable-background-networking',
          '--disable-extensions',
          '--hide-scrollbars',
          '--mute-audio',
        ],
      });
      this.lastUsed = Date.now();
      return this.browser;
    } finally {
      this.isInitializing = false;
    }
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        console.error('Error closing browser:', error);
      }
      this.browser = null;
    }
  }

  async cleanup(): Promise<void> {
    await this.closeBrowser();
  }
}

export class PlaywrightScreenshotService implements IScreenshotService {
  private browserPool: BrowserPool;

  constructor() {
    this.browserPool = new BrowserPool();
  }

  async capture(options: ScreenshotOptions): Promise<Result<ScreenshotResult, CaptureError>> {
    const startTime = Date.now();
    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      // 1. Get browser from pool
      const browser = await this.browserPool.getBrowser();

      // 2. Create isolated context
      context = await browser.newContext({
        viewport: {
          width: options.viewport.width,
          height: options.viewport.height,
        },
        userAgent: options.userAgent,
        bypassCSP: true,
      });

      // 3. Block cookies if requested
      if (options.blockCookies) {
        await context.route('**/*', (route) => {
          const request = route.request();
          if (request.resourceType() === 'document') {
            route.continue();
          } else {
            // Remove cookies from requests
            route.continue({
              headers: {
                ...request.headers(),
                cookie: '',
              },
            });
          }
        });
      }

      // 4. Block ads if requested
      if (options.blockAds) {
        await context.route('**/*', (route) => {
          const url = route.request().url();
          const adDomains = [
            'doubleclick.net',
            'googlesyndication.com',
            'googleadservices.com',
            'google-analytics.com',
            'facebook.net',
            'googletagmanager.com',
          ];

          if (adDomains.some((domain) => url.includes(domain))) {
            route.abort();
          } else {
            route.continue();
          }
        });
      }

      // 5. Create page
      page = await context.newPage();

      // 6. Navigate to URL
      const response = await page.goto(options.url, {
        waitUntil: 'networkidle',
        timeout: options.waitForTimeout,
      });

      if (!response || !response.ok()) {
        return failure(
          new CaptureError(
            `Failed to load URL: ${response?.status() || 'unknown'}`,
            'NAVIGATION_FAILED',
          ) as CaptureError,
        );
      }

      // 7. Wait for specific selector if requested
      if (options.waitForSelector) {
        try {
          await page.waitForSelector(options.waitForSelector, {
            timeout: options.waitForTimeout,
          });
        } catch (error) {
          return failure(
            new CaptureError(
              `Selector not found: ${options.waitForSelector}`,
              'SELECTOR_NOT_FOUND',
              error instanceof Error ? error : undefined,
            ) as CaptureError,
          );
        }
      }

      // 8. Hide cookie banners automatically
      if (options.blockCookies) {
        await this.hideCookieBanners(page);
      }

      // 9. Hide custom elements if requested
      if (options.hideElements && options.hideElements.length > 0) {
        for (const selector of options.hideElements) {
          try {
            await page.evaluate((sel) => {
              const elements = document.querySelectorAll(sel);
              elements.forEach((el) => {
                (el as HTMLElement).style.display = 'none';
              });
            }, selector);
          } catch {
            // Ignore if selector doesn't match
          }
        }
      }

      // 10. Capture screenshot
      const buffer = await page.screenshot({
        type: options.format.toLowerCase() as 'png' | 'jpeg' | 'webp',
        quality: options.quality,
        fullPage: options.fullPage,
      });

      // 11. Get dimensions
      const dimensions = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      }));

      const durationMs = Date.now() - startTime;

      return success({
        buffer: Buffer.from(buffer),
        width: dimensions.width,
        height: dimensions.height,
        format: options.format,
        fileSizeBytes: buffer.byteLength,
        durationMs,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = this.categorizeError(error);

      return failure(
        new CaptureError(errorMessage, errorCode, error instanceof Error ? error : undefined) as CaptureError,
      );
    } finally {
      // Cleanup
      if (page) {
        try {
          await page.close();
        } catch (error) {
          console.error('Error closing page:', error);
        }
      }
      if (context) {
        try {
          await context.close();
        } catch (error) {
          console.error('Error closing context:', error);
        }
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const browser = await this.browserPool.getBrowser();
      return browser.isConnected();
    } catch {
      return false;
    }
  }

  /**
   * Hide common cookie consent banners
   */
  private async hideCookieBanners(page: Page): Promise<void> {
    const cookieBannerSelectors = [
      '#cookie-banner',
      '.cookie-banner',
      '#cookie-consent',
      '.cookie-consent',
      '#gdpr-banner',
      '.gdpr-banner',
      '[id*="cookie"]',
      '[class*="cookie"]',
      '[id*="gdpr"]',
      '[class*="gdpr"]',
      '[aria-label*="cookie"]',
      '[aria-label*="consent"]',
    ];

    try {
      await page.evaluate((selectors) => {
        selectors.forEach((selector) => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el) => {
              const htmlEl = el as HTMLElement;
              // Only hide if element is visible and near top/bottom
              const rect = htmlEl.getBoundingClientRect();
              if (
                rect.height > 50 &&
                (rect.top < 200 || rect.bottom > window.innerHeight - 200)
              ) {
                htmlEl.style.display = 'none';
              }
            });
          } catch {
            // Ignore errors for individual selectors
          }
        });
      }, cookieBannerSelectors);
    } catch (error) {
      // Ignore if hiding fails
      console.warn('Failed to hide cookie banners:', error);
    }
  }

  /**
   * Categorize error for better error codes
   */
  private categorizeError(error: unknown): string {
    if (!(error instanceof Error)) return 'UNKNOWN_ERROR';

    const message = error.message.toLowerCase();

    if (message.includes('timeout')) return 'TIMEOUT';
    if (message.includes('navigation')) return 'NAVIGATION_FAILED';
    if (message.includes('net::')) return 'NETWORK_ERROR';
    if (message.includes('selector')) return 'SELECTOR_NOT_FOUND';
    if (message.includes('crash')) return 'BROWSER_CRASH';
    if (message.includes('memory')) return 'OUT_OF_MEMORY';

    return 'CAPTURE_FAILED';
  }

  /**
   * Cleanup resources (call on shutdown)
   */
  async cleanup(): Promise<void> {
    await this.browserPool.cleanup();
  }
}
