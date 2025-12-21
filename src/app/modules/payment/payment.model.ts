import { model, Schema } from 'mongoose'
import { IPayment, PaymentModel } from './payment.interface'

const paymentSchema = new Schema<IPayment, PaymentModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentType: {
      type: String,
      enum: ['booking_fee', 'service_charge', 'subscription'],
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    paymentGateway: {
      type: String,
      enum: ['stripe'],
      default: 'stripe',
    },
  },
  {
    timestamps: true,
  },
)

export const Payment = model<IPayment, PaymentModel>('Payment', paymentSchema)
