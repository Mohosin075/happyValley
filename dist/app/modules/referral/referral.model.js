"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Referral = void 0;
const mongoose_1 = require("mongoose");
const referralSchema = new mongoose_1.Schema({
    yourName: { type: String },
    referralName: { type: String },
    referralEmail: { type: String, required: true },
    referralPhone: { type: String },
    notes: { type: String },
    referredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
    },
}, {
    timestamps: true,
});
referralSchema.index({ referralEmail: 1, referredBy: 1 }, { unique: true });
exports.Referral = (0, mongoose_1.model)('Referral', referralSchema);
