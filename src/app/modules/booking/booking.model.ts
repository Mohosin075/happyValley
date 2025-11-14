import { Schema, model } from 'mongoose'
import { IBooking, BookingModel } from './booking.interface'

const bookingSchema = new Schema<IBooking, BookingModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    service: { type: Schema.Types.ObjectId, ref: 'Service' },
    staff: { type: Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date },
    startTime: { type: Date },
    endTime: { type: Date },
    address: {
      address: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
    },
    notes: { type: String },
    status: { type: String, default: 'pending' },
  },
  {
    timestamps: true,
  },
)
