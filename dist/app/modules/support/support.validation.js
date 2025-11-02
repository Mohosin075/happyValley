"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSupportSchema = exports.createSupportSchema = void 0;
const zod_1 = require("zod");
const support_1 = require("../../../enum/support");
exports.createSupportSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string().optional(),
        subject: zod_1.z.string().optional(),
        message: zod_1.z.string(),
        status: zod_1.z.enum([
            support_1.SUPPORT_STATUS.DELETED,
            support_1.SUPPORT_STATUS.IN_PROGRESS,
            support_1.SUPPORT_STATUS.SOLVED,
        ]).optional(),
        attachments: zod_1.z.array(zod_1.z.string()).optional(),
    })
});
exports.updateSupportSchema = zod_1.z.object({
    body: zod_1.z.object({
        subject: zod_1.z.string().optional(),
        message: zod_1.z.string().optional(),
        status: zod_1.z.enum([
            support_1.SUPPORT_STATUS.DELETED,
            support_1.SUPPORT_STATUS.IN_PROGRESS,
            support_1.SUPPORT_STATUS.SOLVED,
        ]).optional(),
        attachments: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
