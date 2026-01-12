"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingValidations = void 0;
const zod_1 = require("zod");
const objectId = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
// Preprocess to ensure date is valid
const dateField = zod_1.z.preprocess(val => {
    if (!val)
        return undefined;
    const d = new Date(val);
    if (isNaN(d.getTime()))
        return undefined;
    // zero out time to store day only
    d.setHours(0, 0, 0, 0);
    return d;
}, zod_1.z.date());
// Validate time as HH:mm string
const timeField = zod_1.z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)');
exports.BookingValidations = {
    create: zod_1.z.object({
        body: zod_1.z.object({
            user: objectId.optional(),
            service: objectId.optional(),
            staff: objectId.optional(),
            date: dateField, // required
            startTime: timeField.optional(), // optional HH:mm
            endTime: timeField.optional(), // optional HH:mm
            address: zod_1.z
                .object({
                address: zod_1.z.string().optional(),
                city: zod_1.z.string().optional(),
                state: zod_1.z.string().optional(),
                zipCode: zod_1.z.string().optional(),
            })
                .optional(),
            serviceType: zod_1.z.object({
                title: zod_1.z.string(),
                description: zod_1.z.string().optional(),
            }),
            serviceDetails: zod_1.z
                .array(zod_1.z.object({
                name: zod_1.z.string(),
                value: zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean()]).optional(),
            }))
                .default([]),
            notes: zod_1.z.string().optional(),
            status: zod_1.z
                .enum([
                'confirmed',
                'inProgress',
                'completed',
                'cancelled',
                'requested',
                'scheduled',
            ])
                .optional(),
        }),
    }),
    updateBookingStatus: zod_1.z.object({
        body: zod_1.z.object({
            status: zod_1.z.enum([
                'confirmed',
                'inProgress',
                'completed',
                'cancelled',
                'requested',
                'scheduled',
            ]),
        }),
    }),
    update: zod_1.z.object({
        body: zod_1.z.object({
            status: zod_1.z
                .enum([
                'confirmed',
                'inProgress',
                'completed',
                'cancelled',
                'requested',
                'scheduled',
            ])
                .optional(),
        }),
    }),
    updatePrice: zod_1.z.object({
        body: zod_1.z.object({
            price: zod_1.z.number().nonnegative(),
        }),
    }),
    updateFees: zod_1.z.object({
        body: zod_1.z.object({
            bookingFee: zod_1.z.number().nonnegative().optional(),
            serviceCharge: zod_1.z.number().nonnegative().optional(),
        }),
    }),
    groceryChat: zod_1.z.object({
        body: zod_1.z.object({
            sessionId: objectId.optional(),
            message: zod_1.z.string().min(1, 'Message is required'),
        }),
    }),
    confirmGroceryChat: zod_1.z.object({
        body: zod_1.z.object({
            sessionId: objectId,
        }),
    }),
    reuseGroceryChat: zod_1.z.object({
        body: zod_1.z.object({
            sessionId: objectId,
            pastOrderId: objectId,
        }),
    }),
};
