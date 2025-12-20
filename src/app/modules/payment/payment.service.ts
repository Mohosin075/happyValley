import { StatusCodes } from 'http-status-codes'
import Stripe from 'stripe'
import config from '../../../config'
import stripe from '../../../config/stripe'
import ApiError from '../../../errors/ApiError'
import { Booking } from '../booking/booking.model'
import { JwtPayload } from 'jsonwebtoken'
import { User } from '../user/user.model'
import { Payment } from './payment.model'

const createBookingCheckoutSession = async (
  userPayload: JwtPayload,
  bookingId: string,
) => {
  const user = await User.findById(userPayload.authId)
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')

  const booking = await Booking.findById(bookingId).populate('service')
  if (!booking) throw new ApiError(StatusCodes.NOT_FOUND, 'Booking not found')

  if (booking.price <= 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Booking has no price set. Admin must add a price first.',
    )
  }

  if (booking.paymentStatus === 'paid') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Booking is already paid')
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Service Payment: ${booking.serviceType.title}`,
            description: `Payment for booking on ${booking.date.toDateString()}`,
          },
          unit_amount: Math.round(booking.price * 100),
        },
        quantity: 1,
      },
    ],
    customer_email: user.email,
    success_url: `${config.stripe.paymentSuccess}/?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
    cancel_url: `${config.stripe.paymentSuccess}/payment-cancel`,
    metadata: {
      bookingId: booking._id.toString(),
      userId: user._id.toString(),
      type: 'booking_payment',
    },
  })

  if (!session.url) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to create Stripe session',
    )
  }

  return session.url
}

const fulfillBookingPayment = async (session: Stripe.Checkout.Session) => {
  const { bookingId } = session.metadata || {}
  if (!bookingId) {
    console.error('Missing bookingId in checkout session metadata:', session.id)
    return
  }

  const booking = await Booking.findById(bookingId)
  if (!booking) {
    console.error('Booking not found during fulfillment:', bookingId)
    return
  }

  // 1. Update Booking status
  await Booking.findByIdAndUpdate(bookingId, {
    paymentStatus: 'paid',
    paymentId: session.id,
    status: 'confirmed',
  })

  // 2. Record the Payment transaction
  await Payment.create({
    user: booking.user,
    booking: bookingId,
    amount: (session.amount_total || 0) / 100,
    transactionId: session.id,
    status: 'completed',
    paymentGateway: 'stripe',
  })

  console.log(`Booking ${bookingId} fulfilled and recorded via Payment module`)
}

export const PaymentService = {
  createBookingCheckoutSession,
  fulfillBookingPayment,
}
