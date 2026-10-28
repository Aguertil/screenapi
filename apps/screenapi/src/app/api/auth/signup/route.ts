import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@repo/database';
import { sendWelcomeEmail } from '@/lib/email';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    // Create FREE subscription
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'FREE',
        status: 'ACTIVE',
        creditsTotal: 100,
        creditsUsed: 0,
        creditsRemaining: 100,
      },
    });

    // Create default API key
    const crypto = await import('crypto');
    const apiKey = `sk_live_${crypto.randomBytes(32).toString('hex')}`;

    await prisma.apiKey.create({
      data: {
        userId: user.id,
        key: apiKey,
        name: 'Default API Key',
        isActive: true,
        rateLimit: 10,
      },
    });

    // Send welcome email
    sendWelcomeEmail(user.email, user.name || 'User').catch((err) =>
      console.error('Failed to send welcome email:', err)
    );

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
