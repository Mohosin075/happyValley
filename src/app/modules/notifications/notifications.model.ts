import { Schema, model } from 'mongoose'
import { INotification, NotificationModel } from './notifications.interface'
import { NOTIFICATION_TYPES } from './notifications.constants'

const notificationSchema = new Schema<INotification, NotificationModel>(
  {
    to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    from: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      default: NOTIFICATION_TYPES.SYSTEM,
    },
    link: { type: String },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

export const Notification = model<INotification, NotificationModel>(
  'Notification',
  notificationSchema,
)
