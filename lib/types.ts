// Database Types for Universal FitLog

export type UserRole = 'trainer' | 'trainee';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  trainer_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  video_url: string | null;
  image_url: string | null;
  muscle_group: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutPlan {
  id: string;
  trainee_id: string;
  trainer_id: string;
  name: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  weekly_target_workouts: number;
  created_at: string;
  updated_at: string;
}

export type RoutineLetter = 'A' | 'B' | 'C' | 'D' | 'E';

export interface Routine {
  id: string;
  plan_id: string;
  letter: RoutineLetter;
  name: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number;
  rir_target: number; // 0-4
  rest_time_seconds: number;
  notes: string | null;
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
  exercise?: Exercise; // For joined queries
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  routine_id: string;
  date: string;
  body_weight: number | null;
  start_time: string;
  end_time: string | null;
  notes: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
  routine?: Routine; // For joined queries
}

export interface SetLog {
  id: string;
  log_id: string;
  exercise_id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  rir_actual: number; // 0-4
  notes: string | null;
  created_at: string;
  exercise?: Exercise; // For joined queries
}

export interface NutritionSwap {
  id: string;
  food_name: string;
  category: string;
  conversion_factor: number;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  calories_per_100g: number | null;
  created_at: string;
}

export interface DailyNutritionLog {
  id: string;
  user_id: string;
  date: string;
  total_protein: number | null;
  total_carbs: number | null;
  total_fat: number | null;
  total_calories: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Extended types for UI
export interface RoutineWithExercises extends Routine {
  routine_exercises: (RoutineExercise & { exercise: Exercise })[];
}

export interface WorkoutLogWithDetails extends WorkoutLog {
  routine: Routine;
  set_logs: (SetLog & { exercise: Exercise })[];
}

// Helper types for creating new records
export type CreateUser = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type CreateExercise = Omit<Exercise, 'id' | 'created_at' | 'updated_at'>;
export type CreateWorkoutPlan = Omit<WorkoutPlan, 'id' | 'created_at' | 'updated_at'>;
export type CreateRoutine = Omit<Routine, 'id' | 'created_at' | 'updated_at'>;
export type CreateRoutineExercise = Omit<RoutineExercise, 'id' | 'created_at' | 'updated_at'>;
export type CreateWorkoutLog = Omit<WorkoutLog, 'id' | 'created_at' | 'updated_at'>;
export type CreateSetLog = Omit<SetLog, 'id' | 'created_at'>;

export interface NutritionMenu {
  meals: Array<{
    id: string;
    mealName: string;
    foods: Array<{
      id: string;
      foodName: string;
      amount: string;
    }>;
  }>;
}
