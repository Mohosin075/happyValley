import { Model, Types } from 'mongoose'

export type IPayment = {
  user: Types.ObjectId
  booking?: Types.ObjectId
  subscription?: Types.ObjectId
  amount: number
  paymentType: 'booking_fee' | 'service_charge' | 'subscription'
  transactionId: string
  status: 'pending' | 'completed' | 'failed'
  paymentGateway: 'stripe'
}


export type IPaymentFilterables = {
  searchTerm?: string
  booking?: Types.ObjectId
  subscription?: Types.ObjectId
  paymentType?: 'booking_fee' | 'service_charge' | 'subscription'
  transactionId?: string
  status?: 'pending' | 'completed' | 'failed'
  paymentGateway?: 'stripe'
}

export type PaymentModel = Model<IPayment, Record<string, unknown>>
