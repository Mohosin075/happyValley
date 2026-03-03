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
        title: { type: String },
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
bookingSchema.virtual('googleMapsUrl').get(function () {
    if (this.location &&
        this.location.coordinates &&
        (this.location.coordinates[0] !== 0 || this.location.coordinates[1] !== 0)) {
        // google maps url with coordinates
        return `https://www.google.com/maps/dir/?api=1&destination=${this.location.coordinates[1]},${this.location.coordinates[0]}`;
    }
    if (this.address) {
        const { address, city, state, zipCode } = this.address;
        const fullAddress = `${address || ''}, ${city || ''}, ${state || ''}, ${zipCode || ''}`
            .replace(/^, /, '')
            .replace(/, $/, '');
        if (fullAddress.trim()) {
            return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;
        }
    }
    return null;
});
bookingSchema.virtual('userPhoneUrl').get(function () {
    if (this.user && this.user.phone) {
        return `tel:${this.user.phone}`;
    }
    return null;
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
