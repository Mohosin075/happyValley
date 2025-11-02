"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const mongoose_1 = require("mongoose");
const subscriptionSchema = new mongoose_1.Schema({
    customerId: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
    },
    plan: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Plan',
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    trxId: {
        type: String,
        required: false,
    },
    subscriptionId: {
        type: String,
    },
    currentPeriodStart: {
        type: String,
        required: true,
    },
    currentPeriodEnd: {
        type: String,
        required: true,
    },
    // Track usage against plan limits
    usage: {
        reelsUsed: { type: Number, default: 0 },
        postsUsed: { type: Number, default: 0 },
        storiesUsed: { type: Number, default: 0 },
        businessesUsed: { type: Number, default: 0 },
        carouselUsed: { type: Number, default: 0 },
    },
    status: {
        type: String,
        enum: ['expired', 'active', 'cancel'],
        default: 'active',
        required: true,
    },
    lastReset: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
exports.Subscription = (0, mongoose_1.model)('Subscription', subscriptionSchema);
