"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralController = void 0;
const referral_service_1 = require("./referral.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const pick_1 = __importDefault(require("../../../shared/pick"));
const referral_constants_1 = require("./referral.constants");
const pagination_1 = require("../../../interfaces/pagination");
const createReferral = (0, catchAsync_1.default)(async (req, res) => {
    const referralData = req.body;
    const result = await referral_service_1.ReferralServices.createReferral(req.user, referralData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Referral created successfully',
        data: result,
    });
});
const updateReferral = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const referralData = req.body;
    const result = await referral_service_1.ReferralServices.updateReferral(id, referralData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Referral updated successfully',
        data: result,
    });
});
const getSingleReferral = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await referral_service_1.ReferralServices.getSingleReferral(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Referral retrieved successfully',
        data: result,
    });
});
const getAllReferrals = (0, catchAsync_1.default)(async (req, res) => {
    const filterables = (0, pick_1.default)(req.query, referral_constants_1.referralFilterables);
    const pagination = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await referral_service_1.ReferralServices.getAllReferrals(req.user, filterables, pagination);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Referrals retrieved successfully',
        data: result,
    });
});
const deleteReferral = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await referral_service_1.ReferralServices.deleteReferral(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Referral deleted successfully',
        data: result,
    });
});
exports.ReferralController = {
    createReferral,
    updateReferral,
    getSingleReferral,
    getAllReferrals,
    deleteReferral,
};
