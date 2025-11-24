/**
 * Constants for exercise identification and matching
 * Used to identify exercise variations for 1RM calculations and progress tracking
 */

/**
 * Exercise name variations for bench press / chest press exercises
 * Used to identify different naming conventions for the same exercise
 */
export const BENCH_PRESS_EXERCISE_NAMES = [
  'לחיצת חזה',
  'bench press',
  'לחיצה בחזה',
  'חזה',
  'chest press',
  'לחיצת חזה כנגד מוט',
  'לחיצת חזה עם משקולות',
] as const;

/**
 * Muscle group identifiers for chest exercises
 */
export const CHEST_MUSCLE_GROUP_NAMES = [
  'חזה',
  'chest',
  'pectorals',
] as const;

/**
 * Check if an exercise name or muscle group matches bench press variations
 * @param exerciseName - The exercise name to check
 * @param muscleGroup - The muscle group to check
 * @returns true if the exercise is a bench press variation
 */
export function isBenchPressExercise(
  exerciseName: string | null | undefined,
  muscleGroup: string | null | undefined
): boolean {
  const name = (exerciseName || '').toLowerCase();
  const group = (muscleGroup || '').toLowerCase();
  
  return (
    BENCH_PRESS_EXERCISE_NAMES.some(bpName => name.includes(bpName.toLowerCase())) ||
    CHEST_MUSCLE_GROUP_NAMES.some(chestName => group.includes(chestName.toLowerCase()))
  );
}

