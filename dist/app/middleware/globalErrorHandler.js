"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../config"));
const handleZodError_1 = __importDefault(require("../../errors/handleZodError"));
const zod_1 = require("zod");
const handleZodError_2 = __importDefault(require("../../errors/handleZodError"));
const handleCastError_1 = __importDefault(require("../../errors/handleCastError"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const globalErrorHandler = (error, req, res, next) => {
    config_1.default.node_env === 'development'
        ? console.log('Inside Global Error Handler🪐', error)
        : console.log('Inside Global Error Handler🪐', error);
    let statusCode = 500;
    let message = 'Something wen wrong!';
    let errorMessages = [];
    if ((error === null || error === void 0 ? void 0 : error.name) === 'validationError') {
        const simplifiedError = (0, handleZodError_1.default)(error);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.errorMessages[0].message;
        errorMessages = simplifiedError.errorMessages;
    }
    else if (error instanceof zod_1.ZodError) {
        const simplifiedError = (0, handleZodError_2.default)(error);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.errorMessages[0].message;
        errorMessages = simplifiedError.errorMessages;
    }
    else if ((error === null || error === void 0 ? void 0 : error.name) === 'CastError') {
        const simplifiedError = (0, handleCastError_1.default)(error);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
        errorMessages = simplifiedError.errorMessages;
    }
    else if (error instanceof ApiError_1.default) {
        statusCode = error === null || error === void 0 ? void 0 : error.statusCode;
        message = error === null || error === void 0 ? void 0 : error.message;
        errorMessages = (error === null || error === void 0 ? void 0 : error.message)
            ? [{ path: '', message: error === null || error === void 0 ? void 0 : error.message }]
            : [];
    }
    else if (error instanceof Error) {
        message = error === null || error === void 0 ? void 0 : error.message;
        errorMessages = (error === null || error === void 0 ? void 0 : error.message)
            ? [{ path: '', message: error === null || error === void 0 ? void 0 : error.message }]
            : [];
    }
    res.status(statusCode).json({
        success: false,
        message: message,
        errorMessages,
        stack: config_1.default.node_env === 'production' ? undefined : error === null || error === void 0 ? void 0 : error.stack,
    });
};
exports.default = globalErrorHandler;
