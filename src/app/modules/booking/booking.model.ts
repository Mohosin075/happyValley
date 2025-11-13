import { Schema, model } from 'mongoose'
import { IBooking, BookingModel } from './booking.interface'

const bookingSchema = new Schema<IBooking, BookingModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String },
    date: { type: Date },
    startTime: { type: Date },
    endTime: { type: Date },
    address: { type: String },
    notes: { type: String },
    status: { type: String },
  },
  {
    timestamps: true,
  },
)

export const Booking = model<IBooking, BookingModel>('Booking', bookingSchema)
