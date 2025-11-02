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
    priceId: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
    },
    duration: {
        type: String,
        enum: ['1 month', '3 months', '6 months', '1 year'],
        required: true,
    },
    paymentType: {
        type: String,
        enum: ['Monthly', 'Yearly'],
        required: true,
    },
    productId: {
        type: String
    },
    paymentLink: {
        type: String
    },
    limits: {
        reelsPerWeek: { type: Number, default: 0 },
        postsPerWeek: { type: Number, default: 0 },
        storiesPerWeek: { type: Number, default: 0 },
        businessesManageable: { type: Number, default: 1 },
        carouselPerWeek: { type: Number, default: 1 },
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
