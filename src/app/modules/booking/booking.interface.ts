import { Model, Types } from 'mongoose'

export interface IBookingFilterables {
  searchTerm?: string
  startTime?: string
  endTime?: string
  address?: string
  notes?: string
}

type BookingType = 'cleaning' | 'grocery' | 'maintenance'
type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface IBooking {
  _id: Types.ObjectId
  user: Types.ObjectId
  type: BookingType
  date: Date
  startTime?: Date
  endTime?: Date
  address?: {
    address: string
    city?: string
    state?: string
    zipCode?: string
  }
  notes?: string
  status?: BookingStatus
}

export type BookingModel = Model<IBooking, {}, {}>
