"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceService = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const booking_model_1 = require("../booking/booking.model");
const invoice_model_1 = require("./invoice.model");
const generateInvoices = async () => {
    // Logic to find all completed, non-invoiced bookings
    // This could be run via cron job or manually triggered by admin
    const aggregateResult = await booking_model_1.Booking.aggregate([
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
    ]);
    console.log(aggregateResult);
    const results = [];
    for (const group of aggregateResult) {
        const userId = group._id;
        const bookingIds = group.bookings;
        const amount = group.totalAmount;
        // Create Invoice
        const now = new Date();
        const month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        const invoice = await invoice_model_1.Invoice.create({
            user: userId,
            bookings: bookingIds,
            month,
            totalAmount: amount,
            status: 'pending',
        });
        // Update Bookings
        await booking_model_1.Booking.updateMany({ _id: { $in: bookingIds } }, { $set: { isInvoiced: true, invoice: invoice._id } });
        results.push(invoice);
    }
    return results;
};
const getMyInvoices = async (userId) => {
    return await invoice_model_1.Invoice.find({ user: userId }).sort({ createdAt: -1 });
};
const getAllInvoices = async () => {
    return await invoice_model_1.Invoice.find({}).populate('user').sort({ createdAt: -1 });
};
const getSingleInvoice = async (id) => {
    const result = await invoice_model_1.Invoice.findById(id).populate('user').populate('bookings');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Invoice not found');
    }
    return result;
};
exports.InvoiceService = {
    generateInvoices,
    getMyInvoices,
    getAllInvoices,
    getSingleInvoice,
};
