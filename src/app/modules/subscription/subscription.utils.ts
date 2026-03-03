import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { Subscription } from './subscription.model';
import { IPlan } from '../plan/plan.interface';

/**
 * Checks if a user has an active subscription and has not exceeded their plan's session limit.
 * @param userId - The ID of the user to check.
 * @returns The active subscription if valid.
 * @throws ApiError if no active subscription or limit reached.
 */
export const checkSubscriptionUsage = async (userId: string) => {
  const subscription = await Subscription.findOne({ 
    user: userId, 
    status: 'active' 
  }).populate<{ plan: IPlan }>('plan');

  if (!subscription) {
    throw new ApiError(
      StatusCodes.PAYMENT_REQUIRED,
      'Active subscription required to access this resource'
    );
  }

  const { plan, usage } = subscription;

  if (plan && plan.limits && plan.limits.session > 0) {
    if (usage.session >= plan.limits.session) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        `You have reached your monthly limit of ${plan.limits.session} sessions. Please upgrade your plan.`
      );
    }
  }

  return subscription;
};

/**
 * Increments the session usage for a user's active subscription.
 * @param userId - The ID of the user.
 */
export const incrementSubscriptionUsage = async (userId: string) => {
  await Subscription.findOneAndUpdate(
    { user: userId, status: 'active' },
    { $inc: { 'usage.session': 1 } }
  );
};
