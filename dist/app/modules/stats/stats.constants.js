"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSetEqual = exports.statsSearchableFields = exports.statsFilterables = void 0;
// Filterable fields for Stats
exports.statsFilterables = [];
// Searchable fields for Stats
exports.statsSearchableFields = [];
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
