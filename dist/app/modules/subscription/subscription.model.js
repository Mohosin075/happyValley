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
        type: Date,
        required: true,
    },
    currentPeriodEnd: {
        type: Date,
        required: true,
    },
    // Track usage against plan limits
    usage: {
        session: { type: Number, default: 0 },
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
subscriptionSchema.index({ user: 1, status: 1, currentPeriodEnd: 1 });
subscriptionSchema.index({ subscriptionId: 1 });
exports.Subscription = (0, mongoose_1.model)('Subscription', subscriptionSchema);
