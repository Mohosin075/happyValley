import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IBookingFilterables, IBooking } from './booking.interface'
import { Booking } from './booking.model'
import { JwtPayload } from 'jsonwebtoken'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { bookingSearchableFields } from './booking.constants'
import { Types } from 'mongoose'
import { USER_ROLES } from '../../../enum/user'

const createBooking = async (
  user: JwtPayload,
  payload: IBooking,
): Promise<IBooking> => {
  try {
    const result = await Booking.create({ ...payload, user: user.authId })
    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create Booking, please try again with valid data.',
      )
    }

    return result
  } catch (error: any) {
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found')
    }
    throw error
  }
}

const getAllBookings = async (
  user: JwtPayload,
  filterables: IBookingFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions = []

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: bookingSearchableFields.map(field => ({
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
    Booking.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate({
        path: 'user',
        select: '-password -__v -createdAt -updatedAt -authentication',
      }),
    Booking.countDocuments(whereConditions),
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

const getSingleBooking = async (id: string): Promise<IBooking> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Booking ID')
  }

  const result = await Booking.findById(id).populate({
    path: 'user',
    select: '-password -__v -createdAt -updatedAt -authentication',
  })
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested booking not found, please try again with valid id',
    )
  }

  return result
}

const updateBooking = async (
  id: string,
  payload: Partial<IBooking>,
): Promise<IBooking | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Booking ID')
  }

  const result = await Booking.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: payload },
    {
      new: true,
      runValidators: true,
    },
  ).populate('user')

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested booking not found, please try again with valid id',
    )
  }

  return result
}

const deleteBooking = async (id: string): Promise<IBooking> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Booking ID')
  }

  const result = await Booking.findByIdAndDelete(id)
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Something went wrong while deleting booking, please try again with valid id.',
    )
  }

  return result
}

// for staff to view their services
const myServices = async (
  user: JwtPayload,
  filterables: IBookingFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions = []

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: bookingSearchableFields.map(field => ({
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
    Booking.find({ ...whereConditions, staff: user.authId })
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate({
        path: 'user',
        select: '-password -__v -createdAt -updatedAt -authentication',
      }),
    Booking.countDocuments(whereConditions),
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

// for staff to get bookings by date
const getBookingsByDate = async (date: string): Promise<IBooking[]> => {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const bookings = await Booking.find({
    date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  })

  return bookings
}

const updateBookingStatus = async (
  id: string,
  payload: Partial<IBooking>,
): Promise<IBooking | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Booking ID')
  }
  const result = await Booking.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: { status: payload } },
    {
      new: true,
      runValidators: true,
    },
  ).populate('user')

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested booking not found, please try again with valid id',
    )
  }

  return result
}

const getWeeklyBookingsByUser = async (user: JwtPayload, date: string) => {
  let baseDate = new Date()

  if (date === 'next') {
    // Move to next week
    baseDate.setDate(baseDate.getDate() + 7)
  } else if (date === 'prev') {
    // Move to previous week
    baseDate.setDate(baseDate.getDate() - 7)
  } else if (date) {
    // Use provided date
    baseDate = new Date(date)
  }

  // Calculate week range (Mon–Sun)
  const startOfWeek = new Date(baseDate)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1)
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  // Build filter
  const filter: any = {
    date: {
      $gte: startOfWeek,
      $lte: endOfWeek,
    },
  }

  if (user.role === USER_ROLES.CLIENT) filter.user = user.authId
  if (user.role === USER_ROLES.STAFF) filter.staff = user.authId

  const result = await Booking.find(filter).sort({ date: 1 }).populate({
    path: 'user',
    select: '-password -__v -createdAt -updatedAt -authentication',
  })

  return {
    total: result.length,
    weekRange: {
      startOfWeek,
      endOfWeek,
    },
    data: result,
  }
}

export const BookingServices = {
  createBooking,
  getAllBookings,
  getSingleBooking,
  updateBooking,
  deleteBooking,
  myServices,
  getBookingsByDate,
  updateBookingStatus,

  getWeeklyBookingsByUser,
}
