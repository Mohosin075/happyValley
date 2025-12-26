import { Schema, model } from 'mongoose'
import { IInvoice, InvoiceModel } from './invoice.interface'

const invoiceSchema = new Schema<IInvoice, InvoiceModel>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        bookings: [{ type: Schema.Types.ObjectId, ref: 'Booking', required: true }],
        month: { type: String, required: true },
        totalAmount: { type: Number, required: true },
        status: {
            type: String,
            enum: ['pending', 'paid'],
            default: 'pending',
        },
        paymentId: { type: String },
    },
    {
        timestamps: true,
    },
)

export const Invoice = model<IInvoice, InvoiceModel>('Invoice', invoiceSchema)
