"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceServices = exports.createService = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const service_model_1 = require("./service.model");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const service_constants_1 = require("./service.constants");
const mongoose_1 = require("mongoose");
const user_model_1 = require("../user/user.model");
const service_1 = require("../../../enum/service");
const createService = async (user, payload) => {
    try {
        // 1. Validate staff IDs
        if (payload.staff && payload.staff.length > 0) {
            for (const staffId of payload.staff) {
                if (!mongoose_1.Types.ObjectId.isValid(staffId)) {
                    throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid staff ID: ${staffId}`);
                }
                const staffExists = await user_model_1.User.exists({ _id: staffId });
                if (!staffExists) {
                    throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, `Staff not found: ${staffId}`);
                }
            }
        }
        // 2. Create the service
        const result = await service_model_1.Service.create({ ...payload, createdBy: user.authId });
        if (!result) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create Service, please try again with valid data.');
        }
        // 3. Add service to staff users
        if (payload.staff && payload.staff.length > 0) {
            await Promise.all(payload.staff.map(staffId => user_model_1.User.findByIdAndUpdate(staffId, {
                $addToSet: { services: result._id },
            })));
        }
        return result;
    }
    catch (error) {
        if (error.code === 11000) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Duplicate entry found');
        }
        throw error;
    }
};
exports.createService = createService;
const getAllServices = async (user, filterables, pagination) => {
    const { searchTerm, ...filterData } = filterables;
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    const andConditions = [];
    // Search functionality
    if (searchTerm) {
        andConditions.push({
            $or: service_constants_1.serviceSearchableFields.map(field => ({
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
        service_model_1.Service.find(whereConditions)
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate({ path: 'staff', select: 'name email phone' }),
        service_model_1.Service.countDocuments(whereConditions),
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
const getSingleService = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Service ID');
    }
    const result = await service_model_1.Service.findById(id).populate({
        path: 'staff',
        select: 'name email phone profile',
    });
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested service not found, please try again with valid id');
    }
    return result;
};
const updateService = async (id, payload) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Service ID');
    }
    console.log({ payload });
    const result = await service_model_1.Service.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { $set: payload }, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested service not found, please try again with valid id');
    }
    if (payload.staff) {
        payload.staff.forEach(async (staffId) => {
            await user_model_1.User.findByIdAndUpdate(staffId, {
                $addToSet: { services: result._id },
            });
        });
    }
    return result;
};
const deleteService = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Service ID');
    }
    const result = await service_model_1.Service.findByIdAndDelete(id);
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Something went wrong while deleting service, please try again with valid id.');
    }
    return result;
};
const getServicesForAddStaff = async () => {
    const result = await service_model_1.Service.find({ status: service_1.SERVICE_STATUS.ACTIVE }).select('name');
    return result;
};
exports.ServiceServices = {
    createService: exports.createService,
    getAllServices,
    getSingleService,
    updateService,
    deleteService,
    getServicesForAddStaff,
};
