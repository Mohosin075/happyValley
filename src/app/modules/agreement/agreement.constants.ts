// Filterable fields for Agreement
export const agreementFilterables = ['clientName', 'signatureUrl', 'propertyAddress'];

// Searchable fields for Agreement
export const agreementSearchableFields = ['clientName', 'signatureUrl', 'propertyAddress'];

// Helper function for set comparison
export const isSetEqual = (setA: Set<string>, setB: Set<string>): boolean => {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
};