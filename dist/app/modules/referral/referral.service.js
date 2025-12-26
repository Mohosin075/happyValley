"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const referral_model_1 = require("./referral.model");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const referral_constants_1 = require("./referral.constants");
const mongoose_1 = require("mongoose");
const createReferral = async (user, payload) => {
    try {
        // Check if the referral already exists
        const existingReferral = await referral_model_1.Referral.findOne({
            referralEmail: payload.referralEmail,
            referredBy: user.authId,
        });
        if (existingReferral) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'You have already referred this user.');
        }
        const result = await referral_model_1.Referral.create({
            ...payload,
            referredBy: user.authId,
        });
        if (!result) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create Referral, please try again with valid data.');
        }
        return result;
    }
    catch (error) {
        throw error;
    }
};
const getAllReferrals = async (user, filterables, pagination) => {
    const { searchTerm, ...filterData } = filterables;
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    const andConditions = [];
    // Search functionality
    if (searchTerm) {
        andConditions.push({
            $or: referral_constants_1.referralSearchableFields.map(field => ({
                [field]: {
                    $regex: searchTerm,
                    $options: 'i',
                },
            })),
        });
    }
    // Filter functionality
    if (Object.keys(filterData).length) {
        andConditions.push({
            $and: Object.entries(filterData).map(([key, value]) => ({
                [key]: value,
            })),
        });
    }
    const whereConditions = andConditions.length ? { $and: andConditions } : {};
    const [result, total] = await Promise.all([
        referral_model_1.Referral.find(whereConditions)
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate({
            path: 'referredBy',
            select: 'email phone verified',
        }),
        referral_model_1.Referral.countDocuments(whereConditions),
    ]);
    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: result,
    };
};
const getSingleReferral = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Referral ID');
    }
    const result = await referral_model_1.Referral.findById(id).populate('referredBy');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested referral not found, please try again with valid id');
    }
    return result;
};
const updateReferral = async (id, payload) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Referral ID');
    }
    const result = await referral_model_1.Referral.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { $set: payload }, {
        new: true,
        runValidators: true,
    }).populate('referredBy');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested referral not found, please try again with valid id');
    }
    return result;
};
const deleteReferral = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Referral ID');
    }
    const result = await referral_model_1.Referral.findByIdAndDelete(id);
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Something went wrong while deleting referral, please try again with valid id.');
    }
    return result;
};
exports.ReferralServices = {
    createReferral,
    getAllReferrals,
    getSingleReferral,
    updateReferral,
    deleteReferral,
};
