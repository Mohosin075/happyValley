import { Schema, model } from 'mongoose'
import { IReview, ReviewModel } from './review.interface'

const reviewSchema = new Schema<IReview, ReviewModel>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    title: { type: String, required: true },
    rating: { type: Number, required: true },
    review: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
)

reviewSchema.index({ bookingId: 1, status: 1 })

export const Review = model<IReview, ReviewModel>('Review', reviewSchema)
