import { Schema, model } from 'mongoose'
import { IReview, ReviewModel } from './review.interface'

const reviewSchema = new Schema<IReview, ReviewModel>(
  {
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      populate: {
        path: 'reviewer',
        select: 'name lastName fullName profile role',
      },
    },
    reviewee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      populate: {
        path: 'reviewee',
        select: 'name lastName fullName profile role',
      },
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

reviewSchema.index({ service: 1, status: 1 })

export const Review = model<IReview, ReviewModel>('Review', reviewSchema)
