// Filterable fields for Booking
export const bookingFilterables = [
  'startTime',
  'endTime',
  'address',
  'notes',
  'status',
]

// Searchable fields for Booking
export const bookingSearchableFields = [
  'startTime',
  'endTime',
  'address',
  'notes',
]

// Helper function for set comparison
export const isSetEqual = (setA: Set<string>, setB: Set<string>): boolean => {
  if (setA.size !== setB.size) return false
  for (const item of setA) {
    if (!setB.has(item)) return false
  }
  return true
}

// only for grocery booking

export const itemExtractionSchema = {
  name: 'extract_grocery_item',
  description: 'Extract item name and quantity from user message',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      quantity: { type: 'string' },
    },
    required: ['name', 'quantity'],
  },
}
