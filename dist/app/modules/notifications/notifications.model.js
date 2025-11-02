"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    to: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', populate: 'name profile' },
    from: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', populate: 'name profile' },
    title: { type: String },
    body: { type: String },
    isRead: { type: Boolean },
    createdAt: { type: Date },
    updatedAt: { type: Date },
}, {
    timestamps: true,
});
exports.Notification = (0, mongoose_1.model)('Notification', notificationSchema);
