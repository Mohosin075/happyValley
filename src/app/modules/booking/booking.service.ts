import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IBookingFilterables, IBooking } from './booking.interface'
import { Booking } from './booking.model'
import { Service } from '../service/service.model'
import { JwtPayload } from 'jsonwebtoken'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { bookingSearchableFields } from './booking.constants'
import { Types } from 'mongoose'
import { USER_ROLES } from '../../../enum/user'
import { AvailabilityServices } from '../availability/availability.service'
import { Subscription } from '../subscription/subscription.model'

const createBooking = async (
  user: JwtPayload,
  payload: IBooking,
): Promise<IBooking> => {
  try {
    // Validate if staff is assigned to the service
    if (payload.staff) {
      const service = await Service.findById(payload.service)
      if (!service) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Service not found')
      }

      // Check if staff is in service.staff
      const isStaffValid = service.staff.some(
        (s: any) => s.toString() === payload.staff!.toString(),
      )

      if (!isStaffValid) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Selected staff is not assigned to this service',
        )
      }

      // Check for conflicts: One staff per client per day
      if (payload.date) {
        const startOfDay = new Date(payload.date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(payload.date)
        endOfDay.setHours(23, 59, 59, 999)

        const existingBooking = await Booking.findOne({
          staff: payload.staff,
          date: { $gte: startOfDay, $lte: endOfDay },
          status: { $in: ['scheduled', 'confirmed', 'inProgress'] },
        })

        if (existingBooking) {
          throw new ApiError(
            StatusCodes.CONFLICT,
            'Staff is already booked for this entire day.',
          )
        }
      }

      // If staff is valid and no conflict, set status to scheduled
      payload.status = 'scheduled'
    }

    // Force price to 0 on creation to prevent pre-prices
    payload.price = 0


    const isPremiumUser = await Subscription.findOne({ user: user.authId })
    console.log(isPremiumUser)
    if (isPremiumUser?.status === 'active') {
      payload.bookingFee = 0
    }else{
      payload.bookingFee = 150
    }
    

    const result = await Booking.create({ ...payload, user: user.authId })
    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create Booking, please try again with valid data.',
      )
    }

    // Update availability
    if (payload.staff && payload.date) {
      await AvailabilityServices.updateAvailability(
        payload.staff,
        payload.date,
        true,
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


  const updateData = { ...payload }

  // If staff is being assigned and status is currently 'requested', update to 'scheduled'
  if (updateData.staff) {
    const booking = await Booking.findById(id)
    if (booking && booking.status === 'requested') {
      updateData.status = 'scheduled'
    }
  }

  // If status is changing to 'inProgress', set startTime
  if (updateData.status === 'inProgress') {
    const now = new Date()
    // format HH:mm
    updateData.startTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  // If status is changing to 'completed', set endTime
  if (updateData.status === 'completed') {
    const now = new Date()
    // format HH:mm
    updateData.endTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  const result = await Booking.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: updateData },
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
  status: string,
): Promise<IBooking | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Booking ID')
  }

  const updateData: any = { status }

  // Logic for time tracking based on status change
  if (status === 'inProgress') {
    const now = new Date()
    updateData.startTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  if (status === 'completed') {
    const now = new Date()
    updateData.endTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  const result = await Booking.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: updateData },
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

  // Handle availability update on cancellation
  if (status === 'cancelled' && result.staff && result.date) {
    // Check if there are other active bookings for this staff on this date
    const startOfDay = new Date(result.date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(result.date)
    endOfDay.setHours(23, 59, 59, 999)

    const activeBookingsCount = await Booking.countDocuments({
      staff: result.staff,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['confirmed', 'scheduled', 'inProgress'] }, // confirmed/scheduled/inProgress are active
    })

    if (activeBookingsCount === 0) {
      await AvailabilityServices.updateAvailability(
        result.staff,
        result.date,
        false,
      )
    }
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

const updatePrice = async (
  id: string,
  price: number,
): Promise<IBooking | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Booking ID')
  }

  const result = await Booking.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: { price } },
    {
      new: true,
      runValidators: true,
    },
  ).populate('user')

  return result
}

const updateBookingFees = async (
  id: string,
  payload: { bookingFee?: number; serviceCharge?: number },
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
    throw new ApiError(StatusCodes.NOT_FOUND, 'Booking not found')
  }

  return result
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
  updatePrice,
  updateBookingFees,
  getWeeklyBookingsByUser,
}
