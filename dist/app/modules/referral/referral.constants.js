"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSetEqual = exports.referralSearchableFields = exports.referralFilterables = void 0;
// Filterable fields for Referral
exports.referralFilterables = ['yourName', 'referralName', 'referralEmail', 'referralPhone', 'notes'];
// Searchable fields for Referral
exports.referralSearchableFields = ['yourName', 'referralName', 'referralEmail', 'referralPhone', 'notes'];
// Helper function for set comparison
const isSetEqual = (setA, setB) => {
    if (setA.size !== setB.size)
        return false;
    for (const item of setA) {
        if (!setB.has(item))
            return false;
    }
    return true;
};
exports.isSetEqual = isSetEqual;
