"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgreementController = void 0;
const agreement_service_1 = require("./agreement.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const pick_1 = __importDefault(require("../../../shared/pick"));
const agreement_constants_1 = require("./agreement.constants");
const pagination_1 = require("../../../interfaces/pagination");
const createAgreement = (0, catchAsync_1.default)(async (req, res) => {
    const agreementData = req.body;
    const result = await agreement_service_1.AgreementServices.createAgreement(req.user, agreementData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Agreement created successfully',
        data: result,
    });
});
const updateAgreement = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const agreementData = req.body;
    const result = await agreement_service_1.AgreementServices.updateAgreement(id, agreementData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Agreement updated successfully',
        data: result,
    });
});
const getSingleAgreement = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await agreement_service_1.AgreementServices.getSingleAgreement(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Agreement retrieved successfully',
        data: result,
    });
});
const getAllAgreements = (0, catchAsync_1.default)(async (req, res) => {
    const filterables = (0, pick_1.default)(req.query, agreement_constants_1.agreementFilterables);
    const pagination = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await agreement_service_1.AgreementServices.getAllAgreements(req.user, filterables, pagination);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Agreements retrieved successfully',
        data: result,
    });
});
const deleteAgreement = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await agreement_service_1.AgreementServices.deleteAgreement(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Agreement deleted successfully',
        data: result,
    });
});
exports.AgreementController = {
    createAgreement,
    updateAgreement,
    getSingleAgreement,
    getAllAgreements,
    deleteAgreement,
};
