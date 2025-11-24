// Shared logic for calculating trainee statistics
// This prevents code duplication and ensures consistency

import type { WorkoutLogWithDetails } from './types';

export interface TraineeStatistics {
  totalWorkouts: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  totalVolume: number;
  averageWeight: number | null;
  weightChange: number | null;
}

export interface WeightDataPoint {
  date: string;
  weight: number;
}

/**
 * Calculate workout statistics from filtered logs
 */
export function calculateWorkoutStats(
  logs: WorkoutLogWithDetails[],
  timeFilter: 'week' | 'month' | 'all' = 'all'
): {
  totalWorkouts: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  totalVolume: number;
} {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Filter logs by time period
  let filteredLogs = logs;
  if (timeFilter === 'week') {
    filteredLogs = logs.filter(log => new Date(log.date) >= weekAgo);
  } else if (timeFilter === 'month') {
    filteredLogs = logs.filter(log => new Date(log.date) >= monthAgo);
  }

  const completedLogs = filteredLogs.filter(log => log.completed);
  const totalWorkouts = completedLogs.length;

  // Calculate workouts this week
  const workoutsThisWeek = completedLogs.filter(log => 
    new Date(log.date) >= weekAgo
  ).length;

  // Calculate workouts this month
  const workoutsThisMonth = completedLogs.filter(log => 
    new Date(log.date) >= monthAgo
  ).length;

  // Calculate total volume
  let totalVolume = 0;
  completedLogs.forEach(log => {
    log.set_logs?.forEach(setLog => {
      if (setLog.weight_kg && setLog.reps) {
        totalVolume += setLog.weight_kg * setLog.reps;
      }
    });
  });

  return {
    totalWorkouts,
    workoutsThisWeek,
    workoutsThisMonth,
    totalVolume,
  };
}

/**
 * Calculate weight statistics from weight history
 */
export function calculateWeightStats(
  weightHistory: WeightDataPoint[]
): {
  averageWeight: number | null;
  weightChange: number | null;
} {
  if (weightHistory.length === 0) {
    return {
      averageWeight: null,
      weightChange: null,
    };
  }

  // Calculate average from last 7 measurements
  const recentWeights = weightHistory.slice(0, 7);
  const sum = recentWeights.reduce((acc, w) => acc + w.weight, 0);
  const averageWeight = sum / recentWeights.length;

  // Calculate weight change (latest vs oldest in history)
  let weightChange: number | null = null;
  if (weightHistory.length >= 2) {
    const latest = weightHistory[0].weight;
    const oldest = weightHistory[weightHistory.length - 1].weight;
    weightChange = latest - oldest;
  }

  return {
    averageWeight,
    weightChange,
  };
}

/**
 * Calculate all statistics for a trainee
 */
export function calculateTraineeStats(
  logs: WorkoutLogWithDetails[],
  weightHistory: WeightDataPoint[],
  timeFilter: 'week' | 'month' | 'all' = 'all'
): TraineeStatistics {
  const workoutStats = calculateWorkoutStats(logs, timeFilter);
  const weightStats = calculateWeightStats(weightHistory);

  return {
    ...workoutStats,
    ...weightStats,
  };
}

