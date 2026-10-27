import { NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { randomBytes } from 'crypto';

/**
 * POST /api/admin/setup
 * Create a test user with API key and subscription
 * 
 * ⚠️ Development only - should be protected in production
 */
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    );
  }

  try {
    // Generate API key
    const apiKey = `sk_test_${randomBytes(32).toString('hex')}`;
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
      },
    });

    // Create API key
    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        userId: user.id,
        key: apiKey,
        name: 'Test API Key',
        isActive: true,
        rateLimit: 60,
      },
    });

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'PRO',
        status: 'ACTIVE',
        creditsTotal: 5000,
        creditsUsed: 0,
        creditsRemaining: 5000,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      apiKey: {
        key: apiKey,
        name: apiKeyRecord.name,
        rateLimit: apiKeyRecord.rateLimit,
      },
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        creditsTotal: subscription.creditsTotal,
        creditsRemaining: subscription.creditsRemaining,
      },
      usage: {
        curl: `curl -X POST http://localhost:43210/api/v1/screenshot \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}' \\
  --output screenshot.png`,
        javascript: `fetch('http://localhost:43210/api/v1/screenshot', {
  method: 'POST',
  headers: {
    'x-api-key': '${apiKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ url: 'https://example.com' })
})`,
      },
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      {
        error: 'Setup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/setup
 * List test users
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    );
  }

  try {
    const users = await prisma.user.findMany({
      include: {
        apiKeys: {
          where: { isActive: true },
          select: { key: true, name: true, rateLimit: true },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        apiKeys: user.apiKeys,
        subscription: user.subscriptions[0] || null,
      })),
    });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json(
      {
        error: 'Failed to list users',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
