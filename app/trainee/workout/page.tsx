"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Calculator, Info, Play, Home, BarChart3, Users, Target, Settings, Apple, Dumbbell, ChevronDown } from "lucide-react";
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
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#00ff88]" />
          <p className="mt-2 text-gray-400">טוען...</p>
        </div>
      </div>
    );
  }

  if (!workoutPlan || routines.length === 0 || !selectedRoutine || exercises.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a1628]" dir="rtl">
        <div className="bg-[#1a2332] text-white p-4 sticky top-0 z-10 border-b border-gray-800">
          <div className="max-w-2xl mx-auto flex items-center">
            <Link href="/trainee/dashboard">
              <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
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
          <Card className="bg-[#1a2332] border-gray-800">
            <CardContent className="pt-6 text-center">
              <p className="text-gray-400">המאמן שלך עדיין לא יצר תוכנית אימונים</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#0a1628] pb-20" dir="rtl">
      {/* Header */}
      <div className="bg-[#1a2332] text-white p-4 sticky top-0 z-10 border-b border-gray-800">
        <div className="max-w-2xl mx-auto flex items-center">
          <Link href="/trainee/dashboard">
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div className="text-center flex-1">
            <Button
              variant="ghost"
              onClick={() => setShowRoutineSelector(!showRoutineSelector)}
              className="text-white hover:bg-gray-800"
            >
              <h1 className="text-xl font-bold">
                {workoutPlan.name} {selectedRoutine.letter}
                {selectedRoutine.name && ` - ${selectedRoutine.name}`}
              </h1>
              <ChevronDown className="h-5 w-5 mr-2" />
            </Button>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Routine Selector Dropdown */}
      {showRoutineSelector && (
        <div className="bg-[#1a2332] border-b border-gray-800 sticky top-[73px] z-10">
          <div className="max-w-2xl mx-auto p-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-400 mb-3">בחר רוטינה:</p>
              {routines.map((routine) => (
                <Button
                  key={routine.id}
                  variant={selectedRoutine?.id === routine.id ? "default" : "outline"}
                  onClick={() => handleRoutineChange(routine)}
                  className={`w-full justify-start ${
                    selectedRoutine?.id === routine.id
                      ? "bg-[#00ff88] hover:bg-[#00e677] text-black"
                      : "bg-[#0f1a2a] border-gray-700 text-white hover:bg-gray-800"
                  }`}
                >
                  <span className="font-bold text-lg ml-2">{routine.letter}</span>
                  {routine.name && <span className="text-sm"> - {routine.name}</span>}
                  {selectedRoutine?.id === routine.id && (
                    <span className="mr-auto text-xs">(נבחר)</span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* All Exercises */}
        {exercises.map((exercise, index) => {
          const sets = exercisesSets[exercise.id] || [];
          const set = sets[0] || { setNumber: 1, weight: "", reps: "", rir: exercise.rirTarget.toString() || "1" };
          
          return (
            <div key={exercise.id} className="space-y-4">
              {/* Exercise Name */}
              <div>
                <h2 className="text-lg text-gray-300 mb-2">תרגיל: {exercise.name}</h2>
              </div>

              {/* Video/Image */}
              <div className="relative w-full aspect-video bg-[#1a2332] rounded-lg border border-gray-800 overflow-hidden">
                {exercise.videoUrl ? (
                  <video
                    src={exercise.videoUrl}
                    className="w-full h-full object-cover"
                    controls
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
                      <Play className="h-16 w-16 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500">אין וידאו זמין</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Set 1 */}
              <Card className="bg-[#1a2332] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-xl">סט 1</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Weight and Reps */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">חזרות</label>
                      <Input
                        type="number"
                        value={set.reps}
                        onChange={(e) => updateSet(exercise.id, "reps", e.target.value)}
                        placeholder={exercise.previousPerformance?.[0]?.reps.toString() || "10"}
                        className="bg-[#0f1a2a] border-gray-700 text-white text-center text-lg font-semibold h-12"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">משקל (ק"ג)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={set.weight}
                        onChange={(e) => updateSet(exercise.id, "weight", e.target.value)}
                        placeholder={exercise.previousPerformance?.[0]?.weight.toString() || "80"}
                        className="bg-[#0f1a2a] border-gray-700 text-white text-center text-lg font-semibold h-12"
                      />
                    </div>
                  </div>

                  {/* RIR Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-400">RIR:</label>
                      <span className="text-lg font-bold text-[#00ff88]">{set.rir}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={set.rir}
                      onChange={(e) => updateSet(exercise.id, "rir", e.target.value)}
                      className="w-full h-2 bg-[#0f1a2a] rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #00ff88 0%, #00ff88 ${(parseFloat(set.rir) / 10) * 100}%, #0f1a2a ${(parseFloat(set.rir) / 10) * 100}%, #0f1a2a 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>2.5</span>
                      <span>5</span>
                      <span>7.5</span>
                      <span>10</span>
                    </div>
                  </div>

                  {/* Previous Best */}
                  {exercise.previousPerformance?.[0] && (
                    <div className="bg-[#0f1a2a] rounded-lg p-3 border border-gray-800">
                      <p className="text-sm text-gray-400">
                        הכי טוב קודם: {exercise.previousPerformance[0].reps} חזרות, {exercise.previousPerformance[0].weight} ק"ג
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}

        {/* Action Button */}
        <Button
          className="w-full bg-[#00ff88] hover:bg-[#00e677] text-black font-bold h-14 text-lg"
          onClick={handleFinishWorkout}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 ml-2 animate-spin" />
              שומר...
            </>
          ) : (
            "סיים אימון"
          )}
        </Button>

      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a2332] border-t border-gray-800 px-4 py-2 pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <Link href="/trainee/dashboard" className="flex flex-col items-center gap-1 py-2 px-4">
            <Home className={`h-5 w-5 ${pathname === '/trainee/dashboard' ? 'text-[#00ff88]' : 'text-gray-500'}`} />
            <span className={`text-xs ${pathname === '/trainee/dashboard' ? 'text-[#00ff88]' : 'text-gray-500'}`}>בית</span>
          </Link>
          <Link href="/trainee/history" className="flex flex-col items-center gap-1 py-2 px-4">
            <BarChart3 className={`h-5 w-5 ${pathname === '/trainee/history' ? 'text-[#00ff88]' : 'text-gray-500'}`} />
            <span className={`text-xs ${pathname === '/trainee/history' ? 'text-[#00ff88]' : 'text-gray-500'}`}>התקדמות</span>
          </Link>
          <Link href="/trainee/nutrition" className="flex flex-col items-center gap-1 py-2 px-4">
            <Apple className={`h-5 w-5 ${pathname === '/trainee/nutrition' ? 'text-[#00ff88]' : 'text-gray-500'}`} />
            <span className={`text-xs ${pathname === '/trainee/nutrition' ? 'text-[#00ff88]' : 'text-gray-500'}`}>תזונה</span>
          </Link>
          <Link href="/trainee/workout" className="flex flex-col items-center gap-1 py-2 px-4">
            <Dumbbell className={`h-5 w-5 ${pathname?.startsWith('/trainee/workout') ? 'text-[#00ff88]' : 'text-gray-500'}`} />
            <span className={`text-xs ${pathname?.startsWith('/trainee/workout') ? 'text-[#00ff88]' : 'text-gray-500'}`}>אימון</span>
          </Link>
          <Link href="/trainee/settings" className="flex flex-col items-center gap-1 py-2 px-4">
            <Settings className={`h-5 w-5 ${pathname === '/trainee/settings' ? 'text-[#00ff88]' : 'text-gray-500'}`} />
            <span className={`text-xs ${pathname === '/trainee/settings' ? 'text-[#00ff88]' : 'text-gray-500'}`}>הגדרות</span>
          </Link>
        </div>
      </div>

      {/* Instructions Modal */}
      {showInstructions && exercises.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowInstructions(false)}>
          <Card className="bg-[#1a2332] border-gray-800 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-white">הוראות תרגילים</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {exercises.map((exercise) => (
                exercise.specialInstructions && (
                  <div key={exercise.id} className="border-b border-gray-800 pb-4 last:border-0">
                    <h3 className="text-white font-semibold mb-2">{exercise.name}</h3>
                    <p className="text-gray-300 whitespace-pre-line text-sm">{exercise.specialInstructions}</p>
                  </div>
                )
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCalculator(false)}>
          <Card className="bg-[#1a2332] border-gray-800 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-white">מחשבון משקולות</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">מחשבון משקולות יתווסף בהמשך</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-20 left-4 right-4 flex justify-between max-w-md mx-auto z-40">
        <Button
          variant="outline"
          size="icon"
          className="bg-[#1a2332] border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white rounded-full w-12 h-12"
          onClick={() => setShowCalculator(!showCalculator)}
        >
          <Calculator className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-[#1a2332] border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white rounded-full w-12 h-12"
          onClick={() => setShowInstructions(!showInstructions)}
        >
          <Info className="h-5 w-5" />
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
