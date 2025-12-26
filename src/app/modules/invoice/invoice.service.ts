import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { Booking } from '../booking/booking.model'
import { Invoice } from './invoice.model'
import { IInvoice } from './invoice.interface'
import { Types } from 'mongoose'

const generateInvoices = async (): Promise<any> => {
    // Logic to find all completed, non-invoiced bookings
    // This could be run via cron job or manually triggered by admin
    const aggregateResult = await Booking.aggregate([
        {
            $match: {
                status: 'completed',
                isInvoiced: false,
                price: { $gt: 0 },
            },
        },
        {
            $group: {
                _id: '$user',
                bookings: { $push: '$_id' },
                totalAmount: { $sum: '$price' },
            },
        },
    ])

    console.log(aggregateResult)

    const results = []

    for (const group of aggregateResult) {
        const userId = group._id
        const bookingIds = group.bookings
        const amount = group.totalAmount

        // Create Invoice
        const now = new Date()
        const month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`

        const invoice = await Invoice.create({
            user: userId,
            bookings: bookingIds,
            month,
            totalAmount: amount,
            status: 'pending',
        })

        // Update Bookings
        await Booking.updateMany(
            { _id: { $in: bookingIds } },
            { $set: { isInvoiced: true, invoice: invoice._id } },
        )

        results.push(invoice)
    }

    return results
}

const getMyInvoices = async (userId: string): Promise<IInvoice[]> => {
    return await Invoice.find({ user: userId }).sort({ createdAt: -1 })
}

const getAllInvoices = async (): Promise<IInvoice[]> => {
    return await Invoice.find({}).populate('user').sort({ createdAt: -1 })
}

const getSingleInvoice = async (id: string): Promise<IInvoice> => {
    const result = await Invoice.findById(id).populate('user').populate('bookings')
    if (!result) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Invoice not found')
    }
    return result
}

export const InvoiceService = {
    generateInvoices,
    getMyInvoices,
    getAllInvoices,
    getSingleInvoice,
}
