"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const plan_service_1 = require("./plan.service");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const createPlan = (0, catchAsync_1.default)(async (req, res) => {
    const result = await plan_service_1.PackageService.createPlanToDB(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Package created Successfully",
        data: result
    });
});
const updatePlan = (0, catchAsync_1.default)(async (req, res) => {
    const result = await plan_service_1.PackageService.updatePlanToDB(req.params.id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Plan updated Successfully",
        data: result
    });
});
const getPlan = (0, catchAsync_1.default)(async (req, res) => {
    const result = await plan_service_1.PackageService.getPlanFromDB(req.query.paymentType);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Plan Retrieved Successfully",
        data: result
    });
});
const planDetails = (0, catchAsync_1.default)(async (req, res) => {
    const result = await plan_service_1.PackageService.getPlanDetailsFromDB(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Plan Details Retrieved Successfully",
        data: result
    });
});
const deletePlan = (0, catchAsync_1.default)(async (req, res) => {
    const result = await plan_service_1.PackageService.deletePlanToDB(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Plan Deleted Successfully",
        data: result
    });
});
exports.PlanController = {
    createPlan,
    updatePlan,
    getPlan,
    planDetails,
    deletePlan
};
