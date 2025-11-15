import { Schema, model } from 'mongoose'
import { IBooking, BookingModel } from './booking.interface'

const bookingSchema = new Schema<IBooking, BookingModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    staff: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    date: { type: Date, required: true },
    startTime: { type: Date },
    endTime: { type: Date },

    address: {
      address: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
    },

    serviceType: {
      title: { type: String, required: true },
      description: { type: String },
    },

    fields: [
      {
        name: { type: String, required: true },
        value: { type: Schema.Types.Mixed }, // can be string | number | boolean
      },
    ],

    notes: { type: String },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
)

export const Booking = model<IBooking, BookingModel>('Booking', bookingSchema)
