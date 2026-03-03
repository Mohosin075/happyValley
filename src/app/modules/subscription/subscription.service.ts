import { JwtPayload } from 'jsonwebtoken'
import { ISubscription } from './subscription.interface'
import { Subscription } from './subscription.model'
import stripe from '../../../config/stripe'
import { User } from '../user/user.model'
import QueryBuilder from '../../builder/QueryBuilder'
import { IPlan } from '../plan/plan.interface'
import { createCheckoutSession } from '../../../stripe/checkOutSession'
// import checkUsage from './checkSubscription'

const subscriptionDetailsFromDB = async (
  user: JwtPayload,
): Promise<ISubscription | {}> => {
  const subscription = (await Subscription.findOne({ user: user.authId })
    .populate<{ plan: IPlan }>('plan', 'title price duration paymentType')
    .lean()) as ISubscription;


  if (!subscription) {
    return {} // Return empty object if no subscription found
  }

  // 🧩 If it's a free plan, skip Stripe check
  const isFreePlan =
    (subscription?.plan as IPlan)?.price === 0 || !subscription.subscriptionId

  if (isFreePlan) {
    return subscription
  }

  // Optimize: Trust the database if the subscription is active and not yet expired
  const isCurrentlyActive = 
    subscription.status === 'active' && 
    new Date(subscription.currentPeriodEnd) > new Date();

  if (isCurrentlyActive) {
    return subscription;
  }

  try {
    const subscriptionFromStripe = await stripe.subscriptions.retrieve(
      subscription.subscriptionId,
    )

    // Check subscription status and update database accordingly
    if (subscriptionFromStripe?.status !== 'active') {
      await Promise.all([
        User.findByIdAndUpdate(
          user.authId,
          { subscribe: false },
          { new: true },
        ),
        Subscription.findOneAndUpdate(
          { user: user.authId },
          { status: 'expired' },
          { new: true },
        ),
      ])
      // Update local subscription object to reflect change
      subscription.status = 'expired';
    } else {
      // If Stripe says it's active but our DB was outdated, update DB
      const updatedSub = await Subscription.findOneAndUpdate(
        { user: user.authId },
        { 
          status: 'active',
          currentPeriodStart: new Date((subscriptionFromStripe as any).current_period_start * 1000),
          currentPeriodEnd: new Date((subscriptionFromStripe as any).current_period_end * 1000)
        },
        { new: true }
      )
      .populate<{ plan: IPlan }>('plan', 'title price duration paymentType')
      .lean() as ISubscription;
      return updatedSub || subscription;
    }

    return subscription
  } catch (error: any) {
    console.error('Stripe subscription retrieval failed:', error.message)

    // If Stripe check fails, fallback to marking it as expired
    await Subscription.findOneAndUpdate(
      { user: user.authId },
      { status: 'expired' },
      { new: true },
    )
    subscription.status = 'expired';

    return subscription
  }
}

const subscriptionsFromDB = async (
  query: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const result = new QueryBuilder(Subscription.find(), query).paginate()
  const subscriptions = await result.modelQuery
    .populate([
      {
        path: 'plan',
        select: 'title price duration',
      },
      {
        path: 'user',
        select: 'name email profile',
      },
    ])
    .select('-createdAt -updatedAt -__v -customerId')
    .lean()
  const pagination = await result.getPaginationInfo()

  return { subscriptions, pagination }
}

export const SubscriptionService = {
  subscriptionDetailsFromDB,
  subscriptionsFromDB,
}
