import { model, Schema } from 'mongoose'
import { ISubscription, SubscriptionModel } from './subscription.interface'

const subscriptionSchema = new Schema<ISubscription, SubscriptionModel>(
  {
    customerId: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },

    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    trxId: {
      type: String,
      required: false,
    },
    subscriptionId: {
      type: String,
    },
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },

    // Track usage against plan limits
    usage: {
      session: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['expired', 'active', 'cancel'],
      default: 'active',
      required: true,
    },
    lastReset: {
      type: Date,
      default: Date.now,
    },
  },

  {
    timestamps: true,
  },
)

subscriptionSchema.index({ user: 1, status: 1, currentPeriodEnd: 1 })
subscriptionSchema.index({ subscriptionId: 1 })

export const Subscription = model<ISubscription, SubscriptionModel>(
  'Subscription',
  subscriptionSchema,
)
