import { supabase } from '../supabase';
import type {
  Exercise,
  WorkoutPlan,
  Routine,
  RoutineExercise,
  WorkoutLog,
  SetLog,
  CreateExercise,
  CreateWorkoutPlan,
  CreateRoutine,
  CreateRoutineExercise,
  CreateWorkoutLog,
  CreateSetLog,
  WorkoutLogWithDetails,
  RoutineWithExercises,
} from '../types';
import { handleDatabaseError, DatabaseError } from './errors';
import { getTrainerTrainees } from './users';

// ============= EXERCISES =============

export async function getExerciseLibrary(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercise_library')
    .select('*')
    .order('name');

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
  const { data, error } = await supabase
    .from('exercise_library')
    .select('*')
    .ilike('name', name.trim())
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
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

// Optimized: Check both users in parallel, then insert plan
export async function createWorkoutPlan(plan: CreateWorkoutPlan): Promise<WorkoutPlan> {
  // Check both users in parallel
  const [trainerResult, traineeResult] = await Promise.all([
    supabase.from('users').select('id').eq('id', plan.trainer_id).maybeSingle(),
    supabase.from('users').select('id').eq('id', plan.trainee_id).maybeSingle(),
  ]);

  // Prepare user inserts
  const userInserts = [];

  if (!trainerResult.data) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userInserts.push({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email || 'Trainer',
        role: 'trainer'
      });
    }
  }

  if (!traineeResult.data) {
    userInserts.push({
      id: plan.trainee_id,
      email: `trainee-${plan.trainee_id}@example.com`,
      name: 'Trainee',
      role: 'trainee',
      trainer_id: plan.trainer_id
    });
  }

  // Insert missing users if any
  if (userInserts.length > 0) {
    await supabase.from('users').insert(userInserts);
  }

  // Create workout plan
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
    .order('order_index');

  if (error) throw error;

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

export async function getWorkoutLogs(
  traineeId: string,
  limit?: number,
  startDate?: string
): Promise<WorkoutLogWithDetails[]> {
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

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) handleDatabaseError('getWorkoutLogs', error);

  return (data || []).map(log => ({
    ...log,
    routine: log.routine,
    set_logs: (log.set_logs || []).map((sl: any) => ({
      ...sl,
      exercise: sl.exercise,
    })),
  }));
}

export async function getWorkoutLogsForUsers(
  traineeIds: string[],
  startDate?: string,
  limit?: number
): Promise<Map<string, WorkoutLogWithDetails[]>> {
  if (traineeIds.length === 0) {
    return new Map();
  }

  let query = supabase
    .from('workout_logs')
    .select(`
      id,
      user_id,
      date,
      completed,
      routine:routines (id, name),
      set_logs (
        id,
        exercise_id,
        weight_kg,
        reps,
        exercise:exercise_library (id, name)
      )
    `)
    .in('user_id', traineeIds)
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (limit) {
    query = query.limit(limit);
  }

  let data;
  try {
    const result = await query;
    if (result.error) {
      throw result.error;
    }
    data = result.data;
  } catch (error: any) {
    // If schema is missing some columns, log and return empty instead of breaking the dashboard
    if (error?.code === '42703' || error?.code === 'PGRST204' || error?.message?.includes('column')) {
      console.warn('getWorkoutLogsForUsers schema mismatch, returning empty map', error?.message || error);
      return new Map();
    }
    handleDatabaseError('getWorkoutLogsForUsers', error);
  }

  const logsMap = new Map<string, WorkoutLogWithDetails[]>();
  
  (data || []).forEach(log => {
    const traineeId = log.user_id;
    if (!logsMap.has(traineeId)) {
      logsMap.set(traineeId, []);
    }
    
    logsMap.get(traineeId)!.push({
      ...log,
      routine: log.routine,
      set_logs: (log.set_logs || []).map((sl: any) => ({
        ...sl,
        exercise: sl.exercise,
      })),
    });
  });

  return logsMap;
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

  if (error) handleDatabaseError('getBodyWeightHistory', error);

  // Use Map to deduplicate by date (keep first occurrence which is most recent)
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

export async function getBodyWeightHistoryForUsers(
  traineeIds: string[]
): Promise<Map<string, Array<{ date: string; weight: number }>>> {
  if (traineeIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('workout_logs')
    .select('user_id, date, body_weight')
    .in('user_id', traineeIds)
    .not('body_weight', 'is', null)
    .order('date', { ascending: false });

  if (error) handleDatabaseError('getBodyWeightHistoryForUsers', error);

  const weightsMap = new Map<string, Map<string, number>>();
  
  (data || []).forEach(log => {
    const traineeId = log.user_id;
    if (!weightsMap.has(traineeId)) {
      weightsMap.set(traineeId, new Map());
    }
    
    const traineeWeights = weightsMap.get(traineeId)!;
    if (!traineeWeights.has(log.date)) {
      traineeWeights.set(log.date, log.body_weight);
    }
  });

  const result = new Map<string, Array<{ date: string; weight: number }>>();
  
  weightsMap.forEach((dateMap, traineeId) => {
    const weights = Array.from(dateMap.entries())
      .map(([date, weight]) => ({ date, weight }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    result.set(traineeId, weights);
  });

  return result;
}

// Optimized: Reduced round-trips by checking first then deciding action
export async function saveBodyWeight(traineeId: string, weight: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Check for existing log
    const { data: existingLog, error: fetchError } = await supabase
      .from('workout_logs')
      .select('id')
      .eq('user_id', traineeId)
      .eq('date', today)
      .maybeSingle();

    if (fetchError) handleDatabaseError('saveBodyWeight (fetch)', fetchError);

    if (existingLog) {
      // Update existing log
      const { error: updateError } = await supabase
        .from('workout_logs')
        .update({ body_weight: weight })
        .eq('id', existingLog.id);

      if (updateError) handleDatabaseError('saveBodyWeight (update)', updateError);
    } else {
      // Need to create new log - fetch plan and routine in parallel
      const [planResult, { data: { user } }] = await Promise.all([
        getActiveWorkoutPlan(traineeId),
        supabase.auth.getUser()
      ]);

      if (!planResult) {
        throw new DatabaseError('אין תוכנית אימונים פעילה');
      }

      const routines = await getRoutinesWithExercises(planResult.id);
      if (routines.length === 0) {
        throw new DatabaseError('אין routines בתוכנית');
      }

      const { error: insertError } = await supabase
        .from('workout_logs')
        .insert({
          user_id: traineeId,
          routine_id: routines[0].id,
          date: today,
          body_weight: weight,
          start_time: new Date().toISOString(),
          completed: false,
        });

      if (insertError) handleDatabaseError('saveBodyWeight (insert)', insertError);
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    handleDatabaseError('saveBodyWeight', error);
  }
}

// ============= TRAINER STATISTICS =============

export interface TrainerStats {
  activeTrainees: number;
  workoutsToday: { completed: number; total: number };
  averageCompliance: number;
  alerts: number;
}

// HEAVILY OPTIMIZED: Eliminated N+1 queries, reduced from ~50+ queries to just 4
export async function getTrainerStats(trainerId: string): Promise<TrainerStats> {
  // Get all data in parallel with a single query each
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekStartStr = weekStart.toISOString().split('T')[0];
  
  const today = new Date().toISOString().split('T')[0];
  
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

  // Execute all queries in parallel
  const [traineesResult, plansResult, weekLogsResult, todayLogsResult, recentLogsResult] = await Promise.all([
    supabase
      .from('users')
      .select('id')
      .eq('trainer_id', trainerId)
      .eq('role', 'trainee'),
    
    supabase
      .from('workout_plans')
      .select('trainee_id, weekly_target_workouts')
      .eq('trainer_id', trainerId)
      .eq('is_active', true),
    
    supabase
      .from('workout_logs')
      .select('user_id, completed')
      .gte('date', weekStartStr)
      .eq('completed', true),
    
    supabase
      .from('workout_logs')
      .select('user_id, completed')
      .eq('date', today),
    
    supabase
      .from('workout_logs')
      .select('user_id')
      .gte('date', threeDaysAgoStr)
  ]);

  if (traineesResult.error) throw traineesResult.error;
  if (plansResult.error) throw plansResult.error;
  if (weekLogsResult.error) throw weekLogsResult.error;
  if (todayLogsResult.error) throw todayLogsResult.error;
  if (recentLogsResult.error) throw recentLogsResult.error;

  const traineeIds = new Set(traineesResult.data?.map(t => t.id) || []);
  const activePlans = plansResult.data || [];
  
  if (traineeIds.size === 0) {
    return {
      activeTrainees: 0,
      workoutsToday: { completed: 0, total: 0 },
      averageCompliance: 0,
      alerts: 0,
    };
  }

  // Filter data to only include trainees of this trainer
  const activePlanMap = new Map(activePlans.map(p => [p.trainee_id, p.weekly_target_workouts || 0]));
  const activeTraineeIds = new Set(activePlans.map(p => p.trainee_id));
  
  // Calculate workouts today
  const todayLogs = todayLogsResult.data?.filter(log => traineeIds.has(log.user_id)) || [];
  const completedToday = todayLogs.filter(log => log.completed).length;
  const totalTarget = Array.from(activePlanMap.values()).reduce((sum, target) => sum + target, 0);

  // Calculate average compliance from week logs
  const weekLogs = weekLogsResult.data?.filter(log => traineeIds.has(log.user_id)) || [];
  const weekCompletionsByTrainee = new Map<string, number>();
  
  weekLogs.forEach(log => {
    weekCompletionsByTrainee.set(
      log.user_id,
      (weekCompletionsByTrainee.get(log.user_id) || 0) + 1
    );
  });

  let totalCompliance = 0;
  let complianceCount = 0;

  activePlanMap.forEach((target, traineeId) => {
    if (target > 0) {
      const completed = weekCompletionsByTrainee.get(traineeId) || 0;
      const compliance = Math.min(100, Math.round((completed / target) * 100));
      totalCompliance += compliance;
      complianceCount++;
    }
  });

  const averageCompliance = complianceCount > 0 ? Math.round(totalCompliance / complianceCount) : 0;

  // Calculate alerts (trainees with no workouts in last 3 days)
  const traineesWithRecentWorkouts = new Set(
    recentLogsResult.data?.filter(log => traineeIds.has(log.user_id)).map(log => log.user_id) || []
  );
  const alerts = Array.from(activeTraineeIds).filter(id => !traineesWithRecentWorkouts.has(id)).length;

  return {
    activeTrainees: activePlans.length,
    workoutsToday: { completed: completedToday, total: totalTarget },
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

// OPTIMIZED: Batch all data fetching, no loops with queries
export async function getTraineesWithStatus(trainerId: string): Promise<TraineeWithStatus[]> {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split('T')[0];

  // Fetch all data in parallel
  const [trainees, plansResult, logsResult] = await Promise.all([
    getTrainerTrainees(trainerId),
    supabase
      .from('workout_plans')
      .select('trainee_id, name, is_active, weekly_target_workouts')
      .eq('trainer_id', trainerId),
    supabase
      .from('workout_logs')
      .select('user_id, date, completed')
      .order('date', { ascending: false })
  ]);

  if (plansResult.error) throw plansResult.error;
  if (logsResult.error) throw logsResult.error;

  const traineeIds = new Set(trainees.map(t => t.id));
  
  // Create lookup maps
  const planMap = new Map(plansResult.data?.map(p => [p.trainee_id, p]) || []);
  
  // Group logs by trainee
  const logsByTrainee = new Map<string, typeof logsResult.data>();
  logsResult.data?.forEach(log => {
    if (traineeIds.has(log.user_id)) {
      if (!logsByTrainee.has(log.user_id)) {
        logsByTrainee.set(log.user_id, []);
      }
      logsByTrainee.get(log.user_id)!.push(log);
    }
  });

  // Build results
  return trainees.map(trainee => {
    const plan = planMap.get(trainee.id);
    const traineeLogs = logsByTrainee.get(trainee.id) || [];
    const lastWorkout = traineeLogs.length > 0 ? traineeLogs[0].date : null;
    
    // Calculate compliance
    const weekLogs = traineeLogs.filter(l => l.date >= weekStartStr && l.completed);
    const target = plan?.weekly_target_workouts || 5;
    const compliance = plan?.is_active ? Math.min(100, Math.round((weekLogs.length / target) * 100)) : 0;

    return {
      id: trainee.id,
      name: trainee.name,
      planName: plan?.name || 'אין תוכנית',
      status: plan?.is_active ? 'active' : 'inactive',
      lastWorkout,
      compliance,
    };
  });
}

// ============= PERFORMANCE NOTES =============
/*
  RECOMMENDED INDEXES for optimal performance:
  
  CREATE INDEX idx_workout_logs_user_date ON workout_logs(user_id, date DESC);
  CREATE INDEX idx_workout_logs_date_completed ON workout_logs(date, completed);
  CREATE INDEX idx_workout_plans_trainer_active ON workout_plans(trainer_id, is_active);
  CREATE INDEX idx_users_trainer_role ON users(trainer_id, role);
  CREATE INDEX idx_workout_logs_body_weight ON workout_logs(user_id, date) WHERE body_weight IS NOT NULL;
  
  These indexes will significantly improve query performance for:
  - Trainer dashboards
  - Workout log fetching
  - Statistics calculations
  - Body weight history
*/