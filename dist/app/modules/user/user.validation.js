"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = void 0;
const zod_1 = require("zod");
const user_1 = require("../../../enum/user");
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
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        profile: zod_1.z.string().url().optional(),
        businessName: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        status: zod_1.z.nativeEnum(user_1.USER_STATUS).optional(),
        verified: zod_1.z.boolean().optional(),
        address: addressSchema.optional(),
        location: pointSchema.optional(),
        password: zod_1.z.string().min(6).optional(),
        role: zod_1.z.nativeEnum(user_1.USER_ROLES).optional(),
        appId: zod_1.z.string().optional(),
        deviceToken: zod_1.z.string().optional(),
        authentication: authenticationSchema.optional(),
    }),
});
