"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgreementValidations = void 0;
const zod_1 = require("zod");
exports.AgreementValidations = {
    create: zod_1.z.object({
        body: zod_1.z.object({
            clientName: zod_1.z.string(),
            date: zod_1.z.string().datetime(),
            signatureUrl: zod_1.z.string(),
            propertyAddress: zod_1.z.string(),
        }),
    }),
};
