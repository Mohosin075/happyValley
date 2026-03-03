"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementSubscriptionUsage = exports.checkSubscriptionUsage = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const subscription_model_1 = require("./subscription.model");
/**
 * Checks if a user has an active subscription and has not exceeded their plan's session limit.
 * @param userId - The ID of the user to check.
 * @returns The active subscription if valid.
 * @throws ApiError if no active subscription or limit reached.
 */
const checkSubscriptionUsage = async (userId) => {
    const subscription = await subscription_model_1.Subscription.findOne({
        user: userId,
        status: 'active'
    }).populate('plan');
    if (!subscription) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.PAYMENT_REQUIRED, 'Active subscription required to access this resource');
    }
    const { plan, usage } = subscription;
    if (plan && plan.limits && plan.limits.session > 0) {
        if (usage.session >= plan.limits.session) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, `You have reached your monthly limit of ${plan.limits.session} sessions. Please upgrade your plan.`);
        }
    }
    return subscription;
};
exports.checkSubscriptionUsage = checkSubscriptionUsage;
/**
 * Increments the session usage for a user's active subscription.
 * @param userId - The ID of the user.
 */
const incrementSubscriptionUsage = async (userId) => {
    await subscription_model_1.Subscription.findOneAndUpdate({ user: userId, status: 'active' }, { $inc: { 'usage.session': 1 } });
};
exports.incrementSubscriptionUsage = incrementSubscriptionUsage;
