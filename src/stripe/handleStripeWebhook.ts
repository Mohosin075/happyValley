import { NextFunction, Request, Response } from 'express'
import Stripe from 'stripe'
import colors from 'colors'
import { StatusCodes } from 'http-status-codes'
import { logger } from '../shared/logger'
import config from '../config'
import {
  handleSubscriptionCreated,
  handleSubscriptionDeleted,
  handlePaymentFailed,
  handlePaymentSucceeded,
  handleCheckoutSessionCompleted,
} from './handleSubscriptionCreated'
import stripe from '../config/stripe'
import ApiError from '../errors/ApiError'

const handleStripeWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Extract Stripe signature and webhook secret
  const signature = req.headers['stripe-signature'] as string
  const webhookSecret = config.stripe.webhookSecret as string

  let event: Stripe.Event | undefined

  // Verify the event signature
  try {
    // Log body type to debug signature issues
    // console.log('Is req.body a Buffer?', Buffer.isBuffer(req.body))

    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      signature,
      webhookSecret,
    )
  } catch (error) {
    return next(
      new ApiError(
        StatusCodes.BAD_REQUEST,
        `Webhook signature verification failed. ${error}`,
      ),
    )
  }

  // Check if the event is valid
  if (!event) {
    return next(
      new ApiError(StatusCodes.BAD_REQUEST, 'Invalid event received!'),
    )
  }

  // Extract event data and type
  const eventType = event.type
  const data = event.data.object

  // Handle the event based on its type
  console.log(eventType)
  try {
    switch (eventType) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(data as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionCreated(data as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(data as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(data as unknown as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(data as unknown as Stripe.Invoice)
        break

      default:
        logger.warn(colors.bgGreen.bold(`Unhandled event type: ${eventType}`))
    }
  } catch (error) {
    return next(
      new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Error handling event: ${error}`,
      ),
    )
  }

  res.sendStatus(200)
}

export default handleStripeWebhook
