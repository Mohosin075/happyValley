"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const booking_model_1 = require("./booking.model");
const service_model_1 = require("../service/service.model");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const booking_constants_1 = require("./booking.constants");
const mongoose_1 = require("mongoose");
const user_1 = require("../../../enum/user");
const availability_service_1 = require("../availability/availability.service");
const subscription_model_1 = require("../subscription/subscription.model");
const notifications_service_1 = require("../notifications/notifications.service");
const notifications_constants_1 = require("../notifications/notifications.constants");
const createBooking = async (user, payload) => {
    try {
        // Validate if staff is assigned to the service
        if (payload.staff) {
            const service = await service_model_1.Service.findById(payload.service);
            if (!service) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Service not found');
            }
            // Check if staff is in service.staff
            const isStaffValid = service.staff.some((s) => s.toString() === payload.staff.toString());
            if (!isStaffValid) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Selected staff is not assigned to this service');
            }
            // Check for conflicts: One staff per client per day
            if (payload.date) {
                const startOfDay = new Date(payload.date);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(payload.date);
                endOfDay.setHours(23, 59, 59, 999);
                const existingBooking = await booking_model_1.Booking.findOne({
                    staff: payload.staff,
                    date: { $gte: startOfDay, $lte: endOfDay },
                    status: { $in: ['scheduled', 'confirmed', 'inProgress'] },
                });
                if (existingBooking) {
                    throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Staff is already booked for this entire day.');
                }
            }
            // If staff is valid and no conflict, set status to scheduled
            payload.status = 'scheduled';
        }
        // Force price to 0 on creation to prevent pre-prices
        payload.price = 0;
        const isPremiumUser = await subscription_model_1.Subscription.findOne({ user: user.authId });
        console.log(isPremiumUser);
        if ((isPremiumUser === null || isPremiumUser === void 0 ? void 0 : isPremiumUser.status) === 'active') {
            payload.bookingFee = 0;
        }
        else {
            payload.bookingFee = 150;
        }
        const result = await booking_model_1.Booking.create({ ...payload, user: user.authId });
        if (!result) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create Booking, please try again with valid data.');
        }
        // Update availability
        if (payload.staff && payload.date) {
            await availability_service_1.AvailabilityServices.updateAvailability(payload.staff, payload.date, true);
        }
        await result.populate('user');
        return result;
    }
    catch (error) {
        if (error.code === 11000) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Duplicate entry found');
        }
        throw error;
    }
};
const getAllBookings = async (user, filterables, pagination) => {
    const { searchTerm, ...filterData } = filterables;
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    const andConditions = [];
    // Search functionality
    if (searchTerm) {
        andConditions.push({
            $or: booking_constants_1.bookingSearchableFields.map(field => ({
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
        booking_model_1.Booking.find(whereConditions)
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate({
            path: 'user',
            select: '-password -__v -createdAt -updatedAt -authentication',
        }),
        booking_model_1.Booking.countDocuments(whereConditions),
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
const getSingleBooking = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Booking ID');
    }
    const result = await booking_model_1.Booking.findById(id).populate({
        path: 'user',
        select: '-password -__v -createdAt -updatedAt -authentication',
    });
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested booking not found, please try again with valid id');
    }
    return result;
};
const updateBooking = async (id, payload) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Booking ID');
    }
    const updateData = { ...payload };
    // If staff is being assigned and status is currently 'requested', update to 'scheduled'
    if (updateData.staff) {
        const booking = await booking_model_1.Booking.findById(id);
        if (booking && booking.status === 'requested') {
            updateData.status = 'scheduled';
        }
    }
    // If status is changing to 'inProgress', set startTime
    if (updateData.status === 'inProgress') {
        const now = new Date();
        // format HH:mm
        updateData.startTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
    // If status is changing to 'completed', set endTime
    if (updateData.status === 'completed') {
        const now = new Date();
        // format HH:mm
        updateData.endTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
    const result = await booking_model_1.Booking.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { $set: updateData }, {
        new: true,
        runValidators: true,
    }).populate('user');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested booking not found, please try again with valid id');
    }
    if (updateData.status) {
        await notifications_service_1.NotificationServices.sendNotification({
            to: result.user,
            title: (0, notifications_constants_1.getBookingNotificationTitle)(updateData.status),
            body: notifications_constants_1.NOTIFICATION_MESSAGES.BOOKING_STATUS_CHANGED(updateData.status),
            type: (0, notifications_constants_1.getBookingNotificationType)(updateData.status),
        });
    }
    return result;
};
const deleteBooking = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Booking ID');
    }
    const result = await booking_model_1.Booking.findByIdAndDelete(id);
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Something went wrong while deleting booking, please try again with valid id.');
    }
    return result;
};
// for staff to view their services
const myServices = async (user, filterables, pagination) => {
    const { searchTerm, ...filterData } = filterables;
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    const andConditions = [];
    // Search functionality
    if (searchTerm) {
        andConditions.push({
            $or: booking_constants_1.bookingSearchableFields.map(field => ({
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
        booking_model_1.Booking.find({ ...whereConditions, staff: user.authId })
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate({
            path: 'user',
            select: '-password -__v -createdAt -updatedAt -authentication',
        }),
        booking_model_1.Booking.countDocuments(whereConditions),
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
// for staff to get bookings by date
const getBookingsByDate = async (date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const bookings = await booking_model_1.Booking.find({
        date: {
            $gte: startOfDay,
            $lte: endOfDay,
        },
    }).populate({
        path: 'user',
        select: '-password -__v -createdAt -updatedAt -authentication',
    });
    return bookings;
};
const updateBookingStatus = async (id, status) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Booking ID');
    }
    const updateData = { status };
    // Logic for time tracking based on status change
    if (status === 'inProgress') {
        const now = new Date();
        updateData.startTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
    if (status === 'completed') {
        const now = new Date();
        updateData.endTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
    const result = await booking_model_1.Booking.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { $set: updateData }, {
        new: true,
        runValidators: true,
    }).populate('user');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested booking not found, please try again with valid id');
    }
    if (status) {
        await notifications_service_1.NotificationServices.sendNotification({
            to: result.user,
            title: (0, notifications_constants_1.getBookingNotificationTitle)(status),
            body: notifications_constants_1.NOTIFICATION_MESSAGES.BOOKING_STATUS_CHANGED(status),
            type: (0, notifications_constants_1.getBookingNotificationType)(status),
        });
    }
    // Handle availability update on cancellation
    if (status === 'cancelled' && result.staff && result.date) {
        // Check if there are other active bookings for this staff on this date
        const startOfDay = new Date(result.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(result.date);
        endOfDay.setHours(23, 59, 59, 999);
        const activeBookingsCount = await booking_model_1.Booking.countDocuments({
            staff: result.staff,
            date: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['confirmed', 'scheduled', 'inProgress'] }, // confirmed/scheduled/inProgress are active
        });
        if (activeBookingsCount === 0) {
            await availability_service_1.AvailabilityServices.updateAvailability(result.staff, result.date, false);
        }
    }
    return result;
};
const getWeeklyBookingsByUser = async (user, date) => {
    let baseDate = new Date();
    if (date === 'next') {
        // Move to next week
        baseDate.setDate(baseDate.getDate() + 7);
    }
    else if (date === 'prev') {
        // Move to previous week
        baseDate.setDate(baseDate.getDate() - 7);
    }
    else if (date) {
        // Use provided date
        baseDate = new Date(date);
    }
    // Calculate week range (Mon–Sun)
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    // Build filter
    const filter = {
        date: {
            $gte: startOfWeek,
            $lte: endOfWeek,
        },
    };
    if (user.role === user_1.USER_ROLES.CLIENT)
        filter.user = user.authId;
    if (user.role === user_1.USER_ROLES.STAFF)
        filter.staff = user.authId;
    const result = await booking_model_1.Booking.find(filter).sort({ date: 1 }).populate({
        path: 'user',
        select: '-password -__v -createdAt -updatedAt -authentication',
    });
    return {
        total: result.length,
        weekRange: {
            startOfWeek,
            endOfWeek,
        },
        data: result,
    };
};
const updatePrice = async (id, price) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Booking ID');
    }
    const result = await booking_model_1.Booking.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { $set: { price } }, {
        new: true,
        runValidators: true,
    }).populate('user');
    return result;
};
const updateBookingFees = async (id, payload) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Booking ID');
    }
    const result = await booking_model_1.Booking.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { $set: payload }, {
        new: true,
        runValidators: true,
    }).populate('user');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Booking not found');
    }
    return result;
};
exports.BookingServices = {
    createBooking,
    getAllBookings,
    getSingleBooking,
    updateBooking,
    deleteBooking,
    myServices,
    getBookingsByDate,
    updateBookingStatus,
    updatePrice,
    updateBookingFees,
    getWeeklyBookingsByUser,
};
