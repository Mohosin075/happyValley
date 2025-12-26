"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityServices = void 0;
const availability_model_1 = require("./availability.model");
const updateAvailability = async (staffId, date, isBooked) => {
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0); // Normalize to start of day
    // Upsert: Update if exists, Insert if not
    const result = await availability_model_1.Availability.findOneAndUpdate({
        staff: staffId,
        date: queryDate,
    }, {
        $set: { isBooked },
    }, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
    });
    return result;
};
const checkAvailability = async (staffId, date) => {
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);
    const record = await availability_model_1.Availability.findOne({
        staff: staffId,
        date: queryDate,
    });
    return record ? !record.isBooked : true; // If no record, assume available
};
exports.AvailabilityServices = {
    updateAvailability,
    checkAvailability,
};
