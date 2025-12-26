"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const invoice_service_1 = require("./invoice.service");
const generateInvoices = (0, catchAsync_1.default)(async (req, res) => {
    const result = await invoice_service_1.InvoiceService.generateInvoices();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Invoices generated successfully',
        data: result,
    });
});
const getMyInvoices = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const result = await invoice_service_1.InvoiceService.getMyInvoices(user.authId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'My invoices retrieved successfully',
        data: result,
    });
});
const getAllInvoices = (0, catchAsync_1.default)(async (req, res) => {
    const result = await invoice_service_1.InvoiceService.getAllInvoices();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'All invoices retrieved successfully',
        data: result,
    });
});
const getSingleInvoice = (0, catchAsync_1.default)(async (req, res) => {
    const result = await invoice_service_1.InvoiceService.getSingleInvoice(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Invoice retrieved successfully',
        data: result,
    });
});
exports.InvoiceController = {
    generateInvoices,
    getMyInvoices,
    getAllInvoices,
    getSingleInvoice,
};
