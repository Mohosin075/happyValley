"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Plan = void 0;
const mongoose_1 = require("mongoose");
const planSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    features: {
        type: [String],
        required: true,
    },
    limits: {
        session: {
            type: Number,
            required: true,
            default: 0,
        },
    },
    priceId: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
    },
    duration: {
        type: String,
        enum: ['1 month', '3 months', '6 months', '1 year', 'One Time'],
        required: true,
    },
    paymentType: {
        type: String,
        enum: ['Monthly', 'Yearly', 'One Time'],
        required: true,
    },
    productId: {
        type: String,
    },
    paymentLink: {
        type: String,
    },
    status: {
        type: String,
        enum: ['active', 'Delete'],
        default: 'active',
    },
}, {
    timestamps: true,
});
exports.Plan = (0, mongoose_1.model)('Plan', planSchema);
