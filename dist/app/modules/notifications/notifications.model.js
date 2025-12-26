"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const notifications_constants_1 = require("./notifications.constants");
const notificationSchema = new mongoose_1.Schema({
    to: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    from: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: {
        type: String,
        enum: Object.values(notifications_constants_1.NOTIFICATION_TYPES),
        default: notifications_constants_1.NOTIFICATION_TYPES.SYSTEM,
    },
    link: { type: String },
    isRead: { type: Boolean, default: false },
}, {
    timestamps: true,
});
exports.Notification = (0, mongoose_1.model)('Notification', notificationSchema);
