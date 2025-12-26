"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const user_model_1 = require("../modules/user/user.model");
const subscriptionGuard = async (req, res, next) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.authId;
        if (!userId) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'User not authenticated');
        }
        const user = await user_model_1.User.findById(userId).select('subscribe');
        if (!user || !user.subscribe) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.PAYMENT_REQUIRED, 'Active subscription required to access this resource');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.default = subscriptionGuard;
