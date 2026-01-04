import { Model, Types } from 'mongoose'
import { Point } from '../user/user.interface'

export interface IBookingFilterables {
  searchTerm?: string
  startTime?: string
  endTime?: string
  address?: string
  notes?: string
}

type BookingStatus =
  | 'confirmed'
  | 'inProgress'
  | 'completed'
  | 'cancelled'
  | 'requested'
  | 'scheduled'

export interface IBooking {
  _id: Types.ObjectId
  user: Types.ObjectId
  service: Types.ObjectId
  staff: Types.ObjectId
  date: Date
  startTime?: string
  endTime?: string
  location: Point
  address?: {
    address: string
    city?: string
    state?: string
    zipCode?: string
  }
  serviceType: {
    title: string
    description: string
  }
  serviceDetails: {
    name: string
    value?: string | number | boolean
  }[]
  notes?: string
  status?: BookingStatus
  price: number // Total price or specific field? Keeping for compatibility
  bookingFee: number
  serviceCharge: number
  bookingFeeStatus: 'pending' | 'paid'
  serviceChargeStatus: 'pending' | 'paid'
  paymentId?: string
  invoice?: Types.ObjectId
  isInvoiced?: boolean
  googleMapsUrl?: string
}

export type BookingModel = Model<IBooking, {}, {}>

// only for grocery booking (Kitchen Restock AI)

export interface IGroceryItem {
  name: string
  quantity: string
  type?: string // e.g., "vegetable", "dairy", "spice", "meat"
  brand?: string // preferred brand
}

export interface IChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface IGroceryChatSession {
  user: Types.ObjectId
  items: IGroceryItem[]
  conversationHistory: IChatMessage[]
  status: 'draft' | 'confirmed' | 'completed'
  pastOrderReference?: Types.ObjectId // Reference to previous grocery session
}
