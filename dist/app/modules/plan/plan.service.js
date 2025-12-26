"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageService = exports.updatePlanToDB = void 0;
const http_status_codes_1 = require("http-status-codes");
const plan_model_1 = require("./plan.model");
const mongoose_1 = __importDefault(require("mongoose"));
const stripe_1 = __importDefault(require("../../../config/stripe"));
const createStripeProductCatalog_1 = require("../../../stripe/createStripeProductCatalog");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const updateStripeProductCatalog_1 = require("../../../stripe/updateStripeProductCatalog");
const createPlanToDB = async (payload) => {
    const productPayload = {
        title: payload.title,
        description: payload.description,
        duration: payload.duration,
        price: Number(payload.price),
    };
    // For paid plans, create a Stripe product
    const product = await (0, createStripeProductCatalog_1.createStripeProductCatalog)(productPayload);
    if (!product) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create subscription product in Stripe.');
    }
    // Attach Stripe details to payload
    // payload.paymentLink = product.paymentLink
    payload.productId = product.productId;
    payload.priceId = product.priceId;
    // Create the plan in DB
    try {
        const result = await plan_model_1.Plan.create(payload);
        return result;
    }
    catch (err) {
        // Rollback Stripe product if DB creation fails
        await stripe_1.default.products.del(product.productId);
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create the plan in database.');
    }
};
const updatePlanToDB = async (id, payload) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Plan ID');
    }
    // Step 1: Fetch the current plan
    const existingPlan = await plan_model_1.Plan.findById(id);
    if (!existingPlan) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Plan not found');
    }
    // Step 2: Update Stripe product if price or duration changed
    let stripeUpdate = {};
    if (!existingPlan.productId) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Stripe productId is missing');
    }
    if (payload.price || payload.duration) {
        stripeUpdate = await (0, updateStripeProductCatalog_1.updateStripeProductCatalog)(existingPlan.productId, {
            ...existingPlan.toObject(),
            ...payload, // merge updates
        });
    }
    // Step 3: Merge payload + Stripe update
    const updatedData = {
        ...payload,
        ...stripeUpdate,
        updatedAt: new Date(),
    };
    // Step 4: Update DB and return updated document
    const result = await plan_model_1.Plan.findByIdAndUpdate(id, updatedData, { new: true });
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update plan');
    }
    return result;
};
exports.updatePlanToDB = updatePlanToDB;
const getPlanFromDB = async (paymentType) => {
    const query = {
        status: 'active',
    };
    if (paymentType) {
        query.paymentType = paymentType;
    }
    const result = await plan_model_1.Plan.find(query);
    return result;
};
const getPlanDetailsFromDB = async (id) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid ID');
    }
    const result = await plan_model_1.Plan.findById(id);
    return result;
};
const deletePlanToDB = async (id) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid ID');
    }
    const result = await plan_model_1.Plan.findByIdAndUpdate({ _id: id }, { status: 'Delete' }, { new: true });
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to deleted Package');
    }
    return result;
};
exports.PackageService = {
    createPlanToDB,
    updatePlanToDB: exports.updatePlanToDB,
    getPlanFromDB,
    getPlanDetailsFromDB,
    deletePlanToDB,
};
