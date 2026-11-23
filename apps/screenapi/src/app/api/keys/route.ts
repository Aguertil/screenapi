import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateApiKey } from '@/lib/apiKeys';
import { getPlan } from '@/lib/plans';
import { generateSigningSecret } from '@/lib/signing';
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

    // Clés créées avant les URL signées : leur donner un secret
    for (const k of user.apiKeys.filter((k) => !k.signingSecret)) {
      k.signingSecret = generateSigningSecret();
      await prisma.apiKey.update({ where: { id: k.id }, data: { signingSecret: k.signingSecret } });
    }

    return NextResponse.json({
      success: true,
      keys: user.apiKeys.map((key) => ({
        id: key.id,
        name: key.name,
        key: `${key.prefix || 'sk_live_'}…`,
        signingSecret: key.signingSecret,
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

    // Limite de débit selon le plan
    const subscription = user.subscriptions.find((sub) => sub.status === 'ACTIVE');
    const rateLimit = getPlan(subscription?.plan).ratePerMinute;

    // Clé générée ici, stockée sous forme d'empreinte seulement
    const generated = generateApiKey();

    const newKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        key: generated.hash,
        prefix: generated.prefix,
        signingSecret: generateSigningSecret(),
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
        key: generated.key, // montrée une seule fois
        signingSecret: newKey.signingSecret,
        isActive: newKey.isActive,
        rateLimit: newKey.rateLimit,
        createdAt: newKey.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
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
