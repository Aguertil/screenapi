import { prisma } from '@/lib/prisma';
import { SubscriptionPlan, SubscriptionStatus } from '@/lib/types';
import { getPlan } from '@/lib/plans';
import type {
  ISubscriptionRepository,
  SubscriptionData,
  InsufficientCreditsError,
} from '../application/interfaces/ISubscriptionRepository';

export class PrismaSubscriptionRepository implements ISubscriptionRepository {
  async findByUserId(userId: string): Promise<SubscriptionData | null> {
    try {
      let subscription = await prisma.subscription.findFirst({
        where: { userId, status: { notIn: ['CANCELED', 'EXPIRED'] } },
        orderBy: { createdAt: 'desc' },
      });

      if (!subscription) {
        return null;
      }

      // Quota mensuel : les abonnements payants sont remis à zéro par Stripe
      // (facture payée) ; le plan gratuit l'est ici, un mois après le début.
      if (!subscription.stripeSubscriptionId) {
        const next = new Date(subscription.periodStart);
        next.setMonth(next.getMonth() + 1);
        if (next <= new Date()) {
          const quota = getPlan(subscription.plan).screenshots;
          subscription = await prisma.subscription.update({
            where: { id: subscription.id },
            data: { periodStart: new Date(), creditsTotal: quota, creditsUsed: 0, creditsRemaining: quota },
          });
        }
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
      // Décrément atomique : ne passe que s'il reste assez de crédits
      const updated = await prisma.subscription.updateMany({
        where: { id: subscriptionId, creditsRemaining: { gte: amount } },
        data: { creditsUsed: { increment: amount }, creditsRemaining: { decrement: amount } },
      });
      if (updated.count === 0) {
        const current = await prisma.subscription.findUnique({ where: { id: subscriptionId }, select: { creditsRemaining: true } });
        const error: InsufficientCreditsError = {
          name: 'InsufficientCreditsError',
          message: `Insufficient credits: ${current?.creditsRemaining ?? 0} remaining, ${amount} required`,
          creditsRemaining: current?.creditsRemaining ?? 0,
          creditsRequired: amount,
        };
        throw error;
      }
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
