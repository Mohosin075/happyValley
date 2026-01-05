import { Schema, model } from 'mongoose'
import { ISupport, SupportModel } from './support.interface'
import { SUPPORT_STATUS } from '../../../enum/support'

const supportSchema = new Schema<ISupport, SupportModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    subject: { type: String },
    message: { type: String },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    status: {
      type: String,
      enum: Object.values(SUPPORT_STATUS),
      default: SUPPORT_STATUS.IN_PROGRESS,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    attachments: { type: [String] },
  },
  {
    timestamps: true,
  },
)

export const Support = model<ISupport, SupportModel>('Support', supportSchema)
