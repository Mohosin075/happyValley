"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlanZodValidationSchema = void 0;
const zod_1 = require("zod");
exports.createPlanZodValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string({ required_error: 'Title is required' }),
        description: zod_1.z.string({ required_error: 'Description is required' }),
        features: zod_1.z.array(zod_1.z.string({ required_error: 'Feature is required' })),
        price: zod_1.z.number({ required_error: 'Price is required' }),
        duration: zod_1.z.enum(['1 month', '3 months', '6 months', '1 year', 'One Time'], {
            required_error: 'Duration is required',
        }),
        paymentType: zod_1.z.enum(['Monthly', 'Yearly', 'One Time'], {
            required_error: 'Payment type is required',
        }),
        // Plan status
        status: zod_1.z.enum(['active', 'Delete']).default('active'),
    }),
});
