"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  getActiveWorkoutPlan,
  getRoutinesWithExercises,
  getWorkoutLogs,
  createWorkoutLog,
  createSetLog,
} from "@/lib/db";
import type { RoutineWithExercises } from "@/lib/types";

interface SetData {
  setNumber: number;
  weight: string;
  reps: string;
  rir: string;
}

interface Exercise {
  id: string;
  name: string;
  specialInstructions: string;
  targetSets: number;
  targetReps: string;
  restTime: number;
  exerciseId: string;
  rirTarget: number; // RIR target from trainer (0-4)
  previousPerformance?: { weight: number; reps: number }[];
}

function WorkoutPageContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineWithExercises | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exercisesSets, setExercisesSets] = useState<Record<string, SetData[]>>({});

  useEffect(() => {
    if (user?.id) {
      loadWorkoutData();
    }
  }, [user?.id]);

  useEffect(() => {
    // Initialize sets for all exercises when exercises are loaded
    if (exercises.length > 0) {
      initializeAllSets();
    }
  }, [exercises]);

  const loadWorkoutData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Load active workout plan
      const plan = await getActiveWorkoutPlan(user.id);
      setWorkoutPlan(plan);

      if (!plan) {
        setLoading(false);
        return;
      }

      // Load routines with exercises
      const routinesData = await getRoutinesWithExercises(plan.id);
      
      // Sort routines by letter (A, B, C, D, E)
      const sortedRoutines = [...routinesData].sort((a, b) => {
        const letterOrder = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5 };
        return (letterOrder[a.letter] || 99) - (letterOrder[b.letter] || 99);
      });
      
      setRoutines(sortedRoutines);

      if (sortedRoutines.length > 0) {
        // Determine which routine to show
        const logs = await getWorkoutLogs(user.id, 10);
        const lastLog = logs.find(log => log.date === new Date().toISOString().split('T')[0]);
        
        let routineToShow: RoutineWithExercises;
        if (lastLog) {
          const lastRoutineIndex = sortedRoutines.findIndex(r => r.id === lastLog.routine_id);
          const nextIndex = lastRoutineIndex >= 0 && lastRoutineIndex < sortedRoutines.length - 1
            ? lastRoutineIndex + 1
            : 0;
          routineToShow = sortedRoutines[nextIndex];
        } else {
          routineToShow = sortedRoutines[0];
        }

        setSelectedRoutine(routineToShow);
        await loadExercisesWithHistory(routineToShow, user.id);
      }

    } catch (error) {
      console.error('Error loading workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExercisesWithHistory = async (routine: RoutineWithExercises, traineeId: string) => {
    try {
      // Load previous workout logs to get performance history
      const allLogs = await getWorkoutLogs(traineeId, 50);
      
      const exercisesWithHistory: Exercise[] = routine.routine_exercises.map((re) => {
        // Find all previous performances for this exercise
        const exerciseLogs = allLogs
          .flatMap(log => log.set_logs || [])
          .filter(sl => sl.exercise_id === re.exercise_id)
          .map(sl => ({
            weight: sl.weight_kg,
            reps: sl.reps,
          }))
          .sort((a, b) => b.weight - a.weight || b.reps - a.reps); // Sort by weight desc, then reps desc

        // Get only the heaviest set (first one after sorting)
        const previousPerformance = exerciseLogs.length > 0
          ? [exerciseLogs[0]] // Take only the heaviest set
          : undefined;

        return {
          id: re.id,
          name: re.exercise?.name || 'תרגיל לא ידוע',
          specialInstructions: re.special_instructions || re.notes || '',
          targetSets: re.target_sets,
          targetReps: `${re.target_reps_min}-${re.target_reps_max}`,
          restTime: re.rest_time_seconds || 180,
          exerciseId: re.exercise_id,
          rirTarget: re.rir_target !== null && re.rir_target !== undefined ? re.rir_target : 1, // RIR target from trainer (0 is valid!)
          previousPerformance,
        };
      });

      setExercises(exercisesWithHistory);
    } catch (error) {
      console.error('Error loading exercise history:', error);
    }
  };

  const initializeAllSets = () => {
    const newSets: Record<string, SetData[]> = {};
    
    exercises.forEach((exercise) => {
      // Skip if sets already exist
      if (exercisesSets[exercise.id]) return;
      
      // Get the heaviest set (first one in sorted previousPerformance)
      const heaviestSet = exercise.previousPerformance?.[0];
      
      // Create only ONE set - the heaviest one
      newSets[exercise.id] = [{
        setNumber: 1,
        weight: heaviestSet?.weight.toString() || "",
        reps: heaviestSet?.reps.toString() || "",
        rir: exercise.rirTarget.toString(), // Use trainer's RIR target
      }];
    });
    
    if (Object.keys(newSets).length > 0) {
      setExercisesSets((prev) => ({
        ...prev,
        ...newSets,
      }));
    }
  };

  const updateSet = (exerciseId: string, field: keyof SetData, value: string) => {
    const currentSets = exercisesSets[exerciseId] || [];
    const newSets = [...currentSets];
    if (newSets[0]) {
      newSets[0] = { ...newSets[0], [field]: value };
    }
    
    setExercisesSets((prev: Record<string, SetData[]>) => ({
      ...prev,
      [exerciseId]: newSets,
    }));
  };

  const handleRoutineChange = async (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine || !user?.id) return;
    
    setSelectedRoutine(routine);
    setExercises([]);
    setExercisesSets({});
    await loadExercisesWithHistory(routine, user.id);
  };

  const handleFinishWorkout = async () => {
    if (!selectedRoutine || !user?.id || exercises.length === 0) return;

    try {
      setSaving(true);

      // Check if workout is not empty - at least one exercise must have weight and reps
      let hasValidSets = false;
      const setsToSave: Array<{
        exerciseId: string;
        setNumber: number;
        weight: number;
        reps: number;
        rir: number;
      }> = [];

      for (const exercise of exercises) {
        const exerciseSets = exercisesSets[exercise.id] || [];
        for (const set of exerciseSets) {
          if (set.weight && set.reps) {
            const weight = parseFloat(set.weight);
            const reps = parseInt(set.reps);
            
            // Validate that weight and reps are valid numbers
            if (!isNaN(weight) && !isNaN(reps) && weight > 0 && reps > 0) {
              hasValidSets = true;
              setsToSave.push({
                exerciseId: exercise.exerciseId,
                setNumber: set.setNumber,
                weight,
                reps,
                rir: exercise.rirTarget,
              });
            }
          }
        }
      }

      // If no valid sets found, show error and don't save
      if (!hasValidSets || setsToSave.length === 0) {
        alert('לא ניתן לשמור אימון ריק. אנא הזן לפחות משקל וחזרות בתרגיל אחד.');
        setSaving(false);
        return;
      }

      // Create workout log
      const now = new Date().toISOString();
      const workoutLog = await createWorkoutLog({
        user_id: user.id,
        routine_id: selectedRoutine.id,
        date: new Date().toISOString().split('T')[0],
        notes: '',
        body_weight: null,
        start_time: now,
        end_time: null,
        completed: false,
      });

      // Create set logs for all valid sets
      for (const setData of setsToSave) {
        await createSetLog({
          log_id: workoutLog.id,
          exercise_id: setData.exerciseId,
          set_number: setData.setNumber,
          weight_kg: setData.weight,
          reps: setData.reps,
          rir_actual: setData.rir,
          notes: '',
        });
      }

      alert('האימון נשמר בהצלחה!');
      
      // Redirect to dashboard
      window.location.href = '/trainee/dashboard';

    } catch (error: any) {
      console.error('Error saving workout:', error);
      alert('שגיאה בשמירת האימון: ' + (error.message || 'שגיאה לא ידועה'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  // No workout plan
  if (!workoutPlan || routines.length === 0 || !selectedRoutine || exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
        <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-lg">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <Link href="/trainee/dashboard">
                <Button variant="ghost" size="icon" className="text-white hover:bg-blue-700">
                  <ArrowLeft className="h-6 w-6" />
                </Button>
              </Link>
              <div className="text-center flex-1">
                <h1 className="text-2xl font-bold">אין אימון זמין</h1>
                <p className="text-blue-100 text-sm">המתן שהמאמן ייצור תוכנית אימונים</p>
              </div>
              <div className="w-10" />
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4 space-y-4 pb-8">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6 text-center">
              <div className="text-6xl mb-4">🏋️‍♂️</div>
              <h2 className="text-2xl font-bold text-yellow-900 mb-2">אין אימון היום</h2>
              <p className="text-yellow-800 mb-4">
                המאמן שלך עדיין לא יצר תוכנית אימונים או שהשלמת את כל האימונים השבועיים.
              </p>
            </CardContent>
          </Card>

          <Link href="/trainee/dashboard">
            <Button className="w-full" size="lg">
              חזור לדשבורד
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-8" dir="rtl">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <Link href="/trainee/dashboard">
              <Button variant="ghost" size="icon" className="text-white hover:bg-blue-700">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div className="text-center flex-1">
              {routines.length > 1 ? (
                <div className="space-y-2">
                  <select
                    value={selectedRoutine.id}
                    onChange={(e) => handleRoutineChange(e.target.value)}
                    className="bg-blue-700 text-white border border-blue-500 rounded-md px-4 py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    {routines.map((routine) => (
                      <option key={routine.id} value={routine.id} className="bg-white text-gray-900">
                        אימון {routine.letter}
                      </option>
                    ))}
                  </select>
                  <p className="text-blue-100 text-sm">
                    {exercises.length} תרגילים
                  </p>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold">אימון {selectedRoutine.letter}</h1>
                  <p className="text-blue-100 text-sm">
                    {exercises.length} תרגילים
                  </p>
                </>
              )}
            </div>
            <div className="w-10" />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* All Exercises */}
        {exercises.map((exercise, index) => {
          const sets = exercisesSets[exercise.id] || [];
          return (
            <Card key={exercise.id} className="border-2 border-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">
                  {index + 1}. {exercise.name}
                </CardTitle>
                <CardDescription className="text-base">
                  סט אחד × {exercise.targetReps} חזרות | RIR: {exercise.rirTarget}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Special Instructions */}
                {exercise.specialInstructions && (
                  <div className="bg-yellow-50 border-r-4 border-yellow-400 p-3 rounded">
                    <p className="font-semibold text-yellow-900 text-sm mb-1">הוראות ביצוע:</p>
                    <p className="text-yellow-800 text-sm">{exercise.specialInstructions}</p>
                  </div>
                )}

                {/* Set Input */}
                {sets.length > 0 && (
                  <div className="border rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg">סט 1</span>
                      {exercise.previousPerformance?.[0] && (
                        <span className="text-xs text-gray-500">
                          הסט הכבד ביותר: {exercise.previousPerformance[0].weight} ק"ג ×{" "}
                          {exercise.previousPerformance[0].reps} חזרות
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">משקל (ק"ג)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={sets[0].weight}
                          onChange={(e) => updateSet(exercise.id, "weight", e.target.value)}
                          placeholder={
                            exercise.previousPerformance?.[0]?.weight.toString() || "0"
                          }
                          className="text-center font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">חזרות</label>
                        <Input
                          type="number"
                          value={sets[0].reps}
                          onChange={(e) => updateSet(exercise.id, "reps", e.target.value)}
                          placeholder={
                            exercise.previousPerformance?.[0]?.reps.toString() || "0"
                          }
                          className="text-center font-semibold"
                        />
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t">
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">RIR יעד מהמאמן:</span> {exercise.rirTarget}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Save Workout Button */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              className="w-full bg-green-600 hover:bg-green-700" 
              size="lg"
              onClick={handleFinishWorkout}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  שומר אימון...
                </>
              ) : (
                'שמור אימון'
              )}
            </Button>
            <p className="text-center text-sm text-gray-500 mt-2">
              שמירת האימון למעקב
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function WorkoutPage() {
  return (
    <ProtectedRoute requiredRole="trainee">
      <WorkoutPageContent />
    </ProtectedRoute>
  );
}
