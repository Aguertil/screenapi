import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { chromium } from 'playwright-core';
import {
  PrismaApiKeyRepository,
  PrismaSubscriptionRepository,
  RedisRateLimiter,
} from '@/core/screenshot/infrastructure';
import { UrlValidator } from '@/core/screenshot/domain/UrlValidator';
import { installNetworkGuard, isPublicUrl } from '@/core/screenshot/infrastructure/NetworkGuard';

const SCRAPE_CREDIT_COST = 1;

// One limiter per server instance (in-memory fallback when REDIS_URL is absent)
let rateLimiter: RedisRateLimiter | null = null;
function getRateLimiter(): RedisRateLimiter {
  if (!rateLimiter) rateLimiter = new RedisRateLimiter(process.env.REDIS_URL);
  return rateLimiter;
}

const scrapeRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
  extractMetadata: z.boolean().optional().default(true),
  extractText: z.boolean().optional().default(true),
  extractLinks: z.boolean().optional().default(false),
  extractImages: z.boolean().optional().default(false),
  selector: z.string().optional(),
  waitForSelector: z.string().optional(),
  waitForTimeout: z.number().min(0).max(60000).optional().default(5000),
});

type ScrapeRequest = z.infer<typeof scrapeRequestSchema>;

interface ScrapeResult {
  url: string;
  title?: string;
  metadata?: {
    description?: string;
    keywords?: string;
    author?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterCard?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
  };
  text?: string;
  links?: Array<{ text: string; href: string; }>;
  images?: Array<{ alt: string; src: string; }>;
  customData?: any;
  timestamp: string;
}

/**
 * POST /api/v1/scrape
 * Extract data from a webpage
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Extract API key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Missing API key',
          message: 'Please provide your API key in the x-api-key header',
          code: 'MISSING_API_KEY',
        },
        { status: 401 }
      );
    }

    // 2. Validate request
    let body: ScrapeRequest;
    try {
      const rawBody = await request.json();
      body = scrapeRequestSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation error',
            message: 'Invalid request parameters',
            code: 'VALIDATION_ERROR',
            details: error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // 3. Check the API key, rate limit and credits (same rules as /v1/screenshot)
    const apiKeys = new PrismaApiKeyRepository();
    const keyData = await apiKeys.findByKey(apiKey);
    if (!keyData || !keyData.isActive || (keyData.expiresAt && keyData.expiresAt < new Date())) {
      return NextResponse.json(
        { error: 'Invalid API key', message: 'The API key is invalid or inactive', code: 'INVALID_API_KEY' },
        { status: 401 }
      );
    }

    const limiter = getRateLimiter();
    const rate = await limiter.check(apiKey, keyData.rateLimit, 60);
    if (!rate.allowed) {
      const retryAfter = rate.retryAfter || 60;
      return NextResponse.json(
        { error: 'Rate limit exceeded', message: `Try again in ${retryAfter}s`, code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const subscriptions = new PrismaSubscriptionRepository();
    const subscription = await subscriptions.findByUserId(keyData.userId);
    if (!subscription || subscription.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'No active subscription', message: 'No active subscription found', code: 'NO_ACTIVE_SUBSCRIPTION' },
        { status: 402 }
      );
    }
    if (subscription.creditsRemaining < SCRAPE_CREDIT_COST) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          message: 'Insufficient credits',
          code: 'INSUFFICIENT_CREDITS',
          creditsRemaining: subscription.creditsRemaining,
          creditsRequired: SCRAPE_CREDIT_COST,
        },
        { status: 402 }
      );
    }

    // 4. SSRF protection (http/https only, no private network)
    const urlCheck = UrlValidator.validate(body.url);
    if (!urlCheck.success || !(await isPublicUrl(body.url))) {
      return NextResponse.json(
        { error: 'URL not allowed', message: 'Only public http(s) URLs are allowed', code: 'URL_NOT_ALLOWED' },
        { status: 400 }
      );
    }

    // 5. Launch browser and scrape
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      await installNetworkGuard(context);
      const page = await context.newPage();
      
      // Navigate to URL
      await page.goto(body.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Wait for specific selector if provided
      if (body.waitForSelector) {
        await page.waitForSelector(body.waitForSelector, {
          timeout: body.waitForTimeout,
        });
      } else if (body.waitForTimeout > 0) {
        await page.waitForTimeout(body.waitForTimeout);
      }

      const result: ScrapeResult = {
        url: body.url,
        timestamp: new Date().toISOString(),
      };

      // Extract title
      result.title = await page.title();

      // Extract metadata
      if (body.extractMetadata) {
        result.metadata = await page.evaluate(() => {
          const getMeta = (name: string) => {
            const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
            return el?.getAttribute('content') || undefined;
          };

          return {
            description: getMeta('description'),
            keywords: getMeta('keywords'),
            author: getMeta('author'),
            ogTitle: getMeta('og:title'),
            ogDescription: getMeta('og:description'),
            ogImage: getMeta('og:image'),
            twitterCard: getMeta('twitter:card'),
            twitterTitle: getMeta('twitter:title'),
            twitterDescription: getMeta('twitter:description'),
            twitterImage: getMeta('twitter:image'),
          };
        });
      }

      // Extract text content
      if (body.extractText) {
        if (body.selector) {
          // Extract from specific selector
          const element = await page.$(body.selector);
          if (element) {
            result.text = await element.textContent() || '';
          }
        } else {
          // Extract main content (body text, excluding scripts and styles)
          result.text = await page.evaluate(() => {
            const body = document.body;
            if (!body) return '';
            
            // Remove script and style tags
            const clone = body.cloneNode(true) as HTMLElement;
            clone.querySelectorAll('script, style, noscript').forEach(el => el.remove());
            
            return clone.innerText.trim();
          });
        }
      }

      // Extract links
      if (body.extractLinks) {
        result.links = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href]'));
          return links.map(link => ({
            text: link.textContent?.trim() || '',
            href: link.getAttribute('href') || '',
          })).filter(link => link.href);
        });
      }

      // Extract images
      if (body.extractImages) {
        result.images = await page.evaluate(() => {
          const images = Array.from(document.querySelectorAll('img[src]'));
          return images.map(img => ({
            alt: img.getAttribute('alt') || '',
            src: img.getAttribute('src') || '',
          })).filter(img => img.src);
        });
      }

      // Extract custom data from selector
      if (body.selector && !body.extractText) {
        const element = await page.$(body.selector);
        if (element) {
          result.customData = await page.evaluate((el) => {
            return {
              html: el.innerHTML,
              text: el.textContent,
              attributes: Array.from(el.attributes).reduce((acc, attr) => {
                acc[attr.name] = attr.value;
                return acc;
              }, {} as Record<string, string>),
            };
          }, element);
        }
      }

      await browser.close();

      // Billing: only successful scrapes cost credits
      await subscriptions.deductCredits(subscription.id, SCRAPE_CREDIT_COST);
      await limiter.increment(apiKey, 60);
      apiKeys.updateLastUsed(keyData.id).catch(() => {});

      return NextResponse.json({
        success: true,
        data: result,
        creditsRemaining: subscription.creditsRemaining - SCRAPE_CREDIT_COST,
      });

    } catch (error: any) {
      await browser.close();
      throw error;
    }

  } catch (error: any) {
    console.error('Scrape API error:', error);
    
    return NextResponse.json(
      {
        error: 'Scraping failed',
        message: error.message || 'An unexpected error occurred while scraping',
        code: 'SCRAPE_FAILED',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/scrape
 * Get API information
 */
export async function GET() {
  return NextResponse.json({
    service: 'ScreenAPI Web Scraping Service',
    version: '1.0.0',
    endpoint: 'POST /api/v1/scrape',
    features: [
      'Extract page title and metadata (Open Graph, Twitter Cards)',
      'Extract text content from entire page or specific selector',
      'Extract all links with their text',
      'Extract all images with alt text',
      'Custom selector support for targeted data extraction',
    ],
    documentation: '/docs#scraping',
    status: 'operational',
  });
}
