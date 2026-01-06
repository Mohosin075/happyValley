import { Model, Types } from 'mongoose'
import { IUser } from '../user/user.interface'

export type IReview = {
  _id?: Types.ObjectId
  bookingId: Types.ObjectId | any
  title?: string
  reviewer: Types.ObjectId | IUser | any
  reviewee?: Types.ObjectId | IUser | any
  rating: number
  review: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  updatedAt: Date
}

export type ReviewModel = Model<IReview>
