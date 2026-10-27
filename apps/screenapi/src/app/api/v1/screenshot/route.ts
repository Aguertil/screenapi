import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createCaptureScreenshotUseCase } from '@/core/screenshot/infrastructure';

// Request validation schema
const screenshotRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
  format: z.enum(['PNG', 'JPEG', 'WEBP']).optional().default('PNG'),
  quality: z.number().min(1).max(100).optional(),
  viewportType: z.enum(['DESKTOP', 'MOBILE', 'TABLET', 'CUSTOM']).optional().default('DESKTOP'),
  viewportWidth: z.number().min(200).max(3840).optional(),
  viewportHeight: z.number().min(200).max(2160).optional(),
  fullPage: z.boolean().optional().default(false),
  waitForSelector: z.string().optional(),
  waitForTimeout: z.number().min(1000).max(60000).optional(),
  hideElements: z.array(z.string()).optional(),
  blockCookies: z.boolean().optional().default(true),
  blockAds: z.boolean().optional().default(false),
  userAgent: z.string().optional(),
});

type ScreenshotRequest = z.infer<typeof screenshotRequestSchema>;

/**
 * POST /api/v1/screenshot
 * Capture a screenshot with the given parameters
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Extract API key from header
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

    // 2. Parse and validate request body
    let body: ScreenshotRequest;
    try {
      const rawBody = await request.json();
      body = screenshotRequestSchema.parse(rawBody);
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

    // 3. Get client info
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgentHeader = request.headers.get('user-agent') || undefined;

    // 4. Execute use case
    const useCase = createCaptureScreenshotUseCase(process.env.REDIS_URL);
    
    const result = await useCase.execute({
      apiKey,
      url: body.url,
      format: body.format,
      quality: body.quality,
      viewportType: body.viewportType,
      viewportWidth: body.viewportWidth,
      viewportHeight: body.viewportHeight,
      fullPage: body.fullPage,
      waitForSelector: body.waitForSelector,
      waitForTimeout: body.waitForTimeout,
      hideElements: body.hideElements,
      blockCookies: body.blockCookies,
      blockAds: body.blockAds,
      userAgent: body.userAgent,
      ipAddress,
      userAgentHeader,
    });

    // 5. Handle errors
    if (!result.success) {
      const error = result.error;
      const errorCode = (error as any).code || 'UNKNOWN_ERROR';
      
      // Map error codes to HTTP status codes
      const statusCodes: Record<string, number> = {
        INVALID_API_KEY: 401,
        RATE_LIMIT_EXCEEDED: 429,
        INSUFFICIENT_CREDITS: 402,
        NO_ACTIVE_SUBSCRIPTION: 403,
        VALIDATION_ERROR: 400,
        INVALID_URL: 400,
        TIMEOUT: 504,
        NETWORK_ERROR: 502,
        CAPTURE_FAILED: 500,
      };

      const statusCode = statusCodes[errorCode] || 500;

      // Special handling for rate limit
      if (errorCode === 'RATE_LIMIT_EXCEEDED') {
        const rateLimitError = error as any;
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: error.message,
            code: errorCode,
            limit: rateLimitError.limit,
            resetAt: rateLimitError.resetAt,
          },
          {
            status: statusCode,
            headers: {
              'Retry-After': String(rateLimitError.retryAfter || 60),
              'X-RateLimit-Limit': String(rateLimitError.limit),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimitError.resetAt?.toISOString(),
            },
          }
        );
      }

      return NextResponse.json(
        {
          error: error.name || 'Screenshot capture failed',
          message: error.message,
          code: errorCode,
        },
        { status: statusCode }
      );
    }

    // 6. Return screenshot as binary
    const screenshot = result.value;
    const totalDuration = Date.now() - startTime;

    return new Response(new Uint8Array(screenshot.buffer), {
      status: 200,
      headers: {
        'Content-Type': `image/${body.format.toLowerCase()}`,
        'Content-Length': String(screenshot.fileSizeBytes),
        'X-Screenshot-Width': String(screenshot.width),
        'X-Screenshot-Height': String(screenshot.height),
        'X-Screenshot-Format': body.format,
        'X-Processing-Time-Ms': String(totalDuration),
        'X-Capture-Duration-Ms': String(screenshot.durationMs),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Screenshot API error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/screenshot
 * Get API information
 */
export async function GET() {
  return NextResponse.json({
    service: 'ScreenAPI Screenshot Service',
    version: '1.0.0',
    endpoint: 'POST /api/v1/screenshot',
    documentation: '/docs',
    status: 'operational',
  });
}
