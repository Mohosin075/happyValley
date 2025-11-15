// Filterable fields for Referral
export const referralFilterables = ['yourName', 'referralName', 'referralEmail', 'referralPhone', 'notes'];

// Searchable fields for Referral
export const referralSearchableFields = ['yourName', 'referralName', 'referralEmail', 'referralPhone', 'notes'];

// Helper function for set comparison
export const isSetEqual = (setA: Set<string>, setB: Set<string>): boolean => {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
};