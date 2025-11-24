import { supabase } from './supabase';
import type {
  User,
  Exercise,
  WorkoutPlan,
  Routine,
  RoutineExercise,
  WorkoutLog,
  SetLog,
  CreateUser,
  CreateExercise,
  CreateWorkoutPlan,
  CreateRoutine,
  CreateRoutineExercise,
  CreateWorkoutLog,
  CreateSetLog,
  WorkoutLogWithDetails,
  RoutineWithExercises,
  NutritionMenu,
} from './types';

// ============= USERS =============
export async function getTrainerTrainees(trainerId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('trainer_id', trainerId)
    .eq('role', 'trainee')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createTrainee(trainee: CreateUser): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert(trainee)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUser(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

// ============= EXERCISES =============
export async function getExerciseLibrary(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercise_library')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getExercise(exerciseId: string): Promise<Exercise | null> {
  const { data, error } = await supabase
    .from('exercise_library')
    .select('*')
    .eq('id', exerciseId)
    .single();

  if (error) throw error;
  return data;
}

export async function getExerciseByName(name: string): Promise<Exercise | null> {
  // Use case-insensitive search for exact match
  const { data, error } = await supabase
    .from('exercise_library')
    .select('*')
    .ilike('name', name.trim())
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data || null;
}

export async function createExercise(exercise: CreateExercise): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercise_library')
    .insert(exercise)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateExercise(exerciseId: string, updates: Partial<Exercise>): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercise_library')
    .update(updates)
    .eq('id', exerciseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============= WORKOUT PLANS =============
export async function getActiveWorkoutPlan(traineeId: string): Promise<WorkoutPlan | null> {
  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('trainee_id', traineeId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching workout plan:', error);
    throw error;
  }
  return data || null;
}

export async function createWorkoutPlan(plan: CreateWorkoutPlan): Promise<WorkoutPlan> {
  // First, ensure the trainer exists in the users table
  const { data: existingTrainer } = await supabase
    .from('users')
    .select('id')
    .eq('id', plan.trainer_id)
    .single();

  if (!existingTrainer) {
    // Create the trainer user record if it doesn't exist
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email || 'Trainer',
          role: 'trainer'
        });
    }
  }

  // Ensure the trainee exists in the users table
  const { data: existingTrainee } = await supabase
    .from('users')
    .select('id')
    .eq('id', plan.trainee_id)
    .single();

  if (!existingTrainee) {
    // Create a basic trainee record if it doesn't exist
    await supabase
      .from('users')
      .insert({
        id: plan.trainee_id,
        email: `trainee-${plan.trainee_id}@example.com`,
        name: 'Trainee',
        role: 'trainee',
        trainer_id: plan.trainer_id
      });
  }

  const { data, error } = await supabase
    .from('workout_plans')
    .insert(plan)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWorkoutPlan(planId: string, updates: Partial<WorkoutPlan>): Promise<WorkoutPlan> {
  const { data, error } = await supabase
    .from('workout_plans')
    .update(updates)
    .eq('id', planId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============= ROUTINES =============
export async function getRoutinesWithExercises(planId: string): Promise<RoutineWithExercises[]> {
  const { data, error } = await supabase
    .from('routines')
    .select(`
      *,
      routine_exercises (
        *,
        exercise:exercise_library (*)
      )
    `)
    .eq('plan_id', planId)
    .order('order_index', { ascending: true });

  if (error) throw error;

  // Transform the data to match our type
  return (data || []).map(routine => ({
    ...routine,
    routine_exercises: (routine.routine_exercises || []).map((re: any) => ({
      ...re,
      exercise: re.exercise,
    })),
  }));
}

export async function createRoutine(routine: CreateRoutine): Promise<Routine> {
  const { data, error } = await supabase
    .from('routines')
    .insert(routine)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRoutine(routineId: string, updates: Partial<Routine>): Promise<Routine> {
  const { data, error } = await supabase
    .from('routines')
    .update(updates)
    .eq('id', routineId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRoutine(routineId: string): Promise<void> {
  const { error } = await supabase
    .from('routines')
    .delete()
    .eq('id', routineId);

  if (error) throw error;
}

// ============= ROUTINE EXERCISES =============
export async function createRoutineExercise(exercise: CreateRoutineExercise): Promise<RoutineExercise> {
  const { data, error } = await supabase
    .from('routine_exercises')
    .insert(exercise)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRoutineExercise(
  exerciseId: string,
  updates: Partial<RoutineExercise>
): Promise<RoutineExercise> {
  const { data, error } = await supabase
    .from('routine_exercises')
    .update(updates)
    .eq('id', exerciseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRoutineExercise(exerciseId: string): Promise<void> {
  const { error } = await supabase
    .from('routine_exercises')
    .delete()
    .eq('id', exerciseId);

  if (error) throw error;
}

// ============= WORKOUT LOGS =============
export async function getWorkoutLogs(traineeId: string, limit?: number): Promise<WorkoutLogWithDetails[]> {
  let query = supabase
    .from('workout_logs')
    .select(`
      *,
      routine:routines (*),
      set_logs (
        *,
        exercise:exercise_library (*)
      )
    `)
    .eq('user_id', traineeId)
    .order('date', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(log => ({
    ...log,
    routine: log.routine,
    set_logs: (log.set_logs || []).map((sl: any) => ({
      ...sl,
      exercise: sl.exercise,
    })),
  }));
}

export async function getWorkoutLog(logId: string): Promise<WorkoutLogWithDetails | null> {
  const { data, error } = await supabase
    .from('workout_logs')
    .select(`
      *,
      routine:routines (*),
      set_logs (
        *,
        exercise:exercise_library (*)
      )
    `)
    .eq('id', logId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function createWorkoutLog(log: CreateWorkoutLog): Promise<WorkoutLog> {
  const { data, error } = await supabase
    .from('workout_logs')
    .insert(log)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWorkoutLog(
  logId: string,
  updates: Partial<WorkoutLog>
): Promise<WorkoutLog> {
  const { data, error } = await supabase
    .from('workout_logs')
    .update(updates)
    .eq('id', logId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============= SET LOGS =============
export async function createSetLog(setLog: CreateSetLog): Promise<SetLog> {
  const { data, error } = await supabase
    .from('set_logs')
    .insert(setLog)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============= BODY WEIGHT =============
export async function getBodyWeightHistory(traineeId: string): Promise<Array<{ date: string; weight: number }>> {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('date, body_weight')
    .eq('user_id', traineeId)
    .not('body_weight', 'is', null)
    .order('date', { ascending: false });

  if (error) throw error;

  // Group by date and get the latest weight for each date
  const weightMap = new Map<string, number>();
  (data || []).forEach(log => {
    if (log.body_weight && !weightMap.has(log.date)) {
      weightMap.set(log.date, log.body_weight);
    }
  });

  return Array.from(weightMap.entries())
    .map(([date, weight]) => ({ date, weight }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function saveBodyWeight(traineeId: string, weight: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  // Check if there's a workout log for today (with or without sets)
  const { data: existingLogs, error: fetchError } = await supabase
    .from('workout_logs')
    .select('id, routine_id')
    .eq('user_id', traineeId)
    .eq('date', today)
    .limit(1);

  if (fetchError) throw fetchError;

  if (existingLogs && existingLogs.length > 0) {
    // Update existing log with body weight
    const { error: updateError } = await supabase
      .from('workout_logs')
      .update({ body_weight: weight })
      .eq('id', existingLogs[0].id);

    if (updateError) throw updateError;
  } else {
    // Need to create a new log, but we need a routine_id (required field)
    // Get active workout plan to get routine_id
    const plan = await getActiveWorkoutPlan(traineeId);
    if (!plan) {
      throw new Error('אין תוכנית אימונים פעילה');
    }

    // Get routines to find the first one (default)
    const routines = await getRoutinesWithExercises(plan.id);
    if (routines.length === 0) {
      throw new Error('אין routines בתוכנית');
    }
    const routineId = routines[0].id;

    // Create new log for today with body weight only (no sets = not a real workout)
    const { error: insertError } = await supabase
      .from('workout_logs')
      .insert({
        user_id: traineeId,
        routine_id: routineId,
        date: today,
        body_weight: weight,
        start_time: new Date().toISOString(),
        completed: false,
      });

    if (insertError) throw insertError;
  }
}

// ============= NUTRITION MENU =============
// For now, we'll use a JSONB column in workout_plans
// You may need to add: ALTER TABLE workout_plans ADD COLUMN nutrition_menu JSONB;

export async function getNutritionMenu(traineeId: string): Promise<NutritionMenu | null> {
  const plan = await getActiveWorkoutPlan(traineeId);
  if (!plan) return null;

  try {
    const { data, error } = await supabase
      .from('workout_plans')
      .select('nutrition_menu')
      .eq('id', plan.id)
      .maybeSingle();

    if (error) {
      // If column doesn't exist (42703) or bad request (400), return null
      if (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('column')) {
        console.warn('nutrition_menu column does not exist yet. Run the migration to add it.');
        return null;
      }
      throw error;
    }
    return (data?.nutrition_menu as NutritionMenu) || null;
  } catch (err: any) {
    // Column might not exist yet or other non-critical errors
    if (err.code === '42703' || err.code === 'PGRST204' || err.message?.includes('column')) {
      return null;
    }
    throw err;
  }
}

export async function updateNutritionMenu(traineeId: string, menu: NutritionMenu): Promise<void> {
  const plan = await getActiveWorkoutPlan(traineeId);
  if (!plan) throw new Error('No active workout plan found');

  const { error } = await supabase
    .from('workout_plans')
    .update({ nutrition_menu: menu as any })
    .eq('id', plan.id);

  if (error) {
    // If column doesn't exist, inform user to run migration
    if (error.code === '42703' || error.message?.includes('column')) {
      throw new Error('nutrition_menu column does not exist. Please run the migration to add it first.');
    }
    throw error;
  }
}

// ============= NUTRITION SWAPS =============
export async function getNutritionSwaps() {
  const { data, error } = await supabase
    .from('nutrition_swaps')
    .select('*')
    .order('food_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ============= FOOD HISTORY =============
export interface FoodHistoryItem {
  foodName: string;
  amount: string;
  lastUsed?: string; // date when last used
}

export async function getFoodHistory(traineeId: string): Promise<FoodHistoryItem[]> {
  try {
    // Get all workout plans for this trainee (active and inactive)
    const { data: plans, error: plansError } = await supabase
      .from('workout_plans')
      .select('id, nutrition_menu, updated_at, is_active')
      .eq('trainee_id', traineeId)
      .not('nutrition_menu', 'is', null)
      .order('updated_at', { ascending: false });

    if (plansError) {
      // If column doesn't exist, return empty array
      if (plansError.code === '42703' || plansError.message?.includes('column')) {
        return [];
      }
      throw plansError;
    }

    if (!plans || plans.length === 0) {
      return [];
    }

    // Extract all unique foods from all nutrition menus
    const foodMap = new Map<string, { amount: string; lastUsed: string }>();

    plans.forEach(plan => {
      const menu = plan.nutrition_menu as NutritionMenu | null;
      if (menu && menu.meals) {
        menu.meals.forEach(meal => {
          if (meal.foods) {
            meal.foods.forEach(food => {
              if (food.foodName && food.foodName.trim()) {
                const existing = foodMap.get(food.foodName.trim());
                const planDate = plan.updated_at || plan.id; // Use updated_at or id as fallback
                
                // Keep the most recent usage
                if (!existing || (plan.updated_at && existing.lastUsed < plan.updated_at)) {
                  foodMap.set(food.foodName.trim(), {
                    amount: food.amount || '',
                    lastUsed: plan.updated_at || planDate
                  });
                }
              }
            });
          }
        });
      }
    });

    // Convert to array and sort by last used (most recent first)
    const foodHistory: FoodHistoryItem[] = Array.from(foodMap.entries())
      .map(([foodName, data]) => ({
        foodName,
        amount: data.amount,
        lastUsed: data.lastUsed
      }))
      .sort((a, b) => {
        if (!a.lastUsed || !b.lastUsed) return 0;
        return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
      });

    return foodHistory;
  } catch (err: any) {
    // Column might not exist yet or other non-critical errors
    if (err.code === '42703' || err.code === 'PGRST204' || err.message?.includes('column')) {
      return [];
    }
    throw err;
  }
}

// ============= TRAINER STATISTICS =============
export interface TrainerStats {
  activeTrainees: number;
  workoutsToday: { completed: number; total: number };
  averageCompliance: number;
  alerts: number;
}

export async function getTrainerStats(trainerId: string): Promise<TrainerStats> {
  // Get active trainees count
  const { data: trainees, error: traineesError } = await supabase
    .from('users')
    .select('id')
    .eq('trainer_id', trainerId)
    .eq('role', 'trainee');

  if (traineesError) throw traineesError;
  const traineeIds = trainees?.map(t => t.id) || [];

  if (traineeIds.length === 0) {
    return {
      activeTrainees: 0,
      workoutsToday: { completed: 0, total: 0 },
      averageCompliance: 0,
      alerts: 0,
    };
  }

  // Get active workout plans
  const { data: activePlans, error: plansError } = await supabase
    .from('workout_plans')
    .select('trainee_id, weekly_target_workouts')
    .eq('trainer_id', trainerId)
    .eq('is_active', true)
    .in('trainee_id', traineeIds);

  if (plansError) throw plansError;
  const activeTrainees = activePlans?.length || 0;

  // Get workouts today
  const today = new Date().toISOString().split('T')[0];
  const { data: todayLogs, error: logsError } = await supabase
    .from('workout_logs')
    .select('user_id, completed')
    .eq('date', today)
    .in('user_id', traineeIds);

  if (logsError) throw logsError;
  const completedToday = todayLogs?.filter(log => log.completed).length || 0;
  const totalTarget = activePlans?.reduce((sum, plan) => sum + (plan.weekly_target_workouts || 0), 0) || 0;
  const workoutsToday = { completed: completedToday, total: totalTarget };

  // Calculate average compliance (simplified - based on completed workouts vs targets)
  let totalCompliance = 0;
  let complianceCount = 0;
  
  for (const plan of activePlans || []) {
    const traineeId = plan.trainee_id;
    const target = plan.weekly_target_workouts || 0;
    
    if (target > 0) {
      // Get workouts this week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const { data: weekLogs } = await supabase
        .from('workout_logs')
        .select('completed')
        .eq('user_id', traineeId)
        .gte('date', weekStart.toISOString().split('T')[0])
        .eq('completed', true);
      
      const completed = weekLogs?.length || 0;
      const compliance = Math.min(100, Math.round((completed / target) * 100));
      totalCompliance += compliance;
      complianceCount++;
    }
  }
  
  const averageCompliance = complianceCount > 0 ? Math.round(totalCompliance / complianceCount) : 0;

  // Calculate alerts (trainees with low compliance or no workouts in 3+ days)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];
  
  const { data: recentLogs } = await supabase
    .from('workout_logs')
    .select('user_id')
    .in('user_id', traineeIds)
    .gte('date', threeDaysAgoStr);
  
  const traineesWithRecentWorkouts = new Set(recentLogs?.map(log => log.user_id) || []);
  const alerts = traineeIds.filter(id => !traineesWithRecentWorkouts.has(id)).length;

  return {
    activeTrainees,
    workoutsToday,
    averageCompliance,
    alerts,
  };
}

export interface TraineeWithStatus {
  id: string;
  name: string;
  planName: string;
  status: 'active' | 'inactive';
  lastWorkout: string | null;
  compliance: number;
}

export async function getTraineesWithStatus(trainerId: string): Promise<TraineeWithStatus[]> {
  const trainees = await getTrainerTrainees(trainerId);
  const traineeIds = trainees.map(t => t.id);

  if (traineeIds.length === 0) return [];

  // Get active plans with names
  const { data: plans } = await supabase
    .from('workout_plans')
    .select('trainee_id, name, is_active')
    .eq('trainer_id', trainerId)
    .in('trainee_id', traineeIds);

  // Get last workout dates
  const { data: logs } = await supabase
    .from('workout_logs')
    .select('user_id, date')
    .in('user_id', traineeIds)
    .order('date', { ascending: false });

  // Get compliance for each trainee
  const traineesWithStatus: TraineeWithStatus[] = [];
  
  for (const trainee of trainees) {
    const plan = plans?.find(p => p.trainee_id === trainee.id);
    const traineeLogs = logs?.filter(l => l.user_id === trainee.id) || [];
    const lastWorkout = traineeLogs.length > 0 ? traineeLogs[0].date : null;
    
    // Calculate compliance (simplified)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekLogs = traineeLogs.filter(l => l.date >= weekStart.toISOString().split('T')[0]);
    const compliance = plan?.is_active ? Math.min(100, Math.round((weekLogs.length / 5) * 100)) : 0;

    traineesWithStatus.push({
      id: trainee.id,
      name: trainee.name,
      planName: plan?.name || 'אין תוכנית',
      status: plan?.is_active ? 'active' : 'inactive',
      lastWorkout,
      compliance,
    });
  }

  return traineesWithStatus;
}

