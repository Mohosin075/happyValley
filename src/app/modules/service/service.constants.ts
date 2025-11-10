// Filterable fields for Service
export const serviceFilterables = ['name', 'description'];

// Searchable fields for Service
export const serviceSearchableFields = ['name', 'description'];

// Helper function for set comparison
export const isSetEqual = (setA: Set<string>, setB: Set<string>): boolean => {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
};