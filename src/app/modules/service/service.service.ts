import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IServiceFilterables, IService } from './service.interface'
import { Service } from './service.model'
import { JwtPayload } from 'jsonwebtoken'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { serviceSearchableFields } from './service.constants'
import { Types } from 'mongoose'
import { User } from '../user/user.model'

const createService = async (
  user: JwtPayload,
  payload: IService,
): Promise<IService> => {
  try {
    const result = await Service.create({ ...payload, createdBy: user.authId })
    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create Service, please try again with valid data.',
      )
    }

    if (payload.staff) {
      payload.staff.forEach(async staffId => {
        await User.findByIdAndUpdate(staffId, {
          $addToSet: { services: result._id },
        })
      })
    }

    return result
  } catch (error: any) {
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found')
    }
    throw error
  }
}

const getAllServices = async (
  user: JwtPayload,
  filterables: IServiceFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions = []

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: serviceSearchableFields.map(field => ({
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
    Service.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate({path:'staff', select:'name email phone'}),
    Service.countDocuments(whereConditions),
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

const getSingleService = async (id: string): Promise<IService> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Service ID')
  }

  const result = await Service.findById(id)
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested service not found, please try again with valid id',
    )
  }

  return result
}

const updateService = async (
  id: string,
  payload: Partial<IService>,
): Promise<IService | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Service ID')
  }

  console.log({ payload })

  const result = await Service.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: payload },
    {
      new: true,
      runValidators: true,
    },
  )

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested service not found, please try again with valid id',
    )
  }

  if (payload.staff) {
    payload.staff.forEach(async staffId => {
      await User.findByIdAndUpdate(staffId, {
        $addToSet: { services: result._id },
      })
    })
  }

  return result
}

const deleteService = async (id: string): Promise<IService> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Service ID')
  }

  const result = await Service.findByIdAndDelete(id)
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Something went wrong while deleting service, please try again with valid id.',
    )
  }

  return result
}

export const ServiceServices = {
  createService,
  getAllServices,
  getSingleService,
  updateService,
  deleteService,
}
