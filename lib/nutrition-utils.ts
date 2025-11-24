/**
 * Nutrition calculation utilities
 * Business logic for nutrition calculations, separated from UI components
 */

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  conversionFactor: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  caloriesPer100g: number;
}

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

/**
 * Calculate macros for a given food and amount
 * @param food - The food item
 * @param amount - Amount in grams
 * @returns Calculated macros
 */
export function calculateMacros(food: FoodItem, amount: number): Macros {
  return {
    protein: (food.proteinPer100g * amount) / 100,
    carbs: (food.carbsPer100g * amount) / 100,
    fat: (food.fatPer100g * amount) / 100,
    calories: (food.caloriesPer100g * amount) / 100,
  };
}

/**
 * Calculate the amount of target food needed to match source food macros
 * @param sourceFood - Source food item
 * @param sourceAmount - Source amount in grams
 * @param targetFood - Target food item
 * @returns Calculated target amount in grams
 */
export function calculateSwapAmount(
  sourceFood: FoodItem,
  sourceAmount: number,
  targetFood: FoodItem
): number {
  if (sourceAmount <= 0) return 0;
  return (sourceAmount * targetFood.conversionFactor) / sourceFood.conversionFactor;
}

/**
 * Calculate macro differences between source and target
 * @param sourceMacros - Source food macros
 * @param targetMacros - Target food macros
 * @returns Differences in each macro
 */
export function calculateMacroDifferences(
  sourceMacros: Macros,
  targetMacros: Macros
): Macros {
  return {
    protein: targetMacros.protein - sourceMacros.protein,
    carbs: targetMacros.carbs - sourceMacros.carbs,
    fat: targetMacros.fat - sourceMacros.fat,
    calories: targetMacros.calories - sourceMacros.calories,
  };
}

/**
 * Calculate match quality between source and target macros
 * Returns a quality score and display information
 * @param sourceMacros - Source food macros
 * @param targetMacros - Target food macros
 * @returns Match quality information
 */
export function getMatchQuality(
  sourceMacros: Macros,
  targetMacros: Macros
): { text: string; color: 'green' | 'yellow' | 'red'; score: number } {
  const diffs = calculateMacroDifferences(sourceMacros, targetMacros);
  
  // Calculate relative differences (avoid division by zero)
  const proteinMatch = Math.abs(diffs.protein) / (sourceMacros.protein || 1);
  const carbsMatch = Math.abs(diffs.carbs) / (sourceMacros.carbs || 1);
  const fatMatch = Math.abs(diffs.fat) / (sourceMacros.fat || 1);
  const calorieMatch = Math.abs(diffs.calories) / (sourceMacros.calories || 1);
  
  // Average match (lower is better)
  const avgMatch = (proteinMatch + carbsMatch + fatMatch + calorieMatch) / 4;
  
  if (avgMatch < 0.1) return { text: "מצוינת", color: "green", score: avgMatch };
  if (avgMatch < 0.2) return { text: "טובה", color: "green", score: avgMatch };
  if (avgMatch < 0.3) return { text: "בינונית", color: "yellow", score: avgMatch };
  return { text: "נמוכה", color: "red", score: avgMatch };
}

/**
 * Convert NutritionSwap from database to FoodItem format
 * @param swap - NutritionSwap from database
 * @returns FoodItem for UI
 */
export function convertSwapToFoodItem(swap: {
  id: string;
  food_name: string;
  category: string;
  conversion_factor: number;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  calories_per_100g: number | null;
}): FoodItem {
  return {
    id: swap.id,
    name: swap.food_name,
    category: swap.category,
    conversionFactor: swap.conversion_factor,
    proteinPer100g: swap.protein_per_100g || 0,
    carbsPer100g: swap.carbs_per_100g || 0,
    fatPer100g: swap.fat_per_100g || 0,
    caloriesPer100g: swap.calories_per_100g || 0,
  };
}

