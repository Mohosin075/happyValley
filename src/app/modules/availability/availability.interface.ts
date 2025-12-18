import { Types } from 'mongoose'
import { IUser } from '../user/user.interface'

export type IAvailability = {
  staff: Types.ObjectId | IUser
  date: Date
  isBooked: boolean
}
