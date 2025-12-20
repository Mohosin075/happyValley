import { StatusCodes } from 'http-status-codes'
import stripe from '../config/stripe'
import ApiError from '../errors/ApiError'
import Stripe from 'stripe'
import config from '../config'

export const updateStripeProductCatalog = async (
  productId: string,
  payload: any,
): Promise<any> => {
  // Map duration to interval
  let interval: 'month' | 'year' = 'month'
  let intervalCount = 1

  const isOneTime = payload.duration === 'One Time'

  if (!isOneTime) {
    switch (payload.duration) {
      case '1 month':
        interval = 'month'
        intervalCount = 1
        break
      case '3 months':
        interval = 'month'
        intervalCount = 3
        break
      case '6 months':
        interval = 'month'
        intervalCount = 6
        break
      case '1 year':
        interval = 'year'
        intervalCount = 1
        break
    }
  }

  // Step 0: Update product details in Stripe
  await stripe.products.update(productId, {
    name: payload.title,
    description: payload.description,
  })

  // Step 1: Deactivate old prices
  const oldPrices = await stripe.prices.list({
    product: productId,
    active: true,
  })
  for (const oldPrice of oldPrices.data) {
    await stripe.prices.update(oldPrice.id, { active: false })
  }

  // Step 2: Create new price
  const priceData: Stripe.PriceCreateParams = {
    product: productId,
    unit_amount: Math.round(Number(payload.price) * 100),
    currency: 'usd',
  }

  if (!isOneTime) {
    priceData.recurring = { interval, interval_count: intervalCount }
  }

  const price = await stripe.prices.create(priceData)
  if (!price)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to create new price in Stripe',
    )

  // Step 3: Create payment link
  let paymentLink
  try {
    paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      after_completion: {
        type: 'redirect',
        redirect: { url: config.clientUrl! },
      },
      metadata: { productId },
    })
  } catch (err) {
    console.error('Error creating payment link:', err)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to create new payment link',
    )
  }

  // Step 4: Build full updated plan object
  const updatedPlan = {
    title: payload.title,
    description: payload.description,
    priceId: price.id,
    price: payload.price,
    duration: payload.duration,
    paymentType:
      payload.paymentType || (interval === 'year' ? 'Yearly' : 'Monthly'),
    productId,
    paymentLink: paymentLink.url,
    status: 'active',
    _id: payload._id || undefined,
  }

  return updatedPlan
}
