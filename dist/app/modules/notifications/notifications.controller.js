"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const notifications_service_1 = require("./notifications.service");
const getMyNotifications = (0, catchAsync_1.default)(async (req, res) => {
    const paginationOptions = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
    };
    const result = await notifications_service_1.NotificationServices.getNotifications(req.user, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Notifications retrieved successfully',
        data: result,
    });
});
const updateNotification = (0, catchAsync_1.default)(async (req, res) => {
    const notificationId = req.params.id;
    const result = await notifications_service_1.NotificationServices.readNotification(notificationId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Notifications updated successfully',
        data: result,
    });
});
const updateAllNotifications = (0, catchAsync_1.default)(async (req, res) => {
    const result = await notifications_service_1.NotificationServices.readAllNotifications(req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Notifications updated successfully',
        data: result,
    });
});
exports.NotificationController = {
    getMyNotifications,
    updateNotification,
    updateAllNotifications,
};
