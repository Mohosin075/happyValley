"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroceryChat = exports.Booking = void 0;
const mongoose_1 = require("mongoose");
const bookingSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    service: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Service', required: true },
    staff: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, required: true },
    startTime: { type: String },
    endTime: { type: String },
    address: {
        address: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String },
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            default: [0, 0], // [longitude, latitude]
        },
    },
    serviceType: {
        title: { type: String, required: true },
        description: { type: String },
    },
    serviceDetails: [
        {
            name: { type: String, required: true },
            value: { type: mongoose_1.Schema.Types.Mixed }, // can be string | number | boolean
        },
    ],
    notes: { type: String },
    status: {
        type: String,
        enum: [
            'confirmed',
            'inProgress',
            'completed',
            'cancelled',
            'requested',
            'scheduled',
        ],
        default: 'requested',
    },
    price: { type: Number, required: true, default: 0 },
    bookingFee: { type: Number, default: 0 },
    serviceCharge: { type: Number, default: 0 },
    bookingFeeStatus: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending',
    },
    serviceChargeStatus: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending',
    },
    paymentId: { type: String },
    invoice: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Invoice' },
    isInvoiced: { type: Boolean, default: false },
}, {
    timestamps: true,
});
bookingSchema.index({ service: 1, status: 1, createdAt: -1 });
bookingSchema.index({ date: 1 });
bookingSchema.index({ user: 1 });
exports.Booking = (0, mongoose_1.model)('Booking', bookingSchema);
// only for grocery booking
const groceryChatSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
        {
            name: { type: String, required: true },
            quantity: { type: String, required: true },
            type: { type: String }, // vegetable, dairy, spice, meat, etc.
            brand: { type: String }, // preferred brand
        },
    ],
    conversationHistory: [
        {
            role: { type: String, enum: ['user', 'assistant'], required: true },
            content: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
        },
    ],
    status: {
        type: String,
        enum: ['draft', 'confirmed', 'completed'],
        default: 'draft',
    },
    pastOrderReference: { type: mongoose_1.Schema.Types.ObjectId, ref: 'GroceryChat' },
}, { timestamps: true });
exports.GroceryChat = (0, mongoose_1.model)('GroceryChat', groceryChatSchema);
