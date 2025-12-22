import { Model, Types } from 'mongoose'
import { NOTIFICATION_TYPES } from './notifications.constants'

export type INotification = {
  _id: Types.ObjectId
  to: Types.ObjectId
  from?: Types.ObjectId
  title: string
  body: string
  type: keyof typeof NOTIFICATION_TYPES
  link?: string
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

export type NotificationModel = Model<INotification>
