"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceController = void 0;
const service_service_1 = require("./service.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const pick_1 = __importDefault(require("../../../shared/pick"));
const service_constants_1 = require("./service.constants");
const pagination_1 = require("../../../interfaces/pagination");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const createService = (0, catchAsync_1.default)(async (req, res) => {
    // const serviceData = req.body;
    if (!req.body.images || req.body.images.length === 0) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'image is required');
    }
    const serviceData = { ...req.body, image: req.body.images[0] };
    const result = await service_service_1.ServiceServices.createService(req.user, serviceData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Service created successfully',
        data: result,
    });
});
const updateService = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    let serviceData = req.body;
    if (req.body.images && req.body.images.length > 0) {
        serviceData = { ...req.body, image: req.body.images[0] };
    }
    console.log({ serviceData });
    const result = await service_service_1.ServiceServices.updateService(id, serviceData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Service updated successfully',
        data: result,
    });
});
const getSingleService = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await service_service_1.ServiceServices.getSingleService(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Service retrieved successfully',
        data: result,
    });
});
const getAllServices = (0, catchAsync_1.default)(async (req, res) => {
    const filterables = (0, pick_1.default)(req.query, service_constants_1.serviceFilterables);
    const pagination = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await service_service_1.ServiceServices.getAllServices(req.user, filterables, pagination);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Services retrieved successfully',
        data: result,
    });
});
const deleteService = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await service_service_1.ServiceServices.deleteService(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Service deleted successfully',
        data: result,
    });
});
const getServicesForAddStaff = (0, catchAsync_1.default)(async (req, res) => {
    const result = await service_service_1.ServiceServices.getServicesForAddStaff();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Services retrieved successfully',
        data: result,
    });
});
exports.ServiceController = {
    createService,
    updateService,
    getSingleService,
    getAllServices,
    deleteService,
    getServicesForAddStaff,
};
