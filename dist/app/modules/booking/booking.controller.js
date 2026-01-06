"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const booking_service_1 = require("./booking.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const pick_1 = __importDefault(require("../../../shared/pick"));
const booking_constants_1 = require("./booking.constants");
const pagination_1 = require("../../../interfaces/pagination");
const createBooking = (0, catchAsync_1.default)(async (req, res) => {
    const bookingData = req.body;
    const result = await booking_service_1.BookingServices.createBooking(req.user, bookingData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Booking created successfully',
        data: result,
    });
});
const updateBooking = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const bookingData = req.body;
    const result = await booking_service_1.BookingServices.updateBooking(id, bookingData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Booking updated successfully',
        data: result,
    });
});
const getSingleBooking = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await booking_service_1.BookingServices.getSingleBooking(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Booking retrieved successfully',
        data: result,
    });
});
const getAllBookings = (0, catchAsync_1.default)(async (req, res) => {
    const filterables = (0, pick_1.default)(req.query, booking_constants_1.bookingFilterables);
    const pagination = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await booking_service_1.BookingServices.getAllBookings(req.user, filterables, pagination);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Bookings retrieved successfully',
        data: result,
    });
});
const myServices = (0, catchAsync_1.default)(async (req, res) => {
    const filterables = (0, pick_1.default)(req.query, booking_constants_1.bookingFilterables);
    const pagination = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await booking_service_1.BookingServices.myServices(req.user, filterables, pagination);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Bookings retrieved successfully',
        data: result,
    });
});
const getBookingsByDate = (0, catchAsync_1.default)(async (req, res) => {
    const { date } = req.body;
    const result = await booking_service_1.BookingServices.getBookingsByDate(date);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Bookings retrieved successfully',
        data: result,
    });
});
const deleteBooking = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await booking_service_1.BookingServices.deleteBooking(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Booking deleted successfully',
        data: result,
    });
});
const updateBookingStatus = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await booking_service_1.BookingServices.updateBookingStatus(id, status);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Booking status updated successfully',
        data: result,
    });
});
const getWeeklyBookingsByUser = (0, catchAsync_1.default)(async (req, res) => {
    const { date } = req.query;
    const result = await booking_service_1.BookingServices.getWeeklyBookingsByUser(req.user, date);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Bookings retrieved successfully',
        data: result,
    });
});
const updatePrice = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const { price } = req.body;
    const result = await booking_service_1.BookingServices.updatePrice(id, price);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Booking price updated successfully',
        data: result,
    });
});
const updateBookingFees = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const fees = req.body;
    const result = await booking_service_1.BookingServices.updateBookingFees(id, fees);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Booking fees updated successfully',
        data: result,
    });
});
exports.BookingController = {
    createBooking,
    updateBooking,
    getSingleBooking,
    getAllBookings,
    deleteBooking,
    myServices,
    getBookingsByDate,
    updateBookingStatus,
    updatePrice,
    updateBookingFees,
    getWeeklyBookingsByUser,
};
