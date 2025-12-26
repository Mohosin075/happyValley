"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invoice = void 0;
const mongoose_1 = require("mongoose");
const invoiceSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    bookings: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Booking', required: true }],
    month: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending',
    },
    paymentId: { type: String },
}, {
    timestamps: true,
});
exports.Invoice = (0, mongoose_1.model)('Invoice', invoiceSchema);
