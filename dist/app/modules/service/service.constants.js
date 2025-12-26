"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSetEqual = exports.serviceSearchableFields = exports.serviceFilterables = void 0;
// Filterable fields for Service
exports.serviceFilterables = ['name', 'description'];
// Searchable fields for Service
exports.serviceSearchableFields = ['name', 'description'];
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
