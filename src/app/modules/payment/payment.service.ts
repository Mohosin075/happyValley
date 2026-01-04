import { StatusCodes } from 'http-status-codes'
import Stripe from 'stripe'
import config from '../../../config'
import stripe from '../../../config/stripe'
import ApiError from '../../../errors/ApiError'
import { Booking } from '../booking/booking.model'
import { JwtPayload } from 'jsonwebtoken'
import { User } from '../user/user.model'
import { Payment } from './payment.model'
import { Invoice } from '../invoice/invoice.model'
import { NotificationServices } from '../notifications/notifications.service'
import {
  NOTIFICATION_MESSAGES,
  NOTIFICATION_TYPES,
} from '../notifications/notifications.constants'
import { IPaymentFilterables } from './payment.interface'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { paymentSearchableFields } from './payment.constants'


const getAllPayments = async (
  filterables: IPaymentFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions = []

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: paymentSearchableFields.map(field => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    })
  }

  // Filter functionality
  if (Object.keys(filterData).length) {
    andConditions.push({
      $and: Object.entries(filterData).map(([key, value]) => ({
        [key]: value,
      })),
    })
  }

  const whereConditions = andConditions.length ? { $and: andConditions } : {}

  const [result, total] = await Promise.all([
    Payment.find(whereConditions)
      .populate('user')
      .populate('booking')
      .populate('subscription')
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder }),
    Payment.countDocuments(whereConditions),
  ])

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result,
  }
}

const createSession = async (
  user: any,
  booking: any,
  type: 'booking_fee' | 'service_charge',
  amount: number,
) => {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${type.replace('_', ' ').toUpperCase()}: ${booking.serviceType.title}`,
            description: `Payment for booking on ${booking.date.toDateString()}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    customer_email: user.email,
    success_url: `${config.stripe.paymentSuccess}/?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking._id}`,
    cancel_url: `${config.stripe.paymentSuccess}/payment-cancel`,
    metadata: {
      bookingId: booking._id.toString(),
      userId: user._id.toString(),
      type: 'booking_payment',
      paymentType: type,
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

const createBookingFeeCheckoutSession = async (
  userPayload: JwtPayload,
  bookingId: string,
) => {
  const user = await User.findById(userPayload.authId)
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')

  const booking = await Booking.findById(bookingId)
  if (!booking) throw new ApiError(StatusCodes.NOT_FOUND, 'Booking not found')

  console.log(booking)

  if (booking.bookingFee <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Booking fee is not set')
  }

  if (booking.bookingFeeStatus === 'paid') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Booking fee is already paid')
  }

  return await createSession(user, booking, 'booking_fee', booking.bookingFee)
}

const createServiceChargeCheckoutSession = async (
  userPayload: JwtPayload,
  bookingId: string,
) => {
  const user = await User.findById(userPayload.authId)
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')

  const booking = await Booking.findById(bookingId)
  if (!booking) throw new ApiError(StatusCodes.NOT_FOUND, 'Booking not found')

  if (booking.serviceCharge <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Service charge is not set')
  }

  if (booking.serviceChargeStatus === 'paid') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Service charge is already paid',
    )
  }

  return await createSession(
    user,
    booking,
    'service_charge',
    booking.serviceCharge,
  )
}

const createInvoiceCheckoutSession = async (
  userPayload: JwtPayload,
  invoiceId: string,
) => {
  const user = await User.findById(userPayload.authId)
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')

  const invoice = await Invoice.findById(invoiceId)
  if (!invoice) throw new ApiError(StatusCodes.NOT_FOUND, 'Invoice not found')

  if (invoice.status === 'paid') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invoice is already paid')
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Invoice for ${invoice.month}`,
            description: `Payment for invoice ${invoice._id}`,
          },
          unit_amount: Math.round(invoice.totalAmount * 100),
        },
        quantity: 1,
      },
    ],
    customer_email: user.email,
    success_url: `${config.stripe.paymentSuccess}/?session_id={CHECKOUT_SESSION_ID}&invoice_id=${invoice._id}`,
    cancel_url: `${config.stripe.paymentSuccess}/payment-cancel`,
    metadata: {
      invoiceId: invoice._id.toString(),
      userId: user._id.toString(),
      type: 'invoice_payment',
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
  const { bookingId, invoiceId, paymentType, type } = session.metadata || {}

  // Handle Invoice Payment
  if (type === 'invoice_payment' && invoiceId) {
    const invoice = await Invoice.findById(invoiceId)
    if (!invoice) {
      console.error('Invoice not found during fulfillment:', invoiceId)
      return
    }

    // Update Invoice Status
    await Invoice.findByIdAndUpdate(invoiceId, {
      status: 'paid',
      paymentId: session.id,
    })

    // Update all associated bookings
    await Booking.updateMany(
      { _id: { $in: invoice.bookings } },
      {
        $set: {
          bookingFeeStatus: 'paid',
          serviceChargeStatus: 'paid',
          // status: 'completed' // They should already be completed to be on invoice
        },
      },
    )

    // Record Payment
    await Payment.create({
      user: invoice.user,
      amount: (session.amount_total || 0) / 100,
      paymentType: 'subscription', // Using 'subscription' or need new enum 'invoice'
      transactionId: session.id,
      status: 'completed',
      paymentGateway: 'stripe',
    })

    await NotificationServices.sendNotification({
      to: invoice.user as any,
      title: NOTIFICATION_TYPES.PAYMENT_RECEIVED,
      body: `Payment for invoice ${invoice.month} confirmed.`,
      type: NOTIFICATION_TYPES.PAYMENT_RECEIVED,
    })

    return
  }

  // Handle Booking Payment (original logic)
  if (!bookingId) {
    console.error('Missing bookingId in checkout session metadata:', session.id)
    return
  }

  const booking = await Booking.findById(bookingId)
  if (!booking) {
    console.error('Booking not found during fulfillment:', bookingId)
    return
  }

  const updateData: any = { paymentId: session.id }

  if (paymentType === 'booking_fee') {
    updateData.bookingFeeStatus = 'paid'
    updateData.status = 'scheduled' // Optionally move to scheduled when fee is paid
  } else if (paymentType === 'service_charge') {
    updateData.serviceChargeStatus = 'paid'
    updateData.status = 'confirmed' // Optionally move to confirmed when charge is paid
  }

  await Booking.findByIdAndUpdate(bookingId, updateData)

  // 2. Record the Payment transaction
  await Payment.create({
    user: booking.user,
    booking: bookingId,
    amount: (session.amount_total || 0) / 100,
    paymentType: paymentType as any,
    transactionId: session.id,
    status: 'completed',
    paymentGateway: 'stripe',
  })

  console.log(
    `Booking ${bookingId} (${paymentType}) fulfilled and recorded via Payment module`,
  )

  // 3. Send Notification
  await NotificationServices.sendNotification({
    to: booking.user as any,
    title: NOTIFICATION_TYPES.PAYMENT_RECEIVED,
    body: NOTIFICATION_MESSAGES.PAYMENT_CONFIRMED(
      paymentType || 'booking',
      (session.amount_total || 0) / 100,
    ),
    type: NOTIFICATION_TYPES.PAYMENT_RECEIVED,
  })
}

export const PaymentService = {
  createBookingFeeCheckoutSession,
  createServiceChargeCheckoutSession,
  createInvoiceCheckoutSession,
  fulfillBookingPayment,
  getAllPayments,
}
