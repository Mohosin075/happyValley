import { StatusCodes } from 'http-status-codes'
import Stripe from 'stripe'
import { User } from '../app/modules/user/user.model'
import { Subscription } from '../app/modules/subscription/subscription.model'
import { Plan } from '../app/modules/plan/plan.model'
import stripe from '../config/stripe'
import ApiError from '../errors/ApiError'
import { Types } from 'mongoose'
import { ISubscription } from '../app/modules/subscription/subscription.interface'

// Helper function to create new subscription in database
export const createNewSubscription = async (payload: any) => {
  const isExistSubscription = await Subscription.findOne({
    user: payload.user,
  })
  if (isExistSubscription) {
    return await Subscription.findByIdAndUpdate(
      { _id: isExistSubscription._id },
      payload,
      { new: true },
    )
  } else {
    const newSubscription = new Subscription(payload)
    return await newSubscription.save()
  }
}

export const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session,
) => {
  try {
    const { userId, planId } = session.metadata || {}
    if (!userId || !planId) {
      console.error('Missing metadata in checkout session:', session.id)
      return
    }

    const plan = (await Plan.findById(planId)) as any
    if (!plan) {
      console.error('Plan not found for checkout session:', planId)
      return
    }

    const user = await User.findById(userId)
    if (!user) {
      console.error('User not found for checkout session:', userId)
      return
    }

    let subscriptionId = session.subscription as string
    let trxId = session.payment_intent as string

    // If it's a one-time payment, we might not have a subscriptionId
    const isOneTime = plan.paymentType === 'One Time'

    let currentPeriodStart = new Date()
    let currentPeriodEnd = new Date()

    if (!isOneTime && subscriptionId) {
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscriptionId,
      )
      currentPeriodStart = new Date(
        (stripeSubscription as any).current_period_start * 1000,
      )
      currentPeriodEnd = new Date(
        (stripeSubscription as any).current_period_end * 1000,
      )
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
    }

    const payload = {
      customerId: session.customer as string,
      price: (session.amount_total || 0) / 100,
      user: userId,
      plan: planId,
      trxId,
      subscriptionId: subscriptionId || `one_time_${session.id}`,
      status: 'active',
      currentPeriodStart,
      currentPeriodEnd,
    }

    await createNewSubscription(payload)

    await User.findByIdAndUpdate(userId, { subscribe: true })
    console.log(`Fulfillment completed for user: ${userId}, Plan: ${planId}`)
  } catch (error) {
    console.error('Error in handleCheckoutSessionCompleted:', error)
  }
}

export const handleSubscriptionCreated = async (data: Stripe.Subscription) => {
  // Use checkout.session.completed for initial creation. 
  // This handler can be used for subscription updates or logic that doesn't rely on checkout sessions.
  try {
    const subscriptionData = await stripe.subscriptions.retrieve(
      data.id as string,
    )

    console.log({subscriptionData})
    
    // Fallback lookup if needed, but prefer checkout session metadata for initial setup
    const customer = (await stripe.customers.retrieve(
      subscriptionData.customer as string,
    )) as Stripe.Customer

    const user = await User.findOne({ email: customer.email })
    if (!user) return

    const productId = subscriptionData.items.data[0]?.price?.product as string
    const plan = await Plan.findOne({ productId })
    if (!plan) return

    // console.log('Stripe Subscription Data Keys:', Object.keys(subscriptionData))

    const startTimestamp = (subscriptionData as any).current_period_start || (data as any).current_period_start
    const endTimestamp = (subscriptionData as any).current_period_end || (data as any).current_period_end

    console.log({ startTimestamp, endTimestamp })

    const currentPeriodStart = startTimestamp ? new Date(startTimestamp * 1000) : new Date()
    const currentPeriodEnd = endTimestamp ? new Date(endTimestamp * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    if (isNaN(currentPeriodStart.getTime()) || isNaN(currentPeriodEnd.getTime())) {
      console.error('Invalid date generated from timestamps, using fallbacks:', { startTimestamp, endTimestamp })
    }

    const payload = {
      customerId: customer.id,
      price: (subscriptionData as any).plan?.amount / 100 || 0,
      user: user._id,
      plan: plan._id,
      subscriptionId: subscriptionData.id,
      status: subscriptionData.status === 'active' ? 'active' : 'expired',
      currentPeriodStart,
      currentPeriodEnd,
    }
    console.log({ payload })

    await createNewSubscription(payload)
    if (payload.status === 'active') {
      await User.findByIdAndUpdate(user._id, { subscribe: true })
    }
  } catch (error) {
    console.error('Error in handleSubscriptionCreated:', error)
  }
}

export const handlePaymentFailed = async (invoice: Stripe.Invoice) => {
  try {
    const subscriptionId = (invoice as any).subscription as string
    if (!subscriptionId) return

    const subscription = await Subscription.findOne({ subscriptionId })

    if (subscription) {
      await Promise.all([
        Subscription.findByIdAndUpdate(subscription._id, { status: 'expired' }),
        User.findByIdAndUpdate(subscription.user, { subscribe: false }),
      ])
      console.log(`Payment failed for subscription: ${subscriptionId}. User deactivated.`)
    }
  } catch (error) {
    console.error('Error in handlePaymentFailed:', error)
  }
}

export const handlePaymentSucceeded = async (invoice: Stripe.Invoice) => {
  try {
    const subscriptionId = (invoice as any).subscription as string
    if (!subscriptionId) return

    const subscription = await Subscription.findOne({ subscriptionId })
    if (subscription) {
      // If it's a renewal, update the period dates
      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)

      const startTimestamp = (stripeSubscription as any).current_period_start
      const endTimestamp = (stripeSubscription as any).current_period_end

      if (!startTimestamp || !endTimestamp) {
        console.error('Missing period timestamps in Stripe subscription renewal:', subscriptionId)
        return
      }

      const currentPeriodStart = new Date(startTimestamp * 1000)
      const currentPeriodEnd = new Date(endTimestamp * 1000)

      console.log({currentPeriodStart, currentPeriodEnd})

      if (isNaN(currentPeriodStart.getTime()) || isNaN(currentPeriodEnd.getTime())) {
        console.error('Invalid date generated during renewal:', { startTimestamp, endTimestamp })
        return
      }
      
      await Subscription.findByIdAndUpdate(subscription._id, {
        status: 'active',
        currentPeriodStart,
        currentPeriodEnd,
      })

      await User.findByIdAndUpdate(subscription.user, { subscribe: true })
      console.log(`Payment succeeded for subscription: ${subscriptionId}. User activated/renewed.`)
    }
  } catch (error) {
    console.error('Error in handlePaymentSucceeded:', error)
  }
}

export const handleSubscriptionDeleted = async (data: Stripe.Subscription) => {
  try {
    const subscriptionId = data.id as string
    const subscription = await Subscription.findOne({ subscriptionId })

    if (subscription) {
      await Promise.all([
        Subscription.findByIdAndUpdate(subscription._id, { status: 'expired' }),
        User.findByIdAndUpdate(subscription.user, { subscribe: false }),
      ])
    }
  } catch (error) {
    console.error('Error in handleSubscriptionDeleted:', error)
  }
}
