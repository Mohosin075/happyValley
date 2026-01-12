"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceValidations = void 0;
const zod_1 = require("zod");
exports.ServiceValidations = {
    create: zod_1.z.object({
        body: zod_1.z.object({
            name: zod_1.z.string(),
            description: zod_1.z.string().optional(),
            servicesProvided: zod_1.z.array(zod_1.z.string()),
            occasions: zod_1.z.array(zod_1.z.string()).optional(),
            staff: zod_1.z.array(zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(), // ObjectId strings
            serviceType: zod_1.z
                .array(zod_1.z.object({
                title: zod_1.z.string(),
                description: zod_1.z.string(),
            }))
                .optional(),
            fields: zod_1.z
                .array(zod_1.z.object({
                name: zod_1.z.string(),
                type: zod_1.z.enum(['string', 'number', 'boolean']), // stricter typing
                label: zod_1.z.string(),
            }))
                .optional(),
        }),
    }),
    update: zod_1.z.object({
        body: zod_1.z.object({
            name: zod_1.z.string().optional(),
            description: zod_1.z.string().optional(),
            servicesProvided: zod_1.z.array(zod_1.z.string()).optional(),
            occasions: zod_1.z.array(zod_1.z.string()).optional(),
            image: zod_1.z.string().optional(),
            staff: zod_1.z.array(zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
            serviceType: zod_1.z
                .array(zod_1.z.object({
                title: zod_1.z.string(),
                description: zod_1.z.string(),
            }))
                .optional(),
            fields: zod_1.z
                .array(zod_1.z.object({
                name: zod_1.z.string(),
                type: zod_1.z.enum(['string', 'number', 'boolean']),
                label: zod_1.z.string(),
            }))
                .optional(),
        }),
    }),
};
