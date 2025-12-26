"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
const mongoose_1 = require("mongoose");
const service_1 = require("../../../enum/service");
const serviceSchema = new mongoose_1.Schema({
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    staff: { type: [mongoose_1.Schema.Types.ObjectId], ref: 'User', default: [] },
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    servicesProvided: { type: [String], required: true },
    occasions: { type: [String], default: [] },
    status: { type: String, default: service_1.SERVICE_STATUS.ACTIVE },
    serviceType: [
        {
            title: { type: String, required: true },
            description: { type: String, required: true },
        },
    ],
    fields: [
        {
            name: { type: String, required: true },
            type: { type: mongoose_1.Schema.Types.Mixed, required: true }, // can store string, number, boolean
            label: { type: String, required: true },
        },
    ],
}, {
    timestamps: true,
});
// Indexes for faster search
serviceSchema.index({ name: 1 });
serviceSchema.index({ servicesProvided: 1 });
serviceSchema.index({ 'serviceType.title': 1 });
serviceSchema.index({ 'fields.name': 1 });
exports.Service = (0, mongoose_1.model)('Service', serviceSchema);
