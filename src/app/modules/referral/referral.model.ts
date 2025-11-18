import { Schema, model } from 'mongoose'
import { IReferral, ReferralModel } from './referral.interface'

const referralSchema = new Schema<IReferral, ReferralModel>(
  {
    yourName: { type: String },
    referralName: { type: String },
    referralEmail: { type: String, required: true },
    referralPhone: { type: String },
    notes: { type: String },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
)

referralSchema.index({ referralEmail: 1, referredBy: 1 }, { unique: true })

export const Referral = model<IReferral, ReferralModel>(
  'Referral',
  referralSchema,
)
