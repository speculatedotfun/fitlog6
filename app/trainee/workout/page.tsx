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

  useEffect(() => {
    if (exercises.length > 0) {
      initializeAllSets();
    }
  }, [exercises]);


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

  const handleRoutineChange = async (routine: RoutineWithExercises) => {
    setSelectedRoutine(routine);
    setShowRoutineSelector(false);
    setExercisesSets({}); // Clear previous sets
    await loadExercisesWithHistory(routine, user?.id || '');
  };


  const handleFinishWorkout = () => {
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

    // Prepare workout data for summary page
    const exercisesWithSets = exercises.map((exercise) => {
      const sets = exercisesSets[exercise.id] || [];
      return {
        id: exercise.id,
        name: exercise.name,
        exerciseId: exercise.exerciseId,
        specialInstructions: exercise.specialInstructions,
        targetSets: exercise.targetSets,
        targetReps: exercise.targetReps,
        restTime: exercise.restTime,
        rirTarget: exercise.rirTarget,
        previousPerformance: exercise.previousPerformance,
        videoUrl: exercise.videoUrl,
        imageUrl: exercise.imageUrl,
        muscleGroup: exercise.muscleGroup || 'אחר',
        sets: sets.length > 0 ? sets : [{
          setNumber: 1,
          weight: "",
          reps: "",
          rir: exercise.rirTarget.toString(),
        }],
      };
    });

    // Store workout data in sessionStorage
    const workoutSummaryData = {
      exercises: exercisesWithSets,
      routine: selectedRoutine,
      startTime: startTime,
    };

    sessionStorage.setItem('workoutSummaryData', JSON.stringify(workoutSummaryData));

    // Navigate to summary page
    window.location.href = '/trainee/workout/summary';
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
          const sets = exercisesSets[exercise.id] || [];
          const set = sets[0] || { setNumber: 1, weight: "", reps: "", rir: exercise.rirTarget.toString() || "1" };
          
          return (
            <div key={exercise.id} className="space-y-4">
              {/* Exercise Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="bg-primary/20 text-primary text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                  {exercise.name}
                </h2>
                {exercise.specialInstructions && (
                  <Button variant="ghost" size="sm" className="text-primary h-8 px-2" onClick={() => setShowInstructions(true)}>
                    <Info className="h-4 w-4 ml-1" />
                    הוראות
                  </Button>
                )}
              </div>

              {/* Video/Image */}
              <div className="relative w-full aspect-video bg-black/50 rounded-xl border border-border overflow-hidden shadow-sm">
                {exercise.videoUrl ? (
                  <video
                    src={exercise.videoUrl}
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                  />
                ) : exercise.imageUrl ? (
                  <img
                    src={exercise.imageUrl}
                    alt={exercise.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Play className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-muted-foreground/70 text-sm">אין מדיה זמינה</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Set 1 */}
              <Card className="bg-card border-border shadow-md overflow-hidden">
                <div className="bg-accent/30 p-3 border-b border-border flex justify-between items-center">
                  <span className="font-semibold text-foreground">סט עבודה</span>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>מטרה: {exercise.targetSets} סטים</span>
                    <span>{exercise.targetReps} חזרות</span>
                  </div>
                </div>
                <CardContent className="p-4 space-y-6">
                  {/* Weight and Reps */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground block text-center">חזרות</label>
                      <div className="relative">
                        <Input
                          type="number"
                          inputMode="numeric"
                          value={set.reps}
                          onChange={(e) => updateSet(exercise.id, "reps", e.target.value)}
                          placeholder={exercise.previousPerformance?.[0]?.reps.toString() || "10"}
                          className="bg-background/50 border-input text-foreground text-center text-2xl font-bold h-16 rounded-xl focus:ring-primary/50"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground block text-center">משקל (ק"ג)</label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.5"
                          inputMode="decimal"
                          value={set.weight}
                          onChange={(e) => updateSet(exercise.id, "weight", e.target.value)}
                          placeholder={exercise.previousPerformance?.[0]?.weight.toString() || "80"}
                          className="bg-background/50 border-input text-foreground text-center text-2xl font-bold h-16 rounded-xl focus:ring-primary/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* RIR Slider */}
                  <div className="bg-background/30 p-4 rounded-xl border border-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-medium text-muted-foreground">קרבה לכשל (RIR):</label>
                      <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-lg font-bold min-w-[3rem] text-center">
                        {set.rir}
                      </div>
                    </div>
                    <div className="px-2">
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.5"
                        value={set.rir}
                        onChange={(e) => updateSet(exercise.id, "rir", e.target.value)}
                        className="w-full h-3 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                        style={{
                          background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(parseFloat(set.rir) / 5) * 100}%, hsl(var(--secondary)) ${(parseFloat(set.rir) / 5) * 100}%, hsl(var(--secondary)) 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-2 font-medium">
                        <span>0 (כשל)</span>
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5 (קל)</span>
                      </div>
                    </div>
                  </div>

                  {/* Previous Best */}
                  {exercise.previousPerformance?.[0] && (
                    <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20 flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-blue-400 flex-shrink-0" />
                      <p className="text-sm text-blue-100">
                        שיא אישי: <span className="font-bold">{exercise.previousPerformance[0].weight} ק"ג</span> ל-<span className="font-bold">{exercise.previousPerformance[0].reps} חזרות</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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
