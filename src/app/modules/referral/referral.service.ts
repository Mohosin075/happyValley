import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IReferralFilterables, IReferral } from './referral.interface'
import { Referral } from './referral.model'
import { JwtPayload } from 'jsonwebtoken'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { referralSearchableFields } from './referral.constants'
import { Types } from 'mongoose'

const createReferral = async (
  user: JwtPayload,
  payload: IReferral,
): Promise<IReferral> => {
  try {
    // Check if the referral already exists
    const existingReferral = await Referral.findOne({
      referralEmail: payload.referralEmail,
      referredBy: user.authId,
    })

    if (existingReferral) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'You have already referred this user.',
      )
    }

    const result = await Referral.create({
      ...payload,
      referredBy: user.authId,
    })

    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create Referral, please try again with valid data.',
      )
    }

    return result
  } catch (error: any) {
    throw error
  }
}

const getAllReferrals = async (
  user: JwtPayload,
  filterables: IReferralFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions = []

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: referralSearchableFields.map(field => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    })
  }

  // Filter functionality
  if (Object.keys(filterData).length) {
    andConditions.push({
      $and: Object.entries(filterData).map(([key, value]) => ({
        [key]: value,
      })),
    })
  }

  const whereConditions = andConditions.length ? { $and: andConditions } : {}

  const [result, total] = await Promise.all([
    Referral.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate('referredBy'),
    Referral.countDocuments(whereConditions),
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

const getSingleReferral = async (id: string): Promise<IReferral> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Referral ID')
  }

  const result = await Referral.findById(id).populate('referredBy')
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested referral not found, please try again with valid id',
    )
  }

  return result
}

const updateReferral = async (
  id: string,
  payload: Partial<IReferral>,
): Promise<IReferral | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Referral ID')
  }

  const result = await Referral.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: payload },
    {
      new: true,
      runValidators: true,
    },
  ).populate('referredBy')

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested referral not found, please try again with valid id',
    )
  }

  return result
}

const deleteReferral = async (id: string): Promise<IReferral> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Referral ID')
  }

  const result = await Referral.findByIdAndDelete(id)
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Something went wrong while deleting referral, please try again with valid id.',
    )
  }

  return result
}

export const ReferralServices = {
  createReferral,
  getAllReferrals,
  getSingleReferral,
  updateReferral,
  deleteReferral,
}
