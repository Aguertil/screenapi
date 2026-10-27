import { NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { PlaywrightScreenshotService } from '@/core/screenshot/infrastructure/PlaywrightScreenshotService';

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error'; message?: string }> = {};

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok' };
  } catch (error) {
    checks.database = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
  }

  // Check Playwright
  try {
    const screenshotService = new PlaywrightScreenshotService();
    const healthy = await screenshotService.healthCheck();
    checks.playwright = healthy ? { status: 'ok' } : { status: 'error', message: 'Browser not ready' };
    await screenshotService.cleanup();
  } catch (error) {
    checks.playwright = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Playwright check failed',
    };
  }

  // Check Redis (optional)
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    checks.redis = { status: 'ok', message: 'Configured' };
  } else {
    checks.redis = { status: 'ok', message: 'Using in-memory fallback' };
  }

  // Overall status
  const allOk = Object.values(checks).every((check) => check.status === 'ok');
  const status = allOk ? 'healthy' : 'degraded';
  const statusCode = allOk ? 200 : 503;

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: statusCode }
  );
}
