import { prisma } from '@/lib/prisma';
import { SubscriptionPlan, SubscriptionStatus } from '@/lib/types';
import type {
  ISubscriptionRepository,
  SubscriptionData,
  InsufficientCreditsError,
} from '../application/interfaces/ISubscriptionRepository';

export class PrismaSubscriptionRepository implements ISubscriptionRepository {
  async findByUserId(userId: string): Promise<SubscriptionData | null> {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (!subscription) {
        return null;
      }

      return {
        id: subscription.id,
        userId: subscription.userId,
        plan: subscription.plan as SubscriptionPlan,
        status: subscription.status as SubscriptionStatus,
        creditsTotal: subscription.creditsTotal,
        creditsUsed: subscription.creditsUsed,
        creditsRemaining: subscription.creditsRemaining,
      };
    } catch (error) {
      console.error('Error finding subscription:', error);
      throw new Error('Failed to find subscription');
    }
  }

  async deductCredits(subscriptionId: string, amount: number): Promise<void> {
    try {
      // Use transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        const subscription = await tx.subscription.findUnique({
          where: { id: subscriptionId },
        });

        if (!subscription) {
          throw new Error('Subscription not found');
        }

        if (subscription.creditsRemaining < amount) {
          const error: InsufficientCreditsError = {
            name: 'InsufficientCreditsError',
            message: `Insufficient credits: ${subscription.creditsRemaining} remaining, ${amount} required`,
            creditsRemaining: subscription.creditsRemaining,
            creditsRequired: amount,
          };
          throw error;
        }

        await tx.subscription.update({
          where: { id: subscriptionId },
          data: {
            creditsUsed: { increment: amount },
            creditsRemaining: { decrement: amount },
          },
        });
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'creditsRemaining' in error) {
        throw error; // Re-throw InsufficientCreditsError
      }
      console.error('Error deducting credits:', error);
      throw new Error('Failed to deduct credits');
    }
  }

  async hasEnoughCredits(subscriptionId: string, amount: number): Promise<boolean> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        select: { creditsRemaining: true },
      });

      if (!subscription) {
        return false;
      }

      return subscription.creditsRemaining >= amount;
    } catch {
      return false;
    }
  }

  async getRemainingCredits(subscriptionId: string): Promise<number> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        select: { creditsRemaining: true },
      });

      return subscription?.creditsRemaining || 0;
    } catch {
      return 0;
    }
  }
}
