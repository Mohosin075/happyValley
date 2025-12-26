import { Model, Types } from 'mongoose'

export interface IInvoice {
    user: Types.ObjectId
    bookings: Types.ObjectId[]
    month: string // Format: "YYYY-MM"
    totalAmount: number
    status: 'pending' | 'paid'
    paymentId?: string
}

export type InvoiceModel = Model<IInvoice, Record<string, unknown>>
