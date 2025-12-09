import { supabase } from '../supabase';
import type { User, CreateUser } from '../types';
import { handleDatabaseError } from './errors';

// ============= USERS =============

export async function getTrainerTrainees(trainerId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('trainer_id', trainerId)
    .eq('role', 'trainee')
    .order('created_at', { ascending: false });

  if (error) handleDatabaseError('getTrainerTrainees', error);
  return data || [];
}

// ============= TRAINEES WITH DETAILS =============

export interface TraineeWithDetails {
  id: string;
  name: string;
  email: string;
  created_at: string;
  planActive: boolean;
  planName: string | null;
  lastWorkout: string | null;
}

// OPTIMIZED: Uses Map for O(1) lookups instead of O(n²) .find() calls
export async function getTrainerTraineesWithDetails(trainerId: string): Promise<TraineeWithDetails[]> {
  try {
    // Fetch all data in parallel
    const [traineesResult, plansResult, logsResult] = await Promise.all([
      supabase
        .from('users')
        .select('id, name, email, created_at')
        .eq('trainer_id', trainerId)
        .eq('role', 'trainee')
        .order('created_at', { ascending: false }),
      
      supabase
        .from('workout_plans')
        .select('trainee_id, name')
        .eq('trainer_id', trainerId)
        .eq('is_active', true),
      
      supabase
        .from('workout_logs')
        .select('user_id, date')
        .order('date', { ascending: false })
    ]);

    if (traineesResult.error) {
      handleDatabaseError('getTrainerTraineesWithDetails (trainees)', traineesResult.error);
    }

    const traineesList = traineesResult.data || [];
    if (traineesList.length === 0) {
      return [];
    }

    const traineeIds = new Set(traineesList.map(t => t.id));

    // Create efficient lookup maps - O(1) access instead of O(n) .find()
    const planMap = new Map(
      (plansResult.data || []).map(p => [p.trainee_id, p.name])
    );

    // Group logs by user and get only the most recent for each
    const lastWorkoutMap = new Map<string, string>();
    (logsResult.data || []).forEach(log => {
      if (traineeIds.has(log.user_id) && !lastWorkoutMap.has(log.user_id)) {
        lastWorkoutMap.set(log.user_id, log.date);
      }
    });

    // Merge data using O(1) Map lookups
    return traineesList.map(trainee => ({
      id: trainee.id,
      name: trainee.name,
      email: trainee.email,
      created_at: trainee.created_at,
      planActive: planMap.has(trainee.id),
      planName: planMap.get(trainee.id) || null,
      lastWorkout: lastWorkoutMap.get(trainee.id) || null,
    }));
  } catch (error) {
    handleDatabaseError('getTrainerTraineesWithDetails', error);
    return [];
  }
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

// ============= PERFORMANCE NOTES =============
/*
  RECOMMENDED INDEXES for optimal performance:
  
  CREATE INDEX idx_users_trainer_role ON users(trainer_id, role);
  CREATE INDEX idx_workout_plans_trainee_active ON workout_plans(trainee_id, is_active);
  CREATE INDEX idx_workout_logs_user_date ON workout_logs(user_id, date DESC);
  
  These indexes significantly improve query performance for trainer dashboards.
*/