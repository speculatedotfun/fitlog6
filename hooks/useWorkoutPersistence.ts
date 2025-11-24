"use client";

import { useEffect, useState } from "react";

interface WorkoutBackup {
  sets: Record<string, Array<{
    setNumber: number;
    weight: string;
    reps: string;
    rir: string;
  }>>;
  routineId: string | null;
  timestamp: number;
  exerciseIds?: string[];
}

const STORAGE_KEY = 'current_workout_backup';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useWorkoutPersistence(
  exercisesSets: Record<string, Array<{
    setNumber: number;
    weight: string;
    reps: string;
    rir: string;
  }>>,
  selectedRoutineId: string | null,
  exerciseIds: string[] = []
) {
  const [hasRestored, setHasRestored] = useState(false);

  // Save to localStorage whenever sets change
  useEffect(() => {
    if (Object.keys(exercisesSets).length > 0 && selectedRoutineId) {
      const backup: WorkoutBackup = {
        sets: exercisesSets,
        routineId: selectedRoutineId,
        timestamp: Date.now(),
        exerciseIds,
      };
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(backup));
      } catch (error) {
        console.error('Failed to save workout backup:', error);
      }
    }
  }, [exercisesSets, selectedRoutineId, exerciseIds]);

  // Load from localStorage on mount
  const loadBackup = (): WorkoutBackup | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;

      const backup: WorkoutBackup = JSON.parse(saved);
      
      // Check if backup is too old
      const age = Date.now() - backup.timestamp;
      if (age > MAX_AGE_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return backup;
    } catch (error) {
      console.error('Failed to load workout backup:', error);
      return null;
    }
  };

  // Clear backup
  const clearBackup = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear workout backup:', error);
    }
  };

  return {
    loadBackup,
    clearBackup,
    hasRestored,
    setHasRestored,
  };
}

