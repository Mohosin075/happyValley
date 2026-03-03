import { StatusCodes } from 'http-status-codes'
import Stripe from 'stripe'
import { User } from '../app/modules/user/user.model'
import { Subscription } from '../app/modules/subscription/subscription.model'
import { Plan } from '../app/modules/plan/plan.model'
import stripe from '../config/stripe'
import ApiError from '../errors/ApiError'
import { Types } from 'mongoose'
import { ISubscription } from '../app/modules/subscription/subscription.interface'
import { Payment } from '../app/modules/payment/payment.model'
import { NotificationServices } from '../app/modules/notifications/notifications.service'
import {
  NOTIFICATION_MESSAGES,
  NOTIFICATION_TYPES,
} from '../app/modules/notifications/notifications.constants'

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

// Utility function to record payment in Payment model
export const createSubscriptionPayment = async (data: {
  user: string | Types.ObjectId
  subscription?: string | Types.ObjectId
  amount: number
  transactionId: string
}) => {
  try {
    const paymentData = {
      user: data.user,
      subscription: data.subscription,
      amount: data.amount,
      paymentType: 'subscription' as const,
      transactionId: data.transactionId,
      status: 'completed' as const,
      paymentGateway: 'stripe' as const,
    }


    console.log({paymentData})

    const result = await Payment.create(paymentData)
    console.log({result})
    console.log(`Payment record created for subscription: ${data.transactionId}`)
    return result
  } catch (error) {
    console.error(`Error creating payment record for subscription:`, error)
  }
}

export const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session,
) => {
  try {
    const { userId, planId } = session.metadata || {}
    console.log('Checkout Session Metadata:', { userId, planId })
    console.log('Checkout Session Object Keys:', Object.keys(session))
    console.log('Checkout Session ID:', session.id)
    console.log('Checkout Session Subscription:', session.subscription)
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

    const subscription = await createNewSubscription(payload)
    console.log('Subscription processed:', subscription?._id)

    // Record the Payment transaction
    console.log('Checking if payment should be recorded:', { price: payload.price })
    if (payload.price > 0) {
      console.log('Recording payment transaction for subscription:', subscriptionId)
      await createSubscriptionPayment({
        user: userId,
        subscription: subscription?._id,
        amount: payload.price,
        transactionId: session.id as string, // Consistent with direct payment logic
      })
    }

    await User.findByIdAndUpdate(userId, { subscribe: true })
    console.log(`Fulfillment completed for user: ${userId}, Plan: ${planId}`)

    // Send Notification
    await NotificationServices.sendNotification({
      to: userId as any,
      title: NOTIFICATION_TYPES.SUBSCRIPTION_ACTIVATED,
      body: NOTIFICATION_MESSAGES.SUBSCRIPTION_SUCCESS(plan.title),
      type: NOTIFICATION_TYPES.SUBSCRIPTION_ACTIVATED,
    })
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

    const subscription = await createNewSubscription(payload)

    // Record the Payment transaction if it's active and has a price
    if (payload.status === 'active' && payload.price > 0) {
      await createSubscriptionPayment({
        user: user._id,
        subscription: subscription?._id, // Use the internal DB _id
        amount: payload.price,
        transactionId: `sub_created_${subscriptionData.id}`,
      })
    }

    if (payload.status === 'active') {
      await User.findByIdAndUpdate(user._id, { subscribe: true })

      // Send Notification
      await NotificationServices.sendNotification({
        to: user._id as any,
        title: NOTIFICATION_TYPES.SUBSCRIPTION_ACTIVATED,
        body: NOTIFICATION_MESSAGES.SUBSCRIPTION_SUCCESS(plan.title),
        type: NOTIFICATION_TYPES.SUBSCRIPTION_ACTIVATED,
      })
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

      // Send Notification
      await NotificationServices.sendNotification({
        to: subscription.user as any,
        title: 'Subscription Payment Failed',
        body: NOTIFICATION_MESSAGES.SUBSCRIPTION_FAILED,
        type: NOTIFICATION_TYPES.SYSTEM,
      })
    }
  } catch (error) {
    console.error('Error in handlePaymentFailed:', error)
  }
}

export const handlePaymentSucceeded = async (invoice: Stripe.Invoice) => {
  try {
    const subscriptionId = (invoice as any).subscription as string
    console.log('Invoice Payment Succeeded Data:', {
      subscriptionId,
      invoiceId: invoice.id,
      paymentIntent: (invoice as any).payment_intent,
      customer: invoice.customer,
      amount: invoice.amount_paid,
      metadata: invoice.metadata
    })
    
    if (!subscriptionId) {
      console.log('SubscriptionId is missing in invoice, checking lines...')
      const lineSubscription = invoice.lines?.data?.find(line => line.subscription)?.subscription
      console.log('SubscriptionId from lines:', lineSubscription)
    }

    let subscription = await Subscription.findOne({ subscriptionId: subscriptionId || { $ne: null } })
    
    if (!subscription && invoice.customer) {
      console.log('Subscription not found by ID, searching by customerId:', invoice.customer)
      // Look for the most recent active or recently created subscription for this customer
      subscription = await Subscription.findOne({ 
        customerId: invoice.customer as string 
      }).sort({ createdAt: -1 })
    }

    console.log('Subscription found in DB:', subscription?._id)
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


      if (isNaN(currentPeriodStart.getTime()) || isNaN(currentPeriodEnd.getTime())) {
        console.error('Invalid date generated during renewal:', { startTimestamp, endTimestamp })
        return
      }
      
      await Subscription.findByIdAndUpdate(subscription._id, {
        status: 'active',
        currentPeriodStart,
        currentPeriodEnd,
        'usage.session': 0, // Reset usage for new period
        lastReset: new Date(),
      })

      // Record the Payment transaction for renewal
      console.log('Checking renewal payment:', { amount_paid: invoice.amount_paid })
      if (invoice.amount_paid > 0) {
        console.log('Recording payment transaction for renewal: 11111111', subscriptionId)
        await createSubscriptionPayment({
          user: subscription.user,
          subscription: subscription._id,
          amount: (invoice.amount_paid || 0) / 100,
          transactionId: ((invoice as any).payment_intent || invoice.id) as string,
        })
      }

      await User.findByIdAndUpdate(subscription.user, { subscribe: true })
      console.log(`Payment succeeded for subscription: ${subscriptionId}. User activated/renewed.`)

      // Send Notification
      const plan = await Plan.findById(subscription.plan)
      await NotificationServices.sendNotification({
        to: subscription.user as any,
        title: NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED,
        body: NOTIFICATION_MESSAGES.SUBSCRIPTION_RENEWAL(plan?.title || 'Plan'),
        type: NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED,
      })
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
