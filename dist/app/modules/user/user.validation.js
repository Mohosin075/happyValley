"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStaffSchema = exports.STAFF_SPECIALTY = exports.updateUserSchema = void 0;
const zod_1 = require("zod");
// ------------------ SUB-SCHEMAS ------------------
const addressSchema = zod_1.z.object({
    city: zod_1.z.string().optional(),
    postalCode: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    permanentAddress: zod_1.z.string().optional(),
    presentAddress: zod_1.z.string().optional(),
});
const authenticationSchema = zod_1.z.object({
    restrictionLeftAt: zod_1.z.date().nullable().optional(),
    resetPassword: zod_1.z.boolean().optional(),
    wrongLoginAttempts: zod_1.z.number().optional(),
    passwordChangedAt: zod_1.z.date().optional(),
    oneTimeCode: zod_1.z.string().optional(),
    latestRequestAt: zod_1.z.date().optional(),
    expiresAt: zod_1.z.date().optional(),
    requestCount: zod_1.z.number().optional(),
    authType: zod_1.z.enum(['createAccount', 'resetPassword']).optional(),
});
const pointSchema = zod_1.z.object({
    type: zod_1.z.literal('Point').default('Point'),
    coordinates: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number()]).optional(), // [longitude, latitude]
});
// ------------------ UPDATE USER VALIDATION ------------------
exports.updateUserSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        name: zod_1.z.string().optional(),
        profile: zod_1.z.string().url().optional(),
        phone: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        specialty: zod_1.z.string().optional(),
        images: zod_1.z.array(zod_1.z.string()).optional(),
        address: addressSchema.optional(),
        location: pointSchema.optional(),
        appId: zod_1.z.string().optional(),
        deviceToken: zod_1.z.string().optional(),
    })
        .strict(),
});
exports.STAFF_SPECIALTY = zod_1.z.enum([
    'Cleaning',
    'Cooking',
    'Laundry',
    'Grocery',
    'Maintenance',
]);
exports.createStaffSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'Name is required' }),
        email: zod_1.z.string().email({ message: 'Invalid email address' }),
        phone: zod_1.z.string().optional(),
        specialty: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        services: zod_1.z.array(zod_1.z.string()).optional(),
        address: addressSchema.optional(),
    }),
});
