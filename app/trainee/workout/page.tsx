"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Calculator, Info, Play, Home, BarChart3, Users, Target, Settings, Apple, Dumbbell, ChevronDown, CheckCircle2, Trophy } from "lucide-react";
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
import { ActiveExerciseCard } from "@/components/trainee/workout/ActiveExerciseCard";
import { useWorkoutPersistence } from "@/hooks/useWorkoutPersistence";

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
  rirTarget: number;
  previousPerformance?: { weight: number; reps: number }[];
  videoUrl?: string;
  imageUrl?: string;
  muscleGroup?: string;
}

function WorkoutPageContent() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineWithExercises | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exercisesSets, setExercisesSets] = useState<Record<string, SetData[]>>({});
  const [showCalculator, setShowCalculator] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showRoutineSelector, setShowRoutineSelector] = useState(false);
  const [startTime] = useState(new Date().toISOString());

  useEffect(() => {
    if (user?.id) {
      loadWorkoutData();
    }
  }, [user?.id]);

  const { loadBackup, clearBackup } = useWorkoutPersistence(
    exercisesSets,
    selectedRoutine?.id || null,
    exercises.map(e => e.id)
  );

  useEffect(() => {
    if (exercises.length > 0 && selectedRoutine) {
      // Try to restore from backup first
      const backup = loadBackup();
      if (backup && backup.routineId === selectedRoutine.id) {
        // Check if backup matches current exercises
        const backupExerciseIds = backup.exerciseIds || [];
        const currentExerciseIds = exercises.map(e => e.id).sort();
        const backupIdsSorted = [...backupExerciseIds].sort();
        
        if (JSON.stringify(currentExerciseIds) === JSON.stringify(backupIdsSorted)) {
          // Restore without asking if it's the same routine and exercises
          setExercisesSets(backup.sets);
          return;
        }
      }
      
      // Otherwise initialize normally (only if no existing sets)
      if (Object.keys(exercisesSets).length === 0) {
        initializeAllSets();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises.length, selectedRoutine?.id]);


  const loadWorkoutData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const plan = await getActiveWorkoutPlan(user.id);
      setWorkoutPlan(plan);

      if (!plan) {
        setLoading(false);
        return;
      }

      const routinesData = await getRoutinesWithExercises(plan.id);
      
      const sortedRoutines = [...routinesData].sort((a, b) => {
        const letterOrder = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5 };
        return (letterOrder[a.letter] || 99) - (letterOrder[b.letter] || 99);
      });
      
      setRoutines(sortedRoutines);

      if (sortedRoutines.length > 0) {
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
      const allLogs = await getWorkoutLogs(traineeId, 50);
      
      const exercisesWithHistory: Exercise[] = routine.routine_exercises.map((re) => {
        const exerciseLogs = allLogs
          .flatMap(log => log.set_logs || [])
          .filter(sl => sl.exercise_id === re.exercise_id)
          .map(sl => ({
            weight: sl.weight_kg,
            reps: sl.reps,
          }))
          .sort((a, b) => b.weight - a.weight || b.reps - a.reps);

        const previousPerformance = exerciseLogs.length > 0
          ? [exerciseLogs[0]]
          : undefined;

        return {
          id: re.id,
          name: re.exercise?.name || 'תרגיל לא ידוע',
          specialInstructions: re.special_instructions || re.notes || '',
          targetSets: re.target_sets,
          targetReps: `${re.target_reps_min}-${re.target_reps_max}`,
          restTime: re.rest_time_seconds || 180,
          exerciseId: re.exercise_id,
          rirTarget: re.rir_target !== null && re.rir_target !== undefined ? re.rir_target : 1,
          previousPerformance,
          videoUrl: re.exercise?.video_url || undefined,
          imageUrl: re.exercise?.image_url || undefined,
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
      if (exercisesSets[exercise.id]) return;
      
      const heaviestSet = exercise.previousPerformance?.[0];
      
      // Initialize with one set, but allow adding more
      newSets[exercise.id] = [{
        setNumber: 1,
        weight: heaviestSet?.weight.toString() || "",
        reps: heaviestSet?.reps.toString() || "",
        rir: exercise.rirTarget.toString(),
      }];
    });
    
    if (Object.keys(newSets).length > 0) {
      setExercisesSets((prev) => ({
        ...prev,
        ...newSets,
      }));
    }
  };


  const updateSet = (exerciseId: string, setIndex: number, field: keyof SetData, value: string) => {
    const currentSets = exercisesSets[exerciseId] || [];
    const newSets = [...currentSets];
    if (newSets[setIndex]) {
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
    }
    
    setExercisesSets((prev: Record<string, SetData[]>) => ({
      ...prev,
      [exerciseId]: newSets,
    }));
  };

  const addSet = (exerciseId: string) => {
    const currentSets = exercisesSets[exerciseId] || [];
    const lastSet = currentSets[currentSets.length - 1];
    
    const newSet: SetData = {
      setNumber: currentSets.length + 1,
      weight: lastSet?.weight || "",
      reps: lastSet?.reps || "",
      rir: lastSet?.rir || "2",
    };
    
    setExercisesSets((prev) => ({
      ...prev,
      [exerciseId]: [...currentSets, newSet],
    }));
  };

  const removeSet = (exerciseId: string, setIndex: number) => {
    const currentSets = exercisesSets[exerciseId] || [];
    if (currentSets.length <= 1) return; // Don't allow removing the last set
    
    const newSets = currentSets.filter((_, index) => index !== setIndex);
    // Renumber sets
    const renumberedSets = newSets.map((set, index) => ({
      ...set,
      setNumber: index + 1,
    }));
    
    setExercisesSets((prev) => ({
      ...prev,
      [exerciseId]: renumberedSets,
    }));
  };

  const handleRoutineChange = async (routine: RoutineWithExercises) => {
    setSelectedRoutine(routine);
    setShowRoutineSelector(false);
    setExercisesSets({}); // Clear previous sets
    await loadExercisesWithHistory(routine, user?.id || '');
  };


  const handleFinishWorkout = async () => {
    if (!selectedRoutine || !user?.id || exercises.length === 0) return;

    // Check if at least one exercise has valid data
    let hasValidData = false;
    for (const exercise of exercises) {
      const sets = exercisesSets[exercise.id] || [];
      for (const set of sets) {
        if (set.weight && set.reps) {
          const weight = parseFloat(set.weight);
          const reps = parseInt(set.reps);
          if (!isNaN(weight) && !isNaN(reps) && weight > 0 && reps > 0) {
            hasValidData = true;
            break;
          }
        }
      }
      if (hasValidData) break;
    }

    if (!hasValidData) {
      alert('לא ניתן לסיים אימון ריק. אנא הזן לפחות משקל וחזרות בתרגיל אחד.');
      return;
    }

    try {
      setSaving(true);

      // Create workout log in DB
      const workoutLog = await createWorkoutLog({
        user_id: user.id,
        routine_id: selectedRoutine.id,
        date: new Date().toISOString().split('T')[0],
        body_weight: null,
        start_time: startTime,
        end_time: new Date().toISOString(),
        notes: null,
        completed: true,
      });

      // Create set logs for all exercises
      for (const exercise of exercises) {
        const sets = exercisesSets[exercise.id] || [];
        for (const set of sets) {
          const weight = parseFloat(set.weight);
          const reps = parseInt(set.reps);
          const rir = parseFloat(set.rir);

          // Only save sets with valid data
          if (!isNaN(weight) && !isNaN(reps) && weight > 0 && reps > 0) {
            await createSetLog({
              log_id: workoutLog.id,
              exercise_id: exercise.exerciseId,
              set_number: set.setNumber,
              weight_kg: weight,
              reps: reps,
              rir_actual: isNaN(rir) ? 2 : rir,
              notes: null,
            });
          }
        }
      }

      // Clear backup after successful save
      clearBackup();

      // Navigate to summary page with log ID
      window.location.href = `/trainee/workout/summary?logId=${workoutLog.id}`;
    } catch (error: any) {
      console.error('Error finishing workout:', error);
      alert('שגיאה בשמירת האימון: ' + error.message);
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  if (!workoutPlan || routines.length === 0 || !selectedRoutine || exercises.length === 0) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="bg-card text-card-foreground p-4 sticky top-0 z-10 border-b border-border pt-safe">
          <div className="max-w-2xl mx-auto flex items-center">
            <Link href="/trainee/dashboard">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-accent hover:text-foreground">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div className="text-center flex-1">
              <h1 className="text-xl font-bold">אין אימון זמין</h1>
            </div>
            <div className="w-10" />
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">המאמן שלך עדיין לא יצר תוכנית אימונים</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="bg-card text-card-foreground p-4 sticky top-0 z-10 border-b border-border shadow-sm pt-safe">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/trainee/dashboard">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-accent hover:text-foreground">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div className="text-center flex-1">
            <Button
              variant="ghost"
              onClick={() => setShowRoutineSelector(!showRoutineSelector)}
              className="text-foreground hover:bg-accent h-auto py-1"
            >
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold">
                    {workoutPlan.name} {selectedRoutine.letter}
                  </h1>
                  <ChevronDown className="h-4 w-4" />
                </div>
                {selectedRoutine.name && (
                  <span className="text-xs text-muted-foreground font-normal">{selectedRoutine.name}</span>
                )}
              </div>
            </Button>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Routine Selector Dropdown */}
      {showRoutineSelector && (
        <div className="bg-card border-b border-border sticky top-[73px] z-10 shadow-lg animate-in slide-in-from-top-2">
          <div className="max-w-2xl mx-auto p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">בחר רוטינה:</p>
              {routines.map((routine) => (
                <Button
                  key={routine.id}
                  variant={selectedRoutine?.id === routine.id ? "default" : "outline"}
                  onClick={() => handleRoutineChange(routine)}
                  className={`w-full justify-start h-12 ${
                    selectedRoutine?.id === routine.id
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "bg-background border-input text-foreground hover:bg-accent"
                  }`}
                >
                  <span className="font-bold text-lg ml-2">{routine.letter}</span>
                  {routine.name && <span className="text-sm"> - {routine.name}</span>}
                  {selectedRoutine?.id === routine.id && (
                    <span className="mr-auto text-xs font-semibold">(נבחר)</span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4 space-y-8">
        {/* All Exercises */}
        {exercises.map((exercise, index) => {
          const sets = exercisesSets[exercise.id] || [{
            setNumber: 1,
            weight: "",
            reps: "",
            rir: exercise.rirTarget.toString() || "1"
          }];
          
          return (
            <ActiveExerciseCard
              key={exercise.id}
              exercise={exercise}
              index={index}
              sets={sets}
              onUpdateSet={updateSet}
              onAddSet={addSet}
              onRemoveSet={removeSet}
              onShowInstructions={() => setShowInstructions(true)}
            />
          );
        })}

        {/* Action Button */}
        <div className="sticky bottom-24 z-10 pt-4">
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-14 text-xl shadow-xl rounded-xl transition-all active:scale-[0.98]"
            onClick={handleFinishWorkout}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-6 w-6 ml-2 animate-spin" />
                שומר נתונים...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-6 w-6 ml-2" />
                סיים אימון
              </>
            )}
          </Button>
        </div>

      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe z-30">
        <div className="flex items-center justify-around">
          <Link href="/trainee/dashboard" className="flex flex-col items-center gap-1 py-3 px-2 flex-1 hover:bg-accent/50 transition-colors">
            <Home className={`h-6 w-6 ${pathname === '/trainee/dashboard' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-medium ${pathname === '/trainee/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}>בית</span>
          </Link>
          <Link href="/trainee/history" className="flex flex-col items-center gap-1 py-3 px-2 flex-1 hover:bg-accent/50 transition-colors">
            <BarChart3 className={`h-6 w-6 ${pathname === '/trainee/history' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-medium ${pathname === '/trainee/history' ? 'text-primary' : 'text-muted-foreground'}`}>התקדמות</span>
          </Link>
          <Link href="/trainee/nutrition" className="flex flex-col items-center gap-1 py-3 px-2 flex-1 hover:bg-accent/50 transition-colors">
            <Apple className={`h-6 w-6 ${pathname === '/trainee/nutrition' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-medium ${pathname === '/trainee/nutrition' ? 'text-primary' : 'text-muted-foreground'}`}>תזונה</span>
          </Link>
          <Link href="/trainee/workout" className="flex flex-col items-center gap-1 py-3 px-2 flex-1 hover:bg-accent/50 transition-colors">
            <Dumbbell className={`h-6 w-6 ${pathname?.startsWith('/trainee/workout') ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-medium ${pathname?.startsWith('/trainee/workout') ? 'text-primary' : 'text-muted-foreground'}`}>אימון</span>
          </Link>
          <Link href="/trainee/settings" className="flex flex-col items-center gap-1 py-3 px-2 flex-1 hover:bg-accent/50 transition-colors">
            <Settings className={`h-6 w-6 ${pathname === '/trainee/settings' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-medium ${pathname === '/trainee/settings' ? 'text-primary' : 'text-muted-foreground'}`}>הגדרות</span>
          </Link>
        </div>
      </div>

      {/* Instructions Modal */}
      {showInstructions && exercises.length > 0 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowInstructions(false)}>
          <Card className="bg-card border-border w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="sticky top-0 bg-card z-10 border-b border-border">
              <div className="flex justify-between items-center">
                <CardTitle className="text-foreground">הוראות והדגשים</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowInstructions(false)}>
                  <ChevronDown className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {exercises.map((exercise) => (
                exercise.specialInstructions && (
                  <div key={exercise.id} className="border-b border-border pb-4 last:border-0">
                    <h3 className="text-primary font-bold mb-2 text-lg">{exercise.name}</h3>
                    <div className="bg-accent/30 p-3 rounded-lg text-foreground/90 whitespace-pre-line text-sm leading-relaxed">
                      {exercise.specialInstructions}
                    </div>
                  </div>
                )
              ))}
              {exercises.every(e => !e.specialInstructions) && (
                <p className="text-center text-muted-foreground py-8">אין הוראות מיוחדות לאימון זה</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowCalculator(false)}>
          <Card className="bg-card border-border w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-foreground">מחשבון משקולות</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">מחשבון צלחות יתווסף בהמשך</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 left-4 flex flex-col gap-3 z-20">
        <Button
          variant="outline"
          size="icon"
          className="bg-card/90 backdrop-blur border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground rounded-full w-12 h-12 shadow-lg"
          onClick={() => setShowCalculator(!showCalculator)}
        >
          <Calculator className="h-5 w-5" />
        </Button>
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
