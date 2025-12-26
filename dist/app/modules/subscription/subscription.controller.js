"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionController = exports.createSession = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const subscription_service_1 = require("./subscription.service");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const checkOutSession_1 = require("../../../stripe/checkOutSession");
exports.createSession = (0, catchAsync_1.default)(async (req, res) => {
    const { planId } = req.params;
    const session = await (0, checkOutSession_1.createCheckoutSession)(req.user, planId);
    return (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Checkout Session Created Successfully',
        data: session,
    });
});
const subscriptions = (0, catchAsync_1.default)(async (req, res) => {
    const result = await subscription_service_1.SubscriptionService.subscriptionsFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Subscription List Retrieved Successfully',
        data: result,
    });
});
const subscriptionDetails = (0, catchAsync_1.default)(async (req, res) => {
    const result = await subscription_service_1.SubscriptionService.subscriptionDetailsFromDB(req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Subscription Details Retrieved Successfully',
        data: result,
    });
});
exports.SubscriptionController = {
    subscriptions,
    subscriptionDetails,
};
