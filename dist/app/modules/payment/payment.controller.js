"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const payment_service_1 = require("./payment.service");
const createBookingFeeSession = (0, catchAsync_1.default)(async (req, res) => {
    const { bookingId } = req.params;
    const result = await payment_service_1.PaymentService.createBookingFeeCheckoutSession(req.user, bookingId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Booking fee checkout session created successfully',
        data: result,
    });
});
const createServiceChargeSession = (0, catchAsync_1.default)(async (req, res) => {
    const { bookingId } = req.params;
    const result = await payment_service_1.PaymentService.createServiceChargeCheckoutSession(req.user, bookingId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Service charge checkout session created successfully',
        data: result,
    });
});
const createInvoiceSession = (0, catchAsync_1.default)(async (req, res) => {
    const { invoiceId } = req.params;
    const result = await payment_service_1.PaymentService.createInvoiceCheckoutSession(req.user, invoiceId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Invoice checkout session created successfully',
        data: result,
    });
});
exports.PaymentController = {
    createBookingFeeSession,
    createServiceChargeSession,
    createInvoiceSession,
};
