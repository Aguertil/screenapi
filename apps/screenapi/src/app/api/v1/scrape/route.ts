import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { chromium } from 'playwright-core';

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

    // 3. Launch browser and scrape
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

      return NextResponse.json({
        success: true,
        data: result,
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
