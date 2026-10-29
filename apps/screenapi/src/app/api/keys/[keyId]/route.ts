import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateKeySchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

// PATCH /api/keys/[keyId] - Update API key
export async function PATCH(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
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
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify the key belongs to the user
    const existingKey = await prisma.apiKey.findUnique({
      where: { id: params.keyId },
    });

    if (!existingKey || existingKey.userId !== user.id) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = updateKeySchema.parse(body);

    const updatedKey = await prisma.apiKey.update({
      where: { id: params.keyId },
      data,
    });

    return NextResponse.json({
      success: true,
      key: {
        id: updatedKey.id,
        name: updatedKey.name,
        key: updatedKey.key,
        isActive: updatedKey.isActive,
        rateLimit: updatedKey.rateLimit,
        lastUsedAt: updatedKey.lastUsedAt,
        createdAt: updatedKey.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Update API key error:', error);
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}

// DELETE /api/keys/[keyId] - Delete API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
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
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify the key belongs to the user
    const existingKey = await prisma.apiKey.findUnique({
      where: { id: params.keyId },
    });

    if (!existingKey || existingKey.userId !== user.id) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    await prisma.apiKey.delete({
      where: { id: params.keyId },
    });

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error) {
    console.error('Delete API key error:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
