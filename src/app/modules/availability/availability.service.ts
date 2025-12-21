import { Types } from 'mongoose'
import { Availability } from './availability.model'

const updateAvailability = async (
  staffId: Types.ObjectId | string,
  date: Date | string,
  isBooked: boolean,
) => {
  const queryDate = new Date(date)
  queryDate.setHours(0, 0, 0, 0) // Normalize to start of day

  // Upsert: Update if exists, Insert if not
  const result = await Availability.findOneAndUpdate(
    {
      staff: staffId,
      date: queryDate,
    },
    {
      $set: { isBooked },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  )

  return result
}

const checkAvailability = async (
  staffId: Types.ObjectId | string,
  date: Date | string,
) => {
  const queryDate = new Date(date)
  queryDate.setHours(0, 0, 0, 0)

  const record = await Availability.findOne({
    staff: staffId,
    date: queryDate,
  })

  return record ? !record.isBooked : true // If no record, assume available
}

export const AvailabilityServices = {
  updateAvailability,
  checkAvailability,
}
