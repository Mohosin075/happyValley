import mongoose, { PipelineStage } from 'mongoose'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IUser, IUserFilterables } from './user.interface'
import { User } from './user.model'

import { USER_ROLES, USER_STATUS } from '../../../enum/user'

import { JwtPayload } from 'jsonwebtoken'
import { logger } from '../../../shared/logger'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { S3Helper } from '../../../helpers/image/s3helper'
import config from '../../../config'
import { userFilterableFields, userSearchableFields } from './user.constants'
import {
  emailTemplate,
  staffCreateTemplate,
} from '../../../shared/emailTemplate'
import { emailHelper } from '../../../helpers/emailHelper'
import { Service } from '../service/service.model'
import { SERVICE_STATUS } from '../../../enum/service'
import { Review } from '../review/review.model'
import { Booking } from '../booking/booking.model'

const updateProfile = async (user: JwtPayload, payload: Partial<IUser>) => {
  const isUserExist = await User.findOne({
    _id: user.authId,
    status: { $nin: [USER_STATUS.DELETED] },
  })

  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }


  const updatedProfile = await User.findOneAndUpdate(
    { _id: user.authId, status: { $nin: [USER_STATUS.DELETED] } },
    {
      $set: payload,
    },
    { new: true },
  )

  if (!updatedProfile) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update profile.')
  }

  if (payload.services) {
    payload.services.forEach(async serviceId => {
      await Service.findByIdAndUpdate(serviceId, {
        $addToSet: { staff: updatedProfile._id },
      })
    })
  }

  return 'Profile updated successfully.'
}

const createAdmin = async (): Promise<Partial<IUser> | null> => {
  const admin = {
    email: config.super_admin.email,
    name: config.super_admin.name,
    password: config.super_admin.password,
    role: USER_ROLES.ADMIN,
    status: USER_STATUS.ACTIVE,
    verified: true,
    authentication: {
      oneTimeCode: null,
      restrictionLeftAt: null,
      expiresAt: null,
      latestRequestAt: new Date(),
      authType: 'createAccount',
    },
  }

  const isAdminExist = await User.findOne({
    email: admin.email,
    status: { $nin: [USER_STATUS.DELETED] },
  })

  if (isAdminExist) {
    logger.log('info', 'Admin account already exist, skipping creation.🦥')
    return isAdminExist
  }
  const result = await User.create(admin)
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create admin')
  }
  return result
}

const createStaff = async (
  user: JwtPayload,
  payload: IUser,
): Promise<Partial<IUser>> => {
  const session = await mongoose.startSession()

  try {
    session.startTransaction()

    const tempPassword = Math.floor(
      10000000 + Math.random() * 90000000,
    ).toString()

    // 1️⃣ Create staff
    const [result] = await User.create(
      [
        {
          ...payload,
          password: tempPassword,
          verified: true,
          role: USER_ROLES.STAFF,
          createdBy: user.authId,
        },
      ],
      { session },
    )

    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create staff. Please try again.',
      )
    }


    // 2️⃣ Link services (optional)
    if (payload.services?.length) {
      await Promise.all(
        payload.services.map(async serviceId => {
          const updatedService = await Service.findByIdAndUpdate(
            serviceId,
            { $addToSet: { staff: result._id } },
            { new: true, runValidators: true, session },
          )

          if (!updatedService) {
            throw new ApiError(
              StatusCodes.NOT_FOUND,
              `Service with ID ${serviceId} not found`,
            )
          }
        }),
      )
    }

    // 3️⃣ Commit transaction
    await session.commitTransaction()
    session.endSession()

    logger.info('Staff created with transactional integrity', {
      staffId: result._id,
      services: payload.services ?? [],
      createdBy: user.authId,
    })

    // 4️⃣ Send email (OUTSIDE transaction)
    if (result.email) {
      const emailContent = staffCreateTemplate({
        email: result.email,
        name: result.name as string,
        role: USER_ROLES.STAFF,
        otp: tempPassword,
      })

      // non-blocking failure is acceptable
      emailHelper.sendEmail(emailContent).catch(err => {
        logger.error('Staff email failed', { err, staffId: result._id })
      })
    }

    return result
  } catch (error: any) {
    await session.abortTransaction()
    session.endSession()

    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found')
    }

    throw error
  }
}

const getAllUsers = async (
  paginationOptions: IPaginationOptions,
  filterables: IUserFilterables = {},
) => {
  const { searchTerm, ...otherFilters } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions)

  const matchConditions: any[] = []

  // 🔍 Search
  if (searchTerm) {
    matchConditions.push({
      $or: userSearchableFields.map(field => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    })
  }

  // 🎯 Filters
  for (const [key, value] of Object.entries(otherFilters)) {
    matchConditions.push({ [key]: value })
  }

  // 🛑 Exclude deleted users
  matchConditions.push({
    status: { $nin: [USER_STATUS.DELETED, null] },
  })

  const matchStage = matchConditions.length ? { $and: matchConditions } : {}

  const pipeline: PipelineStage[] = [
    { $match: matchStage },

    // 🔗 Join completed bookings (USER → bookings)
    {
      $lookup: {
        from: 'bookings',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$user', '$$userId'] },
                  { $eq: ['$status', 'completed'] },
                ],
              },
            },
          },
          {
            $project: { price: 1 },
          },
        ],
        as: 'completedBookings',
      },
    },

    // 🧮 Metrics
    {
      $addFields: {
        completedServiceCount: { $size: '$completedBookings' },
        totalSpent: {
          $sum: '$completedBookings.price',
        },
      },
    },

    // 🚫 Cleanup
    {
      $project: {
        password: 0,
        authentication: 0,
        __v: 0,
        completedBookings: 0,
      },
    },

    // 📊 Sorting
    {
      $sort: sortBy
        ? { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
        : { createdAt: -1 },
    },

    // 📄 Pagination
    { $skip: skip },
    { $limit: limit },
  ]

  const [data, totalResult] = await Promise.all([
    User.aggregate(pipeline),
    User.countDocuments(matchStage),
  ])

  return {
    meta: {
      page,
      limit,
      total: totalResult,
      totalPages: Math.ceil(totalResult / limit),
    },
    data,
  }
}

const deleteUser = async (userId: string): Promise<string> => {
  const isUserExist = await User.findOne({
    _id: userId,
    status: { $nin: [USER_STATUS.DELETED] },
  })
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }

  const deletedUser = await User.findOneAndUpdate(
    { _id: userId, status: { $nin: [USER_STATUS.DELETED] } },
    { $set: { status: USER_STATUS.DELETED } },
    { new: true },
  )

  if (!deletedUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete user.')
  }

  return 'User deleted successfully.'
}

const deleteProfile = async (
  userId: string,
  password: string,
): Promise<string> => {
  const isUserExist = await User.findOne({
    _id: userId,
    status: { $nin: [USER_STATUS.DELETED] },
  }).select('+password')
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }
  const isPasswordMatched = await User.isPasswordMatched(
    password,
    isUserExist.password,
  )

  if (!isPasswordMatched) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Password is incorrect.')
  }

  const deletedUser = await User.findOneAndUpdate(
    { _id: userId, status: { $nin: [USER_STATUS.DELETED] } },
    { $set: { status: USER_STATUS.DELETED } },
    { new: true },
  )

  if (!deletedUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete user.')
  }

  return 'User deleted successfully.'
}

const getUserById = async (userId: string): Promise<IUser | null> => {
  const isUserExist = await User.findOne({
    _id: userId,
    status: { $nin: [USER_STATUS.DELETED] },
  })
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }
  const user = await User.findOne({
    _id: userId,
    status: { $nin: [USER_STATUS.DELETED] },
  }).select('-password -authentication -__v')
  return user
}

const updateUser = async (userId: string, payload: Partial<IUser>) => {
  const isUserExist = await User.findOne({
    _id: userId,
    status: { $nin: [USER_STATUS.DELETED] },
  })
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }

  const session = await mongoose.startSession()
  try {
    session.startTransaction()

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, status: { $nin: [USER_STATUS.DELETED] } },
      { $set: payload },
      { new: true, session },
    )

    if (!updatedUser) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update user.')
    }

    // Update Service model if services are changed
    if (payload.services) {
      // 1. Remove this staff from all services they were previously assigned to
      await Service.updateMany(
        { staff: userId },
        { $pull: { staff: userId } },
        { session },
      )

      // 2. Add this staff to the new list of services
      if (payload.services.length > 0) {
        await Service.updateMany(
          { _id: { $in: payload.services } },
          { $addToSet: { staff: userId } },
          { session },
        )
      }
    }

    await session.commitTransaction()
    session.endSession()
    return updatedUser
  } catch (error) {
    await session.abortTransaction()
    session.endSession()
    throw error
  }
}

const updateAvailability = async (user: JwtPayload, isAvailable: boolean) => {
  const isUserExist = await User.findOne({
    _id: user.authId,
    status: { $nin: [USER_STATUS.DELETED] },
  })

  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: user.authId, status: { $nin: [USER_STATUS.DELETED] } },
    { $set: { isAvailable } },
    { new: true },
  ).select('isAvailable')

  if (!updatedUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update availability.')
  }

  return updatedUser
}

export const getProfile = async (user: JwtPayload) => {
  // --- Fetch user ---
  const isUserExist = await User.findOne({
    _id: user.authId,
    status: { $nin: [USER_STATUS.DELETED] },
  }).select('-authentication -password -__v').populate({ path: 'services', select: 'name' })

  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }

  // Convert to object to add custom fields
  const profileData = isUserExist.toObject()

  // --- Add statistics if user is STAFF ---
  if (isUserExist.role === USER_ROLES.STAFF) {
    const [ratings, completed] = await Promise.all([
      // ⭐ Staff Average Rating
      Review.aggregate([
        { $match: { reviewee: isUserExist._id, status: 'approved' } },
        {
          $group: {
            _id: '$reviewee',
            avgRating: { $avg: '$rating' },
          },
        },
      ]),

      // ✅ Completed Services Count
      Booking.countDocuments({
        staff: isUserExist._id,
        status: 'completed',
      }),
    ])

    profileData.avgRating = ratings.length > 0 ? ratings[0].avgRating : 0
    profileData.completedServiceCount = completed
  }

  return profileData
}

const getAllStaff = async (
  paginationOptions: IPaginationOptions,
  filterables: IUserFilterables = {}, // safe default
) => {
  console.log('hit')
  const { searchTerm, ...otherFilters } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions)

  const andConditions: any[] = []

  andConditions.push({ role: USER_ROLES.STAFF })

  // 🔍 Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: userSearchableFields.map(field => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    })
  }

  // 🎯 Dynamic filters (role, verified, isAvailable, etc.)
  if (Object.keys(otherFilters).length) {
    for (const [key, value] of Object.entries(otherFilters)) {
      andConditions.push({ [key]: value })
    }
  } else {
    // Default to available staff if no specific filter provided (optional: might want to show all for admin)
    // but usually for public/client views we only want available staff.
    // For now, let's just make it possible to filter.
  }

  // 🛑 Always exclude deleted users
  andConditions.push({
    status: { $nin: [USER_STATUS.DELETED, null] },
  })

  // 💡 Final query object
  const whereConditions = andConditions.length ? { $and: andConditions } : {}

  const [result, total] = await Promise.all([
    User.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort(sortBy ? { [sortBy]: sortOrder } : { createdAt: -1 })
      .select('-password -authentication -__v').populate({path: 'services', select: 'name'}),

    User.countDocuments(whereConditions),
  ])

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

const getStaffById = async (userId: string): Promise<IUser | null> => {
  console.log(userId)
  const isUserExist = await User.findOne({
    _id: userId,
    status: { $nin: [USER_STATUS.DELETED] },
  })
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }
  const user = await User.findOne({
    _id: userId,
    status: { $nin: [USER_STATUS.DELETED] },
  }).select('-password -authentication -__v').populate({path: 'services', select: 'name'})

  return user
}

export const getStaffsByServiceId = async (serviceId: string) => {
  // 1. Check if service exists
  const service = await Service.findOne({
    _id: serviceId,
    status: { $nin: [SERVICE_STATUS.DELETED] },
  })
    .populate({
      path: 'staff',
      match: { isAvailable: true, status: USER_STATUS.ACTIVE },
      select: 'name email role _id profile isAvailable',
    })
    .lean()

  if (!service) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Service not found.')
  }

  // Filter out any null staff that didn't match the 'match' criteria in populate
  const validStaff = (service.staff as any[] || []).filter(s => s !== null)
  const staffIds = validStaff.map(s => s._id) || []

  // 2. Fetch rating + completed bookings
  const [ratings, completed] = await Promise.all([
    // ⭐ Staff Ratings
    Review.aggregate([
      { $match: { reviewee: { $in: staffIds }, status: 'approved' } },
      {
        $group: {
          _id: '$reviewee',
          avgRating: { $avg: '$rating' },
        },
      },
    ]),

    // ✅ Completed Services Count
    Booking.aggregate([
      {
        $match: {
          staff: { $in: staffIds },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: '$staff',
          completedCount: { $sum: 1 },
        },
      },
    ]),
  ])

  // 3. Convert arrays to maps for faster lookup
  const ratingMap = new Map(ratings.map(r => [String(r._id), r.avgRating]))

  const completedMap = new Map(
    completed.map(c => [String(c._id), c.completedCount]),
  )

  // 4. Attach data to staff list
  const staffData = validStaff.map(staff => ({
    ...staff,
    avgRating: ratingMap.get(String(staff._id)) || 0,
    completedServices: completedMap.get(String(staff._id)) || 0,
  }))

  return {
    serviceId,
    totalStaff: staffData.length,
    staffs: staffData,
  }
}

export const UserServices = {
  updateProfile,
  createAdmin,
  createStaff,
  getAllUsers,
  deleteUser,
  getUserById,
  updateUser,
  getProfile,
  deleteProfile,

  getAllStaff,
  getStaffById,
  getStaffsByServiceId,

  updateAvailability,
}
