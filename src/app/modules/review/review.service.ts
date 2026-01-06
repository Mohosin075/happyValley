import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IReview } from './review.interface'
import { Review } from './review.model'
import { JwtPayload } from 'jsonwebtoken'
import mongoose from 'mongoose'
import { User } from '../user/user.model'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { Booking } from '../booking/booking.model'
// import { redisClient } from '../../../helpers/redis';

const createReview = async (user: JwtPayload, payload: IReview) => {
  payload.reviewer = user.authId

  const isUserExist = await User.findById(user.authId)

  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  }

  const isBookingExist = await Booking.findById(payload.bookingId)

  if (!isBookingExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Booking not found')
  }


  const reviewData = { ...payload, reviewer: user.authId }

  const session = await mongoose.startSession()
  try {
    session.startTransaction()
    const result = await Review.create([reviewData], { session })
    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create Review, please try again later.',
      )
    }
    //now update the review count of the user
    await User.findByIdAndUpdate(
      payload.reviewee,
      [
        {
          $set: {
            totalReview: { $add: [{ $ifNull: ['$totalReview', 0] }, 1] },
            rating: {
              $divide: [
                {
                  $add: [
                    {
                      $multiply: [
                        { $ifNull: ['$rating', 0] },
                        { $ifNull: ['$totalReview', 0] },
                      ],
                    },
                    payload.rating,
                  ],
                },
                { $add: [{ $ifNull: ['$totalReview', 0] }, 1] },
              ],
            },
          },
        },
      ],
      { session, new: true },
    )

    await session.commitTransaction()
    return result[0]
  } catch (error) {
    console.log({ error })
    await session.abortTransaction()
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to create Review, please try again later.',
    )
  } finally {
    await session.endSession()
  }
}

const getAllReviews = async (
  paginationOptions: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions)

  const [result, total] = await Promise.all([
    Review.find({})
      .populate([
        { path: 'reviewer', select: 'name email profile' },
        { path: 'reviewee', select: 'name email profile' },
      ])
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate([
        // { path: 'userId', select: 'name email profile' },
        {
          path: 'bookingId',
          select: 'serviceType.title staff',
          populate: { path: 'staff', select: 'name profile' },
        },
      ]),
    Review.countDocuments({}),
  ])

  //cache the result
  // await redisClient.setex(cacheKey, JSON.stringify({ meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, data: result }), 60 * 3); // 2 minutes

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


const updateReview = async (
  user: JwtPayload,
  id: string,
  payload: Partial<IReview>,
) => {
  const session = await mongoose.startSession()
  try {
    session.startTransaction()

    const existingReview = await Review.findById(id).session(session)

    if (!existingReview) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'Review not found, please try again later.',
      )
    }
    if (existingReview?.reviewer.toString() !== user.authId) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'You are not authorized to update this review.',
      )
    }
    const oldRating = existingReview.rating
    const newRating = payload.rating ?? oldRating

    // Update user rating
    await User.findByIdAndUpdate(
      existingReview.reviewee,
      [
        {
          $set: {
            rating: {
              $cond: [
                { $eq: ['$totalReview', 0] },
                0,
                {
                  $divide: [
                    {
                      $add: [
                        {
                          $subtract: [
                            { $multiply: ['$rating', '$totalReview'] },
                            oldRating,
                          ],
                        },
                        newRating,
                      ],
                    },
                    '$totalReview',
                  ],
                },
              ],
            },
          },
        },
      ],
      { session, new: true },
    )

    // Update review document
    if (payload.rating !== undefined) existingReview.rating = newRating
    if (payload.review !== undefined) existingReview.review = payload.review

    await existingReview.save({ session })
    await session.commitTransaction()

    //clear the cache
    // await redisClient.del(`reviews:reviewer:${existingReview.reviewer}:*`);
    // await redisClient.del(`reviews:reviewee:${existingReview.reviewee}:*`);

    return 'Review updated successfully'
  } catch (error) {
    console.log({ error })
    await session.abortTransaction()
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Update review failed.',
    )
  } finally {
    await session.endSession()
  }
}

const deleteReview = async (id: string, user: JwtPayload) => {
  const session = await mongoose.startSession()
  try {
    session.startTransaction()

    const existingReview = await Review.findById(id).session(session)
    if (!existingReview) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'Review not found, please try again later.',
      )
    }

    if (existingReview.reviewer.toString() !== user.authId) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'You are not authorized to delete this review.',
      )
    }

    // Update reviewee's rating and totalReview
    await User.findByIdAndUpdate(
      existingReview.reviewee,
      [
        {
          $set: {
            totalReview: {
              $max: [{ $add: ['$totalReview', -1] }, 0], // avoid negative count
            },
            rating: {
              $cond: [
                { $lte: ['$totalReview', 1] }, // if after deletion totalReview will be 0 or less
                0,
                {
                  $divide: [
                    {
                      $subtract: [
                        { $multiply: ['$rating', '$totalReview'] },
                        existingReview.rating,
                      ],
                    },
                    { $add: ['$totalReview', -1] },
                  ],
                },
              ],
            },
          },
        },
      ],
      { session, new: true },
    )

    await existingReview.deleteOne({ session })

    await session.commitTransaction()
    //clear the cache
    // await redisClient.del(`reviews:reviewer:${user.authId}:*`);
    // await redisClient.del(`reviews:reviewee:${existingReview.reviewee}:*`);
    return 'Review deleted successfully'
  } catch (error) {
    console.error('Error deleting review:', error)
    await session.abortTransaction()
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Delete review failed.',
    )
  } finally {
    await session.endSession()
  }
}

const getSingleReview = async (id: string, user: JwtPayload) => {

  const review = await Review.findById(id)
  if (!review) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found')
  }

  return review

}


const updateReviewStatus = async (id: string, status: string) => {
  const review = await Review.findByIdAndUpdate(id, { status })
  if (!review) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found')
  }
  return review

}

export const ReviewServices = {
  createReview,
  getAllReviews,
  updateReview,
  deleteReview,
  getSingleReview,
  updateReviewStatus,
}
