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
import { userFilterableFields } from './user.constants'
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

  if (isUserExist.profile) {
    const url = new URL(isUserExist.profile)
    const key = url.pathname.substring(1)
    // await S3Helper.deleteFromS3(key)
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
  const result = await User.create([admin])
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create admin')
  }
  return result[0]
}

const createStaff = async (
  user: JwtPayload,
  payload: IUser,
): Promise<Partial<IUser> | null> => {
  try {
    const tempPassword = Math.floor(
      10000000 + Math.random() * 90000000,
    ).toString()

    const result = await User.create({
      ...payload,
      password: tempPassword,
      verified: true,
      role: USER_ROLES.STAFF,
      createdBy: user.authId,
    })

    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create Staff, please try again with valid data.',
      )
    }

    if (payload.services) {
      payload.services.forEach(async serviceId => {
        await Service.findByIdAndUpdate(serviceId, {
          $addToSet: { staff: result._id },
        })
      })
    }

    // send account verification email
    if (result.email) {
      const emailContent = staffCreateTemplate({
        email: result.email,
        name: result.name as string,
        role: USER_ROLES.STAFF,
        otp: tempPassword,
      })

      await emailHelper.sendEmail(emailContent)
      // emailQueue.add('emails', createStaffEmailTemplate) // optional queue
    }

    return result
  } catch (error: any) {
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
      $or: userFilterableFields.map(field => ({
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

  const pipeline = [
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

const updateUserStatus = async (userId: string, status: USER_STATUS) => {
  const isUserExist = await User.findOne({
    _id: userId,
    status: { $nin: [USER_STATUS.DELETED] },
  })
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, status: { $nin: [USER_STATUS.DELETED] } },
    { $set: { status } },
    { new: true },
  )

  if (!updatedUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update user status.')
  }

  return 'User status updated successfully.'
}

export const getProfile = async (user: JwtPayload) => {
  // --- Fetch user ---
  const isUserExist = await User.findOne({
    _id: user.authId,
    status: { $nin: [USER_STATUS.DELETED] },
  }).select('-authentication -password -__v')

  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }

  return isUserExist
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
      $or: userFilterableFields.map(field => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    })
  }

  // 🎯 Dynamic filters (role, verified, etc.)
  if (Object.keys(otherFilters).length) {
    for (const [key, value] of Object.entries(otherFilters)) {
      andConditions.push({ [key]: value })
    }
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
      .select('-password -authentication -__v'),

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

export const getStaffsByServiceId = async (serviceId: string) => {
  // 1. Check if service exists
  const service = await Service.findOne({
    _id: serviceId,
    status: { $nin: [SERVICE_STATUS.DELETED] },
  })
    .populate({
      path: 'staff',
      select: 'name email role _id profile',
    })
    .lean()

  if (!service) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Service not found.')
  }

  const staffIds = service.staff?.map(s => s._id) || []

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
  const staffData = service.staff.map(staff => ({
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
  updateUserStatus,
  getProfile,
  deleteProfile,

  getAllStaff,
  getStaffById,
  getStaffsByServiceId,
}
