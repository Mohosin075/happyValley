"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserServices = exports.getStaffsByServiceId = exports.getProfile = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const user_model_1 = require("./user.model");
const user_1 = require("../../../enum/user");
const logger_1 = require("../../../shared/logger");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const config_1 = __importDefault(require("../../../config"));
const user_constants_1 = require("./user.constants");
const emailTemplate_1 = require("../../../shared/emailTemplate");
const emailHelper_1 = require("../../../helpers/emailHelper");
const service_model_1 = require("../service/service.model");
const service_1 = require("../../../enum/service");
const review_model_1 = require("../review/review.model");
const booking_model_1 = require("../booking/booking.model");
const updateProfile = async (user, payload) => {
    const isUserExist = await user_model_1.User.findOne({
        _id: user.authId,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    });
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found.');
    }
    const updatedProfile = await user_model_1.User.findOneAndUpdate({ _id: user.authId, status: { $nin: [user_1.USER_STATUS.DELETED] } }, {
        $set: payload,
    }, { new: true });
    if (!updatedProfile) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update profile.');
    }
    if (payload.services) {
        payload.services.forEach(async (serviceId) => {
            await service_model_1.Service.findByIdAndUpdate(serviceId, {
                $addToSet: { staff: updatedProfile._id },
            });
        });
    }
    return 'Profile updated successfully.';
};
const createAdmin = async () => {
    const admin = {
        email: config_1.default.super_admin.email,
        name: config_1.default.super_admin.name,
        password: config_1.default.super_admin.password,
        role: user_1.USER_ROLES.ADMIN,
        status: user_1.USER_STATUS.ACTIVE,
        verified: true,
        authentication: {
            oneTimeCode: null,
            restrictionLeftAt: null,
            expiresAt: null,
            latestRequestAt: new Date(),
            authType: 'createAccount',
        },
    };
    const isAdminExist = await user_model_1.User.findOne({
        email: admin.email,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    });
    if (isAdminExist) {
        logger_1.logger.log('info', 'Admin account already exist, skipping creation.🦥');
        return isAdminExist;
    }
    const result = await user_model_1.User.create(admin);
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create admin');
    }
    return result;
};
const createStaff = async (user, payload) => {
    var _a, _b;
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const tempPassword = Math.floor(10000000 + Math.random() * 90000000).toString();
        // 1️⃣ Create staff
        const [result] = await user_model_1.User.create([
            {
                ...payload,
                password: tempPassword,
                verified: true,
                role: user_1.USER_ROLES.STAFF,
                createdBy: user.authId,
            },
        ], { session });
        if (!result) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create staff. Please try again.');
        }
        // 2️⃣ Link services (optional)
        if ((_a = payload.services) === null || _a === void 0 ? void 0 : _a.length) {
            await Promise.all(payload.services.map(async (serviceId) => {
                const updatedService = await service_model_1.Service.findByIdAndUpdate(serviceId, { $addToSet: { staff: result._id } }, { new: true, runValidators: true, session });
                if (!updatedService) {
                    throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, `Service with ID ${serviceId} not found`);
                }
            }));
        }
        // 3️⃣ Commit transaction
        await session.commitTransaction();
        session.endSession();
        logger_1.logger.info('Staff created with transactional integrity', {
            staffId: result._id,
            services: (_b = payload.services) !== null && _b !== void 0 ? _b : [],
            createdBy: user.authId,
        });
        // 4️⃣ Send email (OUTSIDE transaction)
        if (result.email) {
            const emailContent = (0, emailTemplate_1.staffCreateTemplate)({
                email: result.email,
                name: result.name,
                role: user_1.USER_ROLES.STAFF,
                otp: tempPassword,
            });
            // non-blocking failure is acceptable
            emailHelper_1.emailHelper.sendEmail(emailContent).catch(err => {
                logger_1.logger.error('Staff email failed', { err, staffId: result._id });
            });
        }
        return result;
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error.code === 11000) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Duplicate entry found');
        }
        throw error;
    }
};
const getAllUsers = async (paginationOptions, filterables = {}) => {
    const { searchTerm, ...otherFilters } = filterables;
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(paginationOptions);
    const matchConditions = [];
    // 🔍 Search
    if (searchTerm) {
        matchConditions.push({
            $or: user_constants_1.userSearchableFields.map(field => ({
                [field]: { $regex: searchTerm, $options: 'i' },
            })),
        });
    }
    // 🎯 Filters
    for (const [key, value] of Object.entries(otherFilters)) {
        matchConditions.push({ [key]: value });
    }
    // 🛑 Exclude deleted users
    matchConditions.push({
        status: { $nin: [user_1.USER_STATUS.DELETED, null] },
    });
    const matchStage = matchConditions.length ? { $and: matchConditions } : {};
    const pipeline = [
        { $match: matchStage },
        // 🔗 Join completed bookings (USER → bookings)
        {
            $lookup: {
                from: 'bookings',
                let: { userId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$user', '$$userId'] },
                                    { $eq: ['$status', 'completed'] },
                                ],
                            },
                        },
                    },
                    {
                        $project: { price: 1 },
                    },
                ],
                as: 'completedBookings',
            },
        },
        // 🧮 Metrics
        {
            $addFields: {
                completedServiceCount: { $size: '$completedBookings' },
                totalSpent: {
                    $sum: '$completedBookings.price',
                },
            },
        },
        // 🚫 Cleanup
        {
            $project: {
                password: 0,
                authentication: 0,
                __v: 0,
                completedBookings: 0,
            },
        },
        // 📊 Sorting
        {
            $sort: sortBy
                ? { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
                : { createdAt: -1 },
        },
        // 📄 Pagination
        { $skip: skip },
        { $limit: limit },
    ];
    const [data, totalResult] = await Promise.all([
        user_model_1.User.aggregate(pipeline),
        user_model_1.User.countDocuments(matchStage),
    ]);
    return {
        meta: {
            page,
            limit,
            total: totalResult,
            totalPages: Math.ceil(totalResult / limit),
        },
        data,
    };
};
const deleteUser = async (userId) => {
    const isUserExist = await user_model_1.User.findOne({
        _id: userId,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    });
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found.');
    }
    const deletedUser = await user_model_1.User.findOneAndUpdate({ _id: userId, status: { $nin: [user_1.USER_STATUS.DELETED] } }, { $set: { status: user_1.USER_STATUS.DELETED } }, { new: true });
    if (!deletedUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to delete user.');
    }
    return 'User deleted successfully.';
};
const deleteProfile = async (userId, password) => {
    const isUserExist = await user_model_1.User.findOne({
        _id: userId,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    }).select('+password');
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found.');
    }
    const isPasswordMatched = await user_model_1.User.isPasswordMatched(password, isUserExist.password);
    if (!isPasswordMatched) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Password is incorrect.');
    }
    const deletedUser = await user_model_1.User.findOneAndUpdate({ _id: userId, status: { $nin: [user_1.USER_STATUS.DELETED] } }, { $set: { status: user_1.USER_STATUS.DELETED } }, { new: true });
    if (!deletedUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to delete user.');
    }
    return 'User deleted successfully.';
};
const getUserById = async (userId) => {
    const isUserExist = await user_model_1.User.findOne({
        _id: userId,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    });
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found.');
    }
    const user = await user_model_1.User.findOne({
        _id: userId,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    }).select('-password -authentication -__v');
    return user;
};
const updateUser = async (userId, payload) => {
    const isUserExist = await user_model_1.User.findOne({
        _id: userId,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    });
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found.');
    }
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const updatedUser = await user_model_1.User.findOneAndUpdate({ _id: userId, status: { $nin: [user_1.USER_STATUS.DELETED] } }, { $set: payload }, { new: true, session });
        if (!updatedUser) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update user.');
        }
        // Update Service model if services are changed
        if (payload.services) {
            // 1. Remove this staff from all services they were previously assigned to
            await service_model_1.Service.updateMany({ staff: userId }, { $pull: { staff: userId } }, { session });
            // 2. Add this staff to the new list of services
            if (payload.services.length > 0) {
                await service_model_1.Service.updateMany({ _id: { $in: payload.services } }, { $addToSet: { staff: userId } }, { session });
            }
        }
        await session.commitTransaction();
        session.endSession();
        return updatedUser;
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};
const updateAvailability = async (user, isAvailable) => {
    const isUserExist = await user_model_1.User.findOne({
        _id: user.authId,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    });
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found.');
    }
    const updatedUser = await user_model_1.User.findOneAndUpdate({ _id: user.authId, status: { $nin: [user_1.USER_STATUS.DELETED] } }, { $set: { isAvailable } }, { new: true }).select('isAvailable');
    if (!updatedUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update availability.');
    }
    return updatedUser;
};
const getProfile = async (user) => {
    // --- Fetch user ---
    const isUserExist = await user_model_1.User.findOne({
        _id: user.authId,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    }).select('-authentication -password -__v').populate({ path: 'services', select: 'name' });
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found.');
    }
    // Convert to object to add custom fields
    const profileData = isUserExist.toObject();
    // --- Add statistics if user is STAFF ---
    if (isUserExist.role === user_1.USER_ROLES.STAFF) {
        const [ratings, completed] = await Promise.all([
            // ⭐ Staff Average Rating
            review_model_1.Review.aggregate([
                { $match: { reviewee: isUserExist._id, status: 'approved' } },
                {
                    $group: {
                        _id: '$reviewee',
                        avgRating: { $avg: '$rating' },
                    },
                },
            ]),
            // ✅ Completed Services Count
            booking_model_1.Booking.countDocuments({
                staff: isUserExist._id,
                status: 'completed',
            }),
        ]);
        profileData.avgRating = ratings.length > 0 ? ratings[0].avgRating : 0;
        profileData.completedServiceCount = completed;
    }
    return profileData;
};
exports.getProfile = getProfile;
const getAllStaff = async (paginationOptions, filterables = {}) => {
    console.log('hit');
    const { searchTerm, ...otherFilters } = filterables;
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(paginationOptions);
    const andConditions = [];
    andConditions.push({ role: user_1.USER_ROLES.STAFF });
    // 🔍 Search functionality
    if (searchTerm) {
        andConditions.push({
            $or: user_constants_1.userSearchableFields.map(field => ({
                [field]: { $regex: searchTerm, $options: 'i' },
            })),
        });
    }
    // 🎯 Dynamic filters (role, verified, isAvailable, etc.)
    if (Object.keys(otherFilters).length) {
        for (const [key, value] of Object.entries(otherFilters)) {
            andConditions.push({ [key]: value });
        }
    }
    else {
        // Default to available staff if no specific filter provided (optional: might want to show all for admin)
        // but usually for public/client views we only want available staff.
        // For now, let's just make it possible to filter.
    }
    // 🛑 Always exclude deleted users
    andConditions.push({
        status: { $nin: [user_1.USER_STATUS.DELETED, null] },
    });
    // 💡 Final query object
    const whereConditions = andConditions.length ? { $and: andConditions } : {};
    const [result, total] = await Promise.all([
        user_model_1.User.find(whereConditions)
            .skip(skip)
            .limit(limit)
            .sort(sortBy ? { [sortBy]: sortOrder } : { createdAt: -1 })
            .select('-password -authentication -__v').populate({ path: 'services', select: 'name' }),
        user_model_1.User.countDocuments(whereConditions),
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
const getStaffById = async (userId) => {
    console.log(userId);
    const isUserExist = await user_model_1.User.findOne({
        _id: userId,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    });
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found.');
    }
    const user = await user_model_1.User.findOne({
        _id: userId,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    }).select('-password -authentication -__v').populate({ path: 'services', select: 'name' });
    return user;
};
const getStaffsByServiceId = async (serviceId) => {
    // 1. Check if service exists
    const service = await service_model_1.Service.findOne({
        _id: serviceId,
        status: { $nin: [service_1.SERVICE_STATUS.DELETED] },
    })
        .populate({
        path: 'staff',
        match: { isAvailable: true, status: user_1.USER_STATUS.ACTIVE },
        select: 'name email role _id profile isAvailable',
    })
        .lean();
    if (!service) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Service not found.');
    }
    // Filter out any null staff that didn't match the 'match' criteria in populate
    const validStaff = (service.staff || []).filter(s => s !== null);
    const staffIds = validStaff.map(s => s._id) || [];
    // 2. Fetch rating + completed bookings
    const [ratings, completed] = await Promise.all([
        // ⭐ Staff Ratings
        review_model_1.Review.aggregate([
            { $match: { reviewee: { $in: staffIds }, status: 'approved' } },
            {
                $group: {
                    _id: '$reviewee',
                    avgRating: { $avg: '$rating' },
                },
            },
        ]),
        // ✅ Completed Services Count
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    staff: { $in: staffIds },
                    status: 'completed',
                },
            },
            {
                $group: {
                    _id: '$staff',
                    completedCount: { $sum: 1 },
                },
            },
        ]),
    ]);
    // 3. Convert arrays to maps for faster lookup
    const ratingMap = new Map(ratings.map(r => [String(r._id), r.avgRating]));
    const completedMap = new Map(completed.map(c => [String(c._id), c.completedCount]));
    // 4. Attach data to staff list
    const staffData = validStaff.map(staff => ({
        ...staff,
        avgRating: ratingMap.get(String(staff._id)) || 0,
        completedServices: completedMap.get(String(staff._id)) || 0,
    }));
    return {
        serviceId,
        totalStaff: staffData.length,
        staffs: staffData,
    };
};
exports.getStaffsByServiceId = getStaffsByServiceId;
exports.UserServices = {
    updateProfile,
    createAdmin,
    createStaff,
    getAllUsers,
    deleteUser,
    getUserById,
    updateUser,
    getProfile: exports.getProfile,
    deleteProfile,
    getAllStaff,
    getStaffById,
    getStaffsByServiceId: exports.getStaffsByServiceId,
    updateAvailability,
};
