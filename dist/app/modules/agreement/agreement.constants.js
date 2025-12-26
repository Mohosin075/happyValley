"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSetEqual = exports.agreementSearchableFields = exports.agreementFilterables = void 0;
// Filterable fields for Agreement
exports.agreementFilterables = ['clientName', 'signatureUrl', 'propertyAddress'];
// Searchable fields for Agreement
exports.agreementSearchableFields = ['clientName', 'signatureUrl', 'propertyAddress'];
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
