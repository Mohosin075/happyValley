"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralValidations = void 0;
const zod_1 = require("zod");
exports.ReferralValidations = {
    create: zod_1.z.object({
        body: zod_1.z.object({
            yourName: zod_1.z.string(),
            referralName: zod_1.z.string(),
            referralEmail: zod_1.z.string().optional(),
            referralPhone: zod_1.z.string().optional(),
            notes: zod_1.z.string().optional(),
            referredBy: zod_1.z.string().optional(),
            status: zod_1.z.enum(['pending', 'accepted', 'rejected']).optional(),
        }),
    }),
    update: zod_1.z.object({
        body: zod_1.z.object({
            yourName: zod_1.z.string().optional(),
            referralName: zod_1.z.string().optional(),
            referralEmail: zod_1.z.string().optional(),
            referralPhone: zod_1.z.string().optional(),
            notes: zod_1.z.string().optional(),
            referredBy: zod_1.z.string().optional(),
        }),
    }),
};
