import { Schema, model } from 'mongoose'
import { IAvailability } from './availability.interface'

const availabilitySchema = new Schema<IAvailability>(
  {
    staff: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    isBooked: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

// Compound index for efficient lookup
availabilitySchema.index({ staff: 1, date: 1 }, { unique: true })

export const Availability = model<IAvailability>(
  'Availability',
  availabilitySchema,
)
