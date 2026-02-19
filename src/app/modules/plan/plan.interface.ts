import { Model } from 'mongoose'

export type IPlan = {
  title: string
  description: string
  features: string[]
  idealFor: string
  limits: {
    session: number
  }
  priceId?: string
  price: number
  duration: '1 month' | '3 months' | '6 months' | '1 year' | 'One Time'
  paymentType: 'Monthly' | 'Yearly' | 'One Time'
  productId?: string
  paymentLink?: string
  status: 'active' | 'Delete'
}

export type PlanModel = Model<IPlan, Record<string, unknown>>
