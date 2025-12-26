"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Availability = void 0;
const mongoose_1 = require("mongoose");
const availabilitySchema = new mongoose_1.Schema({
    staff: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    isBooked: { type: Boolean, default: false },
}, {
    timestamps: true,
});
// Compound index for efficient lookup
availabilitySchema.index({ staff: 1, date: 1 }, { unique: true });
exports.Availability = (0, mongoose_1.model)('Availability', availabilitySchema);
