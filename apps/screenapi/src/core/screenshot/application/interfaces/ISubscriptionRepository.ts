import { SubscriptionPlan, SubscriptionStatus } from '@repo/shared-types';

export interface SubscriptionData {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
}

export class InsufficientCreditsError extends Error {
  constructor(
    public readonly creditsRemaining: number,
    public readonly creditsRequired: number,
  ) {
    super(
      `Insufficient credits: ${creditsRemaining} remaining, ${creditsRequired} required`,
    );
    this.name = 'InsufficientCreditsError';
  }
}

export interface ISubscriptionRepository {
  /**
   * Find a subscription by user ID
   */
  findByUserId(userId: string): Promise<SubscriptionData | null>;

  /**
   * Deduct credits from a subscription
   * @throws InsufficientCreditsError if not enough credits
   */
  deductCredits(subscriptionId: string, amount: number): Promise<void>;

  /**
   * Check if a subscription has enough credits
   */
  hasEnoughCredits(subscriptionId: string, amount: number): Promise<boolean>;

  /**
   * Get remaining credits for a subscription
   */
  getRemainingCredits(subscriptionId: string): Promise<number>;
}
