import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@repo/database';
import { randomBytes } from 'crypto';
import { z } from 'zod';

const createKeySchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

// GET /api/keys - List all API keys for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        apiKeys: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      keys: user.apiKeys.map((key) => ({
        id: key.id,
        name: key.name,
        key: key.key,
        isActive: key.isActive,
        rateLimit: key.rateLimit,
        lastUsedAt: key.lastUsedAt,
        createdAt: key.createdAt,
      })),
    });
  } catch (error) {
    console.error('List API keys error:', error);
    return NextResponse.json(
      { error: 'Failed to list API keys' },
      { status: 500 }
    );
  }
}

// POST /api/keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name } = createKeySchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { subscriptions: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get current subscription to determine rate limit
    const subscription = user.subscriptions.find((sub) => sub.status === 'ACTIVE');
    let rateLimit = 10; // FREE default

    if (subscription?.plan === 'PRO') {
      rateLimit = 100;
    } else if (subscription?.plan === 'ENTERPRISE') {
      rateLimit = 1000;
    }

    // Generate API key
    const apiKey = `sk_live_${randomBytes(32).toString('hex')}`;

    const newKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        key: apiKey,
        name,
        isActive: true,
        rateLimit,
      },
    });

    return NextResponse.json({
      success: true,
      key: {
        id: newKey.id,
        name: newKey.name,
        key: newKey.key,
        isActive: newKey.isActive,
        rateLimit: newKey.rateLimit,
        createdAt: newKey.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Create API key error:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}
