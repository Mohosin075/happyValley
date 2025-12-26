"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agreement = void 0;
const mongoose_1 = require("mongoose");
const agreementSchema = new mongoose_1.Schema({
    clientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Client' },
    clientName: { type: String },
    date: { type: Date },
    signatureUrl: { type: String },
    propertyAddress: { type: String },
    status: { type: String },
}, {
    timestamps: true,
});
exports.Agreement = (0, mongoose_1.model)('Agreement', agreementSchema);
