"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = void 0;
const mongoose_1 = require("mongoose");
const reviewSchema = new mongoose_1.Schema({
    service: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Service',
        required: true,
    },
    reviewer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        populate: {
            path: 'reviewer',
            select: 'name lastName fullName profile role',
        },
    },
    reviewee: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        populate: {
            path: 'reviewee',
            select: 'name lastName fullName profile role',
        },
    },
    title: { type: String, required: true },
    rating: { type: Number, required: true },
    review: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
}, {
    timestamps: true,
});
reviewSchema.index({ service: 1, status: 1 });
exports.Review = (0, mongoose_1.model)('Review', reviewSchema);
