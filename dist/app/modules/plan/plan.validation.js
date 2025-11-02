"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlanZodValidationSchema = void 0;
const zod_1 = require("zod");
exports.createPlanZodValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string({ required_error: 'Title is required' }),
        description: zod_1.z.string({ required_error: 'Description is required' }),
        price: zod_1.z.number({ required_error: 'Price is required' }),
        duration: zod_1.z.enum(['1 month', '3 months', '6 months', '1 year'], {
            required_error: 'Duration is required',
        }),
        paymentType: zod_1.z.enum(['Monthly', 'Yearly'], {
            required_error: 'Payment type is required',
        }),
        // Content limits
        limits: zod_1.z.object({
            reelsPerWeek: zod_1.z.number().default(0),
            postsPerWeek: zod_1.z.number().default(0),
            storiesPerWeek: zod_1.z.number().default(0),
            businessesManageable: zod_1.z.number().default(1),
        }),
        // Plan status
        status: zod_1.z.enum(['active', 'Delete']).default('active'),
    }),
});
