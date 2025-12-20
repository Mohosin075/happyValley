import { Model, Types } from 'mongoose'

export type IPayment = {
  user: Types.ObjectId
  booking?: Types.ObjectId
  subscription?: Types.ObjectId
  amount: number
  transactionId: string
  status: 'pending' | 'completed' | 'failed'
  paymentGateway: 'stripe'
}

export type PaymentModel = Model<IPayment, Record<string, unknown>>
