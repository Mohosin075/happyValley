"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const mongoose_1 = require("mongoose");
const notifications_model_1 = require("./notifications.model");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const getNotifications = async (user, paginationOptions) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(paginationOptions);
    const [result, total] = await Promise.all([
        notifications_model_1.Notification.find({ to: user.authId })
            .populate('to')
            .populate('from')
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .lean(),
        notifications_model_1.Notification.countDocuments({ to: user.authId }),
    ]);
    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: result,
    };
};
const readNotification = async (id) => {
    try {
        await notifications_model_1.Notification.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { isRead: true }, { new: true });
        return 'Notification read successfully';
    }
    catch (error) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to mark notification as read');
    }
};
const readAllNotifications = async (user) => {
    try {
        await notifications_model_1.Notification.updateMany({ to: user.authId }, { isRead: true });
        return 'All notifications read successfully';
    }
    catch (error) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to mark all notifications as read');
    }
};
exports.NotificationServices = {
    getNotifications,
    readNotification,
    readAllNotifications,
};
