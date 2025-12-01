export interface Category {
  name: string;
  bg: string;
  textColor: string;
}

export const categories: Record<string, Category> = {
  // Default/fallback category
  default: {
    name: 'Other',
    bg: 'bg-blue-600',
    textColor: 'text-blue-600',
  },

  // Event categories
  protesters: {
    name: 'Protesters',
    bg: 'bg-green-400',
    textColor: 'text-green-600',
  },

  police: {
    name: 'Police and Security',
    bg: 'bg-red-600',
    textColor: 'text-red-600',
  },

  administration: {
    name: 'UCLA Administration',
    bg: 'bg-red-400',
    textColor: 'text-red-500',
  },

  counterprotesters: {
    name: 'Counter-Protesters',
    bg: 'bg-yellow-600',
    textColor: 'text-yellow-700',
  },

  media: {
    name: 'Media',
    bg: 'bg-purple-600',
    textColor: 'text-purple-600',
  }

};

/**
 * Get category object by name
 * @param categoryName - The category name (case-insensitive)
 * @returns Category object with name and bg color
 */
export function getCategory(categoryName?: string): Category {
  if (!categoryName) return categories.default;

  const normalizedCategory = categoryName.toLowerCase().trim().replace(/\s+/g, '');
  return categories[normalizedCategory] || categories.default;
}
