import { chromium, Browser, BrowserContext, Page } from 'playwright-core';
import { Result, success, failure } from '@/lib/types';
import {
  IScreenshotService,
  ScreenshotResult,
  CaptureError,
} from '../application/interfaces/IScreenshotService';
import { ScreenshotOptions } from '../domain/ScreenshotOptions';
import { installNetworkGuard, isPublicUrl } from './NetworkGuard';

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
        // Chrome du système si fourni (serveur dédié, tests locaux), sinon celui de Playwright
        executablePath: process.env.CHROME_PATH || undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
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

/** Domaines publicitaires et de pistage bloqués quand blockAds est demandé. */
const AD_HOSTS = [
  'doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'google-analytics.com',
  'googletagmanager.com', 'adservice.google.com', 'facebook.net', 'connect.facebook.net',
  'amazon-adsystem.com', 'adnxs.com', 'criteo.com', 'criteo.net', 'taboola.com', 'outbrain.com',
  'scorecardresearch.com', 'hotjar.com', 'quantserve.com', 'moatads.com', 'pubmatic.com',
  'rubiconproject.com', 'openx.net', 'adsrvr.org', 'smartadserver.com', 'teads.tv',
];

/**
 * Limite le nombre de captures simultanées : chaque page Chrome consomme
 * 100 à 300 Mo, et un petit serveur s'effondre sinon. Les demandes en trop
 * attendent leur tour (au plus QUEUE_TIMEOUT_MS).
 */
class Semaphore {
  private active = 0;
  private waiting: Array<() => void> = [];
  constructor(private readonly max: number) {}
  async acquire(timeoutMs: number): Promise<boolean> {
    if (this.active < this.max) {
      this.active++;
      return true;
    }
    return new Promise((resolve) => {
      const grant = () => {
        clearTimeout(timer);
        this.active++;
        resolve(true);
      };
      const timer = setTimeout(() => {
        this.waiting = this.waiting.filter((w) => w !== grant);
        resolve(false);
      }, timeoutMs);
      this.waiting.push(grant);
    });
  }
  release() {
    this.active--;
    const next = this.waiting.shift();
    if (next) next();
  }
}

const MAX_CONCURRENCY = Math.max(1, Number(process.env.MAX_CONCURRENCY) || 3);
const QUEUE_TIMEOUT_MS = 30_000;

export class PlaywrightScreenshotService implements IScreenshotService {
  private browserPool: BrowserPool;
  private slots = new Semaphore(MAX_CONCURRENCY);

  constructor() {
    this.browserPool = new BrowserPool();
  }

  async capture(options: ScreenshotOptions): Promise<Result<ScreenshotResult, CaptureError>> {
    if (!(await this.slots.acquire(QUEUE_TIMEOUT_MS))) {
      return failure(new CaptureError('Server busy, please retry in a few seconds', 'BUSY') as CaptureError);
    }
    try {
      return await this.captureNow(options);
    } finally {
      this.slots.release();
    }
  }

  private async captureNow(options: ScreenshotOptions): Promise<Result<ScreenshotResult, CaptureError>> {
    const startTime = Date.now();
    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      if (!options.isHtml && !(await isPublicUrl(options.url))) {
        return failure(
          new CaptureError('URL pointing to a private network is not allowed', 'NAVIGATION_FAILED') as CaptureError,
        );
      }

      const browser = await this.browserPool.getBrowser();
      context = await browser.newContext({
        viewport: { width: options.viewport.width, height: options.viewport.height },
        deviceScaleFactor: options.deviceScaleFactor,
        userAgent: options.userAgent,
        colorScheme: options.darkMode ? 'dark' : 'light',
        reducedMotion: options.reducedMotion ? 'reduce' : 'no-preference',
        locale: options.locale || 'en-US',
        timezoneId: options.timezone,
        geolocation: options.geolocation,
        permissions: options.geolocation ? ['geolocation'] : [],
        ignoreHTTPSErrors: true,
      });

      // Blocage des publicités (un seul gestionnaire, qui laisse la main au suivant)
      if (options.blockAds) {
        await context.route('**/*', async (route) => {
          let host = '';
          try {
            host = new URL(route.request().url()).hostname;
          } catch {
            /* URL illisible : laisser passer */
          }
          if (AD_HOSTS.some((d) => host === d || host.endsWith('.' + d))) await route.abort();
          else await route.fallback();
        });
      }

      // Protection SSRF : enregistrée en dernier pour s'exécuter en premier
      await installNetworkGuard(context);

      page = await context.newPage();
      if (options.isHtml) {
        // HTML fourni : ses ressources externes passent par le même garde réseau
        await page.setContent(options.html as string, { waitUntil: 'load', timeout: options.waitForTimeout });
      } else {
        const response = await page.goto(options.url, { waitUntil: 'load', timeout: options.waitForTimeout });
        if (!response) {
          return failure(new CaptureError('The page did not respond', 'NAVIGATION_FAILED') as CaptureError);
        }
      }
      // Laisser finir les chargements tardifs, sans bloquer sur les pages qui ne s'arrêtent jamais
      await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});

      // Contenus chargés au défilement (images « lazy ») : descendre la page puis remonter
      if (options.lazyLoad) await this.scrollThrough(page);

      if (options.waitForSelector) {
        try {
          await page.waitForSelector(options.waitForSelector, { timeout: options.waitForTimeout });
        } catch (error) {
          return failure(
            new CaptureError(`Selector not found: ${options.waitForSelector}`, 'SELECTOR_NOT_FOUND', error as Error) as CaptureError,
          );
        }
      }

      if (options.blockCookies) await this.hideCookieBanners(page);
      if (options.blockChats) await this.hideChatsAndPopups(page);

      if (options.hideElements.length > 0) {
        await page
          .addStyleTag({ content: options.hideElements.map((sel) => `${sel}{display:none!important}`).join('\n') })
          .catch(() => {});
      }

      if (options.styles) await page.addStyleTag({ content: options.styles }).catch(() => {});

      if (options.scripts) {
        try {
          await page.evaluate(options.scripts);
        } catch (error) {
          return failure(new CaptureError(`Your script failed: ${(error as Error).message.split('\n')[0]}`, 'SCRIPT_ERROR', error as Error) as CaptureError);
        }
      }

      if (options.click) {
        try {
          await page.click(options.click, { timeout: 5000 });
          await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
          await page.waitForTimeout(300);
        } catch (error) {
          return failure(new CaptureError(`Element to click not found: ${options.click}`, 'SELECTOR_NOT_FOUND', error as Error) as CaptureError);
        }
      }

      if (options.delay > 0) await page.waitForTimeout(options.delay);

      let buffer: Buffer;
      let width = options.viewport.width;
      let height = options.viewport.height;

      if (options.format === 'PDF') {
        await page.emulateMedia({ media: 'screen' });
        buffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
        width = 794;
        height = 1123;
      } else {
        const type = options.format.toLowerCase() as 'png' | 'jpeg' | 'webp';
        const shotOptions = {
          // Playwright ne produit que PNG et JPEG : le WebP est converti ensuite (sharp)
          type: (type === 'webp' ? 'png' : type) as 'png' | 'jpeg',
          quality: type === 'jpeg' ? options.quality : undefined,
          omitBackground: options.omitBackground,
        };
        if (options.selector) {
          const element = page.locator(options.selector).first();
          try {
            await element.waitFor({ state: 'visible', timeout: 5000 });
          } catch (error) {
            return failure(new CaptureError(`Element not found: ${options.selector}`, 'SELECTOR_NOT_FOUND', error as Error) as CaptureError);
          }
          buffer = await element.screenshot(shotOptions);
          const box = await element.boundingBox();
          width = Math.round(box?.width ?? width);
          height = Math.round(box?.height ?? height);
        } else {
          buffer = await page.screenshot({ ...shotOptions, fullPage: options.fullPage });
          if (options.fullPage) {
            const dims = await page.evaluate(() => ({
              width: document.documentElement.scrollWidth,
              height: document.documentElement.scrollHeight,
            }));
            width = dims.width;
            height = dims.height;
          }
        }
      }

      if (options.format === 'WEBP') {
        const sharp = (await import('sharp')).default;
        buffer = await sharp(buffer).webp({ quality: options.quality ?? 80 }).toBuffer();
      }

      return success({
        buffer: Buffer.from(buffer),
        width,
        height,
        format: options.format,
        fileSizeBytes: buffer.byteLength,
        durationMs: Date.now() - startTime,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message.split('\n')[0] : 'Unknown error';
      return failure(
        new CaptureError(errorMessage, this.categorizeError(error), error instanceof Error ? error : undefined) as CaptureError,
      );
    } finally {
      if (page) await page.close().catch(() => {});
      if (context) await context.close().catch(() => {});
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
  /**
   * Masque les bannières de consentement : outils les plus répandus (OneTrust, Didomi,
   * Cookiebot, Axeptio, tarteaucitron, Usercentrics, Quantcast, CookieYes, Complianz,
   * iubenda, Osano, TrustArc, Sourcepoint…) puis heuristique générique.
   */
  private async hideCookieBanners(page: Page): Promise<void> {
    const known = [
      '#onetrust-consent-sdk', '#onetrust-banner-sdk', '#didomi-host', '#didomi-notice', '#CybotCookiebotDialog',
      '#CybotCookiebotDialogBodyUnderlay', '#axeptio_overlay', '#axeptio_main_button', '#tarteaucitronRoot',
      '#usercentrics-root', '#usercentrics-cmp-ui', '.qc-cmp2-container', '#qc-cmp2-container', '.cky-consent-container',
      '.cky-overlay', '#cmplz-cookiebanner-container', '.cmplz-cookiebanner', '#iubenda-cs-banner', '.osano-cm-window',
      '#truste-consent-track', '#consent_blackbar', '[id^="sp_message_container"]', '.fc-consent-root', '#cookie-law-info-bar',
      '#cookie-notice', '#cookieConsent', '#cookie-banner', '.cookie-banner', '#cookie-consent', '.cookie-consent',
      '#gdpr-banner', '.gdpr-banner', '#CookieBanner', '.cc-window', '.cc-banner', '#hs-eu-cookie-confirmation',
    ];
    try {
      await page.addStyleTag({ content: `${known.join(',')}{display:none!important}` });
      await page.evaluate(() => {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        const words = /(cookie|consent|gdpr|rgpd|privacy|confidentialit)/i;
        document.querySelectorAll<HTMLElement>('div, section, aside, dialog, footer').forEach((el) => {
          const style = getComputedStyle(el);
          if (style.position !== 'fixed' && style.position !== 'sticky') return;
          const rect = el.getBoundingClientRect();
          if (rect.height < 40) return;
          const label = `${el.id} ${el.className} ${el.getAttribute('aria-label') || ''} ${el.innerText.slice(0, 300)}`;
          if (words.test(label)) el.style.setProperty('display', 'none', 'important');
        });
      });
    } catch {
      /* page sans corps ou script bloqué : on capture quand même */
    }
  }

  /** Masque les bulles de discussion, fenêtres surgissantes et boutons de partage. */
  private async hideChatsAndPopups(page: Page): Promise<void> {
    const selectors = [
      '#intercom-container', '.intercom-lightweight-app', '#crisp-chatbox', '.crisp-client', '#drift-widget',
      '#drift-frame-controller', '#hubspot-messages-iframe-container', '#launcher', '#webWidget', 'iframe[title*="chat" i]',
      '#tidio-chat', '#tawkchat-container', '.tawk-min-container', '#fc_frame', '.zsiq_floatmain', '#chat-widget-container',
      '#livechat-compact-container', '[class*="chat-widget"]', '.olark-launch-button', '#shopify-chat',
      '.addthis-smartlayers', '.a2a_kit', '.sharethis-sticky-share-buttons', '#at4-share', '.st-sticky-share-buttons',
    ];
    try {
      await page.addStyleTag({ content: `${selectors.join(',')}{display:none!important}` });
      await page.evaluate(() => {
        // Fenêtres modales qui couvrent la page (newsletter, promotion…)
        document.querySelectorAll<HTMLElement>('div, section, dialog').forEach((el) => {
          const style = getComputedStyle(el);
          if (style.position !== 'fixed') return;
          const r = el.getBoundingClientRect();
          const coversScreen = r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.9;
          const isModal = el.getAttribute('role') === 'dialog' || el.getAttribute('aria-modal') === 'true' || /modal|popup|overlay|newsletter/i.test(el.className.toString());
          if (coversScreen || isModal) el.style.setProperty('display', 'none', 'important');
        });
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      });
    } catch {
      /* rien à masquer */
    }
  }

  /** Fait défiler la page jusqu'en bas (images chargées au défilement), puis remonte. */
  private async scrollThrough(page: Page): Promise<void> {
    try {
      await page.evaluate(async () => {
        const step = Math.max(200, Math.floor(innerHeight * 0.8));
        const max = Math.min(document.documentElement.scrollHeight, 30000);
        for (let y = 0; y < max; y += step) {
          scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        scrollTo(0, 0);
      });
      await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
    } catch {
      /* défilement impossible : on capture quand même */
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
