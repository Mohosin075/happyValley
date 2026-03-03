import { Model, Types } from 'mongoose'
import { IPlan } from '../plan/plan.interface'

export type ISubscription = {
  _id?: string
  customerId: string
  price: number
  user: Types.ObjectId | any
  plan: Types.ObjectId | IPlan | any
  trxId: string
  subscriptionId: string
  status: 'expired' | 'active' | 'cancel'
  currentPeriodStart: Date
  currentPeriodEnd: Date

  usage: {
    session: number
  }
  lastReset: Date
}

export type SubscriptionModel = Model<ISubscription, Record<string, unknown>>
