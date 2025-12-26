"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemExtractionSchema = exports.isSetEqual = exports.bookingSearchableFields = exports.bookingFilterables = void 0;
// Filterable fields for Booking
exports.bookingFilterables = [
    'startTime',
    'endTime',
    'address',
    'notes',
    'status',
];
// Searchable fields for Booking
exports.bookingSearchableFields = [
    'startTime',
    'endTime',
    'address',
    'notes',
];
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
// only for grocery booking (Kitchen Restock AI)
exports.itemExtractionSchema = {
    name: 'extract_grocery_item',
    description: 'Extract kitchen item details including name, quantity, type (e.g., vegetable, dairy, spice, meat), and brand preference from user message',
    parameters: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                description: 'Name of the grocery item',
            },
            quantity: {
                type: 'string',
                description: 'Quantity needed (e.g., "2 kg", "1 dozen", "500g")',
            },
            type: {
                type: 'string',
                description: 'Category of item (e.g., vegetable, fruit, dairy, meat, spice, grain, beverage)',
            },
            brand: {
                type: 'string',
                description: 'Preferred brand if mentioned',
            },
        },
        required: ['name', 'quantity'],
    },
};
