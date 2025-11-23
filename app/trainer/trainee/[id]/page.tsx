"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Scale, Edit, Save, Eye, TrendingUp, Plus, Trash2, X, Image as ImageIcon, Upload, Apple, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  getUser,
  getActiveWorkoutPlan,
  createWorkoutPlan,
  getRoutinesWithExercises,
  createRoutine,
  getWorkoutLogs,
  getBodyWeightHistory,
  getExerciseLibrary,
  getExerciseByName,
  createExercise,
  getNutritionMenu,
  updateNutritionMenu,
  getNutritionSwaps,
  createRoutineExercise,
  updateRoutineExercise,
  deleteRoutineExercise,
  updateExercise,
} from "@/lib/db";
import type { User, RoutineWithExercises, WorkoutLogWithDetails, Exercise, NutritionMenu, RoutineLetter } from "@/lib/types";

function TraineeManagementPageContent() {
  const params = useParams();
  const traineeId = params.id as string;
  const { user } = useAuth();

  // Ensure user is authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  // State for real data from Supabase
  const [trainee, setTrainee] = useState<User | null>(null);
  const [weeklyWeights, setWeeklyWeights] = useState<Array<{ date: string; weight: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for workout plan
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogWithDetails[]>([]);

  const [activeTab, setActiveTab] = useState<"plan" | "logs" | "nutrition">("logs");
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [addingExercise, setAddingExercise] = useState<string | null>(null);
  const [showHistoryExercises, setShowHistoryExercises] = useState<Record<string, boolean>>({});
  const [showCreatePlanForm, setShowCreatePlanForm] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [showAddRoutineForm, setShowAddRoutineForm] = useState(false);
  const [newRoutineLetter, setNewRoutineLetter] = useState<"A" | "B" | "C" | "D" | "E">("A");
  const [newRoutineName, setNewRoutineName] = useState("");
  
  // Combobox states for exercise selection
  const [exerciseInputs, setExerciseInputs] = useState<Record<string, string>>({});
  const [exerciseDropdownOpen, setExerciseDropdownOpen] = useState<Record<string, boolean>>({});
  
  // Nutrition menu state
  const [nutritionMenu, setNutritionMenu] = useState<NutritionMenu | null>(null);
  const [foodLibrary, setFoodLibrary] = useState<Array<{id: string, name: string}>>([]);
  
  // Get trainer ID from authenticated user
  const TRAINER_ID = user?.id;
  
  // Load all data from Supabase
  useEffect(() => {
    loadData();
  }, [traineeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load trainee
      const traineeData = await getUser(traineeId);
      setTrainee(traineeData);

      // Load weight history
      const weights = await getBodyWeightHistory(traineeId);
      setWeeklyWeights(weights);

      // Load workout plan
      const plan = await getActiveWorkoutPlan(traineeId);
      setWorkoutPlan(plan);

      // Load routines with exercises
      if (plan) {
        const routinesData = await getRoutinesWithExercises(plan.id);
        setRoutines(routinesData);
      }

      // Load workout logs
      const logs = await getWorkoutLogs(traineeId);
      setWorkoutLogs(logs);

      // Load exercise library
      const exercises = await getExerciseLibrary();
      setExerciseLibrary(exercises);

      // Load nutrition menu
      const menu = await getNutritionMenu(traineeId);
      setNutritionMenu(menu || { meals: [] });

      // Load food library
      const foods = await getNutritionSwaps();
      setFoodLibrary(foods.map(food => ({ id: food.id, name: food.food_name })));

    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || "שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  };

  // Get exercise history from routines and logs
  const getExerciseHistory = () => {
    const historyMap = new Map<string, any>();
    
    // Add exercises from current plan
    routines.forEach(routine => {
      routine.routine_exercises.forEach(re => {
        if (re.exercise && !historyMap.has(re.exercise.name)) {
          historyMap.set(re.exercise.name, {
            name: re.exercise.name,
            sets: re.target_sets,
            reps: `${re.target_reps_min}-${re.target_reps_max}`,
            rir: re.rir_target,
            instructions: re.special_instructions || "",
            image_url: re.exercise.image_url || null,
          });
        }
      });
    });
    
    return Array.from(historyMap.values());
  };
  
  const exerciseHistory = getExerciseHistory();


  const handleExerciseEdit = (exerciseId: string) => {
    setEditingExercise(exerciseId);
  };

  const handleExerciseSave = (routineId: string, exerciseId: string, updates: any) => {
    // TODO: Save exercise changes to Supabase
    console.log("Saving exercise:", { routineId, exerciseId, updates });
    setWorkoutPlan((prev: any) => ({
      ...prev,
      routines: prev.routines.map((routine: any) =>
        routine.id === routineId
          ? {
              ...routine,
              exercises: routine.exercises.map((ex: any) =>
                ex.id === exerciseId ? { ...ex, ...updates } : ex
              ),
            }
          : routine
      ),
    }));
    setEditingExercise(null);
  };

  const handleExerciseDelete = (routineId: string, exerciseId: string) => {
    // TODO: Delete exercise from Supabase
    console.log("Deleting exercise:", { routineId, exerciseId });
    setWorkoutPlan((prev: any) => ({
      ...prev,
      routines: prev.routines.map((routine: any) =>
        routine.id === routineId
          ? {
              ...routine,
              exercises: routine.exercises.filter((ex: any) => ex.id !== exerciseId),
            }
          : routine
      ),
    }));
  };

  const handleExerciseReplace = (routineId: string, exerciseId: string, newExerciseName: string) => {
    // TODO: Replace exercise in Supabase
    console.log("Replacing exercise:", { routineId, exerciseId, newExerciseName });
    setWorkoutPlan((prev: any) => ({
      ...prev,
      routines: prev.routines.map((routine: any) =>
        routine.id === routineId
          ? {
              ...routine,
              exercises: routine.exercises.map((ex: any) =>
                ex.id === exerciseId ? { ...ex, name: newExerciseName, instructions: (ex as any).instructions || "" } : ex
              ),
            }
          : routine
      ),
    }));
  };

  const handleAddExercise = async (routineId: string, exerciseName: string, sets: number, reps: string, rir: number, instructions: string, image_url: string | null) => {
    if (!exerciseName.trim()) {
      alert("אנא הזן שם תרגיל");
      return;
    }

    try {
      setError(null);
      
      // Parse reps range (e.g., "8-12")
      const repsRange = reps.split("-");
      const repsMin = parseInt(repsRange[0] || "8");
      const repsMax = parseInt(repsRange[1] || repsRange[0] || "12");
      
      // Check if exercise exists by name
      let exercise = await getExerciseByName(exerciseName.trim());
      
      // If exercise doesn't exist, create it
      if (!exercise) {
        exercise = await createExercise({
          name: exerciseName.trim(),
          muscle_group: "כללי", // Default, can be changed later
          image_url: image_url || null,
          video_url: null,
          description: null,
          created_by: TRAINER_ID,
        });
        
        // Reload exercise library to include the new exercise
        const updatedExercises = await getExerciseLibrary();
        setExerciseLibrary(updatedExercises);
      }
      
      // Create routine exercise
      await createRoutineExercise({
        routine_id: routineId,
        exercise_id: exercise.id,
        target_sets: sets,
        target_reps_min: repsMin,
        target_reps_max: repsMax,
        rir_target: rir,
        rest_time_seconds: 180, // Default 3 minutes
        notes: null,
        special_instructions: instructions || null,
        order_index: 0, // Will be updated later
      });
      
      // Reload data
      await loadData();
      
      // Clear form
      setAddingExercise(null);
      setShowHistoryExercises(prev => ({ ...prev, [routineId]: false }));
      setExerciseInputs(prev => {
        const newState = { ...prev };
        delete newState[`new-${routineId}`];
        return newState;
      });
    } catch (err: any) {
      console.error("Error adding exercise:", err);
      setError(err.message || "שגיאה בהוספת התרגיל");
      alert("שגיאה בהוספת התרגיל: " + err.message);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
        <div className="max-w-4xl mx-auto pt-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="mt-2 text-muted-foreground">טוען נתונים...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !trainee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
        <div className="max-w-4xl mx-auto pt-8">
          <Card className="border-red-500">
            <CardContent className="pt-6">
              <p className="text-red-800">{error || "לא נמצא מתאמן"}</p>
              <Link href="/trainer">
                <Button variant="outline" className="mt-4">
                  חזור לרשימת המתאמנים
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Additional safety check
  if (!trainee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
        <div className="max-w-4xl mx-auto pt-8">
          <Card className="border-red-500">
            <CardContent className="pt-6">
              <p className="text-red-800">לא נמצא מתאמן</p>
              <Link href="/trainer">
                <Button variant="outline" className="mt-4">
                  חזור לרשימת המתאמנים
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/trainer">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <CardTitle className="text-2xl">{trainee?.name || "מתאמן"}</CardTitle>
                  <CardDescription>ניהול מתאמן</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Tabs */}
            <div className="flex gap-2 border-b">
              <Button
                variant={activeTab === "plan" ? "default" : "ghost"}
                onClick={() => setActiveTab("plan")}
                className="rounded-b-none"
              >
                <Edit className="h-4 w-4 ml-2" />
                תוכנית אימונים
              </Button>
              <Button
                variant={activeTab === "logs" ? "default" : "ghost"}
                onClick={() => setActiveTab("logs")}
                className="rounded-b-none"
              >
                <Eye className="h-4 w-4 ml-2" />
                לוגים והתקדמות
              </Button>
              <Button
                variant={activeTab === "nutrition" ? "default" : "ghost"}
                onClick={() => setActiveTab("nutrition")}
                className="rounded-b-none"
              >
                <Apple className="h-4 w-4 ml-2" />
                תפריט תזונה
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Workout Plan Tab */}
        {activeTab === "plan" && (
          <Card>
            <CardHeader>
              <CardTitle>עריכת תוכנית אימונים</CardTitle>
              <CardDescription>
                ערוך את התרגילים, סטים, חזרות ו-RIR לכל אימון
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!workoutPlan ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    אין תוכנית אימונים פעילה
                  </p>
                  {!showCreatePlanForm ? (
                    <Button
                      onClick={() => setShowCreatePlanForm(true)}
                      size="lg"
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      צור תוכנית אימונים חדשה
                    </Button>
                  ) : (
                    <Card className="max-w-md mx-auto border-2 border-blue-500">
                      <CardHeader>
                        <CardTitle>צור תוכנית אימונים חדשה</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">שם התוכנית</label>
                          <Input
                            type="text"
                            placeholder="לדוגמה: תוכנית ינואר 2025"
                            value={newPlanName}
                            onChange={(e) => setNewPlanName(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={async () => {
                              if (!newPlanName.trim()) {
                                alert("אנא הזן שם לתוכנית");
                                return;
                              }
                              
                              try {
                                setCreatingPlan(true);
                                setError(null);
                                
                                // Create workout plan
                                const plan = await createWorkoutPlan({
                                  trainee_id: traineeId,
                                  trainer_id: TRAINER_ID,
                                  name: newPlanName,
                                  is_active: true,
                                  start_date: new Date().toISOString().split('T')[0],
                                  end_date: null,
                                  weekly_target_workouts: 5,
                                });
                                
                                setNewPlanName("");
                                setShowCreatePlanForm(false);
                                await loadData(); // Reload to show the new plan
                              } catch (err: any) {
                                console.error("Error creating plan:", err);
                                setError(err.message || "שגיאה ביצירת תוכנית");
                              } finally {
                                setCreatingPlan(false);
                              }
                            }}
                            disabled={creatingPlan || !newPlanName.trim()}
                            className="flex-1"
                          >
                            {creatingPlan ? (
                              <>
                                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                יוצר...
                              </>
                            ) : (
                              "צור תוכנית"
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowCreatePlanForm(false);
                              setNewPlanName("");
                            }}
                            disabled={creatingPlan}
                            className="flex-1"
                          >
                            ביטול
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : routines.length === 0 || showAddRoutineForm ? (
                <div className="text-center py-8">
                  {routines.length === 0 && (
                    <p className="text-muted-foreground mb-4">
                      אין אימונים בתוכנית.
                    </p>
                  )}
                  {showAddRoutineForm && (
                    <p className="text-muted-foreground mb-4">
                      הוסף אימון חדש
                    </p>
                  )}
                  <Card className="max-w-md mx-auto">
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">בחר אות אימון</label>
                        <div className="flex gap-2 justify-center">
                          {(['A', 'B', 'C', 'D', 'E'] as RoutineLetter[]).map((letter) => {
                            const letterUsed = routines.some(r => r.letter === letter);
                            return (
                              <button
                                key={letter}
                                type="button"
                                onClick={() => !letterUsed && setNewRoutineLetter(letter)}
                                disabled={letterUsed}
                                className={`
                                  w-12 h-12 rounded-lg font-bold text-lg border-2 transition-all
                                  ${newRoutineLetter === letter 
                                    ? 'bg-blue-600 text-white border-blue-600' 
                                    : letterUsed
                                    ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                                  }
                                `}
                                title={letterUsed ? `אות ${letter} כבר בשימוש` : `בחר ${letter}`}
                              >
                                {letter}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">שם האימון</label>
                        <Input
                          type="text"
                          value={newRoutineName}
                          onChange={(e) => setNewRoutineName(e.target.value)}
                          placeholder={`אימון ${newRoutineLetter}`}
                          className="text-center"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={async () => {
                            if (!workoutPlan) return;
                            
                            try {
                              setCreatingPlan(true);
                              setError(null);
                              
                              // Create routine with selected letter
                              await createRoutine({
                                plan_id: workoutPlan.id,
                                letter: newRoutineLetter,
                                name: newRoutineName || `אימון ${newRoutineLetter}`,
                                description: null,
                                order_index: routines.length,
                              });
                              
                              // Reset form
                              setNewRoutineLetter('A');
                              setNewRoutineName('');
                              setShowAddRoutineForm(false);
                              
                              await loadData(); // Reload to show the new routine
                            } catch (err: any) {
                              console.error("Error creating routine:", err);
                              setError(err.message || "שגיאה ביצירת אימון");
                            } finally {
                              setCreatingPlan(false);
                            }
                          }}
                          disabled={creatingPlan || !workoutPlan}
                          className="flex-1"
                        >
                          {creatingPlan ? (
                            <>
                              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                              יוצר...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 ml-2" />
                              הוסף אימון
                            </>
                          )}
                        </Button>
                        {showAddRoutineForm && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowAddRoutineForm(false);
                              setNewRoutineName('');
                            }}
                          >
                            ביטול
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                routines.map((routine) => (
                <Card key={routine.id} className="border-2">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      אימון {routine.letter} - {routine.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {routine.routine_exercises.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">אין תרגילים באימון זה</p>
                      ) : (
                        routine.routine_exercises.map((routineExercise) => {
                          const exercise = routineExercise.exercise;
                          if (!exercise) return null;
                          
                          return (
                        <div
                          key={routineExercise.id}
                          className="border rounded-lg p-4 bg-white"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{exercise.name}</h4>
                              <div className="flex gap-4 mt-2 text-sm">
                                <span>
                                  <span className="text-muted-foreground">סטים:</span>{" "}
                                  <span className="font-semibold">{routineExercise.target_sets}</span>
                                </span>
                                <span>
                                  <span className="text-muted-foreground">חזרות:</span>{" "}
                                  <span className="font-semibold">{routineExercise.target_reps_min}-{routineExercise.target_reps_max}</span>
                                </span>
                                <span>
                                  <span className="text-muted-foreground">RIR:</span>{" "}
                                  <span className="font-semibold">{routineExercise.rir_target}</span>
                                </span>
                              </div>
                              {routineExercise.special_instructions && routineExercise.special_instructions.length > 0 && (
                                <div className="mt-2 p-2 bg-yellow-50 border-r-4 border-yellow-400 rounded">
                                  <p className="text-xs text-yellow-900 font-medium mb-1">הוראות ביצוע:</p>
                                  <p className="text-sm text-yellow-800">{routineExercise.special_instructions}</p>
                                </div>
                              )}
                              {exercise.image_url && (
                                <div className="mt-3">
                                  <img
                                    src={exercise.image_url}
                                    alt={exercise.name}
                                    className="w-full max-w-xs rounded-lg border border-gray-200"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {editingExercise === routineExercise.id ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    // Get values from inputs
                                    const setsInput = document.querySelector(`[data-exercise="${routineExercise.id}"][data-field="sets"]`) as HTMLInputElement;
                                    const repsInput = document.querySelector(`[data-exercise="${routineExercise.id}"][data-field="reps"]`) as HTMLInputElement;
                                    const rirInput = document.querySelector(`[data-exercise="${routineExercise.id}"][data-field="rir"]`) as HTMLInputElement;
                                    const instructionsInput = document.querySelector(`[data-exercise="${routineExercise.id}"][data-field="instructions"]`) as HTMLTextAreaElement;
                                    const imageInput = document.querySelector(`[data-exercise="${routineExercise.id}"][data-field="image_url"]`) as HTMLInputElement;
                                    
                                    // Get new exercise name from replace input
                                    const newExerciseName = exerciseInputs[`replace-${routineExercise.id}`]?.trim();
                                    
                                    const repsRange = repsInput?.value?.split("-") || [];
                                    const repsMin = parseInt(repsRange[0] || routineExercise.target_reps_min.toString());
                                    const repsMax = parseInt(repsRange[1] || repsRange[0] || routineExercise.target_reps_max.toString());
                                    
                                    try {
                                      // If exercise name was changed, update or replace the exercise
                                      if (newExerciseName && newExerciseName !== exercise.name) {
                                        // Check if new exercise exists
                                        let newExercise = await getExerciseByName(newExerciseName);
                                        
                                        // If doesn't exist, create it
                                        if (!newExercise) {
                                          newExercise = await createExercise({
                                            name: newExerciseName,
                                            muscle_group: exercise.muscle_group || "כללי",
                                            image_url: imageInput?.value || exercise.image_url || null,
                                            video_url: exercise.video_url || null,
                                            description: exercise.description || null,
                                            created_by: TRAINER_ID || null,
                                          });
                                          
                                          // Reload exercise library
                                          const updatedExercises = await getExerciseLibrary();
                                          setExerciseLibrary(updatedExercises);
                                        }
                                        
                                        // Update routine_exercise to use new exercise
                                        await updateRoutineExercise(routineExercise.id, {
                                          exercise_id: newExercise.id,
                                          target_sets: parseInt(setsInput?.value || routineExercise.target_sets.toString()),
                                          target_reps_min: repsMin,
                                          target_reps_max: repsMax,
                                          rir_target: parseInt(rirInput?.value || routineExercise.rir_target.toString()),
                                          special_instructions: instructionsInput?.value || null,
                                        });
                                      } else {
                                        // Just update routine_exercise parameters
                                        await updateRoutineExercise(routineExercise.id, {
                                          target_sets: parseInt(setsInput?.value || routineExercise.target_sets.toString()),
                                          target_reps_min: repsMin,
                                          target_reps_max: repsMax,
                                          rir_target: parseInt(rirInput?.value || routineExercise.rir_target.toString()),
                                          special_instructions: instructionsInput?.value || null,
                                        });
                                        
                                        // Update exercise name if it was changed in the input (but same exercise)
                                        if (newExerciseName && newExerciseName !== exercise.name && exercise.id) {
                                          await updateExercise(exercise.id, {
                                            name: newExerciseName,
                                          });
                                        }
                                        
                                        // Update exercise image if needed
                                        if (imageInput?.value && exercise.id) {
                                          await updateExercise(exercise.id, {
                                            image_url: imageInput.value,
                                          });
                                        }
                                      }
                                      
                                      await loadData(); // Reload data
                                      setEditingExercise(null);
                                      // Clear the replace input
                                      setExerciseInputs(prev => {
                                        const newState = { ...prev };
                                        delete newState[`replace-${routineExercise.id}`];
                                        return newState;
                                      });
                                    } catch (err: any) {
                                      console.error("Error saving exercise:", err);
                                      alert("שגיאה בשמירת התרגיל: " + err.message);
                                    }
                                  }}
                                >
                                  <Save className="h-4 w-4 ml-2" />
                                  שמור
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleExerciseEdit(routineExercise.id)}
                                  >
                                    <Edit className="h-4 w-4 ml-2" />
                                    ערוך
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      if (confirm("האם אתה בטוח שברצונך למחוק את התרגיל?")) {
                                        try {
                                          await deleteRoutineExercise(routineExercise.id);
                                          await loadData(); // Reload data
                                        } catch (err: any) {
                                          console.error("Error deleting exercise:", err);
                                          alert("שגיאה במחיקת התרגיל: " + err.message);
                                        }
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4 ml-2" />
                                    מחק
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          {editingExercise === routineExercise.id && (
                            <div className="mt-4 pt-4 border-t space-y-4">
                              {/* Replace Exercise */}
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                  החלף תרגיל
                                </label>
                                <div className="relative">
                                  <Input
                                    type="text"
                                    defaultValue={exercise.name}
                                    placeholder="הקלד או בחר תרגיל..."
                                    className="w-full"
                                    onChange={(e) => {
                                      const inputValue = e.target.value;
                                      setExerciseInputs(prev => ({ ...prev, [`replace-${routineExercise.id}`]: inputValue }));
                                      setExerciseDropdownOpen(prev => ({ ...prev, [`replace-${routineExercise.id}`]: true }));
                                    }}
                                    onFocus={() => setExerciseDropdownOpen(prev => ({ ...prev, [`replace-${routineExercise.id}`]: true }))}
                                    onBlur={() => {
                                      setTimeout(() => {
                                        setExerciseDropdownOpen(prev => ({ ...prev, [`replace-${routineExercise.id}`]: false }));
                                      }, 200);
                                    }}
                                  />
                                  {exerciseDropdownOpen[`replace-${routineExercise.id}`] && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                      {exerciseLibrary.length === 0 ? (
                                        <div className="px-4 py-2 text-sm text-muted-foreground">
                                          אין תרגילים במאגר. הקלד שם תרגיל חדש.
                                        </div>
                                      ) : (
                                        <>
                                          {exerciseLibrary
                                            .filter((ex) => 
                                              !exerciseInputs[`replace-${routineExercise.id}`] || 
                                              ex.name.toLowerCase().includes(exerciseInputs[`replace-${routineExercise.id}`]?.toLowerCase() || "")
                                            )
                                            .map((ex) => (
                                              <div
                                                key={ex.id}
                                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                                                onClick={() => {
                                                  setExerciseInputs(prev => ({ ...prev, [`replace-${routineExercise.id}`]: ex.name }));
                                                  setExerciseDropdownOpen(prev => ({ ...prev, [`replace-${routineExercise.id}`]: false }));
                                                }}
                                              >
                                                {ex.name}
                                              </div>
                                            ))}
                                          {exerciseInputs[`replace-${routineExercise.id}`] && 
                                           exerciseLibrary.every(ex => 
                                             !ex.name.toLowerCase().includes(exerciseInputs[`replace-${routineExercise.id}`]?.toLowerCase() || "")
                                           ) && (
                                            <div className="px-4 py-2 text-sm text-blue-600 border-t">
                                              יצירת תרגיל חדש: "{exerciseInputs[`replace-${routineExercise.id}`]}"
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  💡 תוכל להקליד שם חדש או לבחור מהרשימה
                                </p>
                              </div>
                              
                              {/* Edit Parameters */}
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="text-xs text-muted-foreground mb-1 block">
                                    סטים
                                  </label>
                                  <Input
                                    type="number"
                                    data-exercise={routineExercise.id}
                                    data-field="sets"
                                    defaultValue={routineExercise.target_sets}
                                    className="text-center"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground mb-1 block">
                                    חזרות (לדוגמה: 6-10)
                                  </label>
                                  <Input
                                    type="text"
                                    data-exercise={routineExercise.id}
                                    data-field="reps"
                                    defaultValue={`${routineExercise.target_reps_min}-${routineExercise.target_reps_max}`}
                                    placeholder="6-10"
                                    className="text-center"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground mb-1 block">
                                    RIR (0-4)
                                  </label>
                                  <Input
                                    type="number"
                                    data-exercise={routineExercise.id}
                                    data-field="rir"
                                    min="0"
                                    max="4"
                                    defaultValue={routineExercise.rir_target}
                                    className="text-center"
                                  />
                                </div>
                              </div>
                              
                              {/* Instructions Field */}
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                  הוראות ביצוע (איך לעשות את התרגיל)
                                </label>
                                <textarea
                                  data-exercise={routineExercise.id}
                                  data-field="instructions"
                                  defaultValue={routineExercise.special_instructions || ""}
                                  placeholder="לדוגמה: רוחב כתפיים, ברכיים נעולות..."
                                  className="w-full px-3 py-2 border rounded-md text-sm min-h-[80px] resize-y"
                                />
                              </div>
                              
                              {/* Image Upload Field */}
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                  <ImageIcon className="inline h-3 w-3 ml-1" />
                                  תמונה של התרגיל (URL או העלאה)
                                </label>
                                {(exercise as any).image_url && (
                                  <div className="mb-2">
                                    <img
                                      src={(exercise as any).image_url}
                                      alt={exercise.name}
                                      className="w-full max-w-xs rounded-lg border border-gray-200 mb-2"
                                    />
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <Input
                                    type="text"
                                    data-exercise={routineExercise.id}
                                    data-field="image_url"
                                    defaultValue={exercise.image_url || ""}
                                    placeholder="הזן URL של תמונה..."
                                    className="flex-1"
                                  />
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          // TODO: Upload to Supabase storage and get URL
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            const url = event.target?.result as string;
                                            const imageInput = document.querySelector(`[data-exercise="${routineExercise.id}"][data-field="image_url"]`) as HTMLInputElement;
                                            if (imageInput) {
                                              imageInput.value = url;
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                    <Button type="button" variant="outline" size="sm" className="whitespace-nowrap">
                                      <Upload className="h-4 w-4 ml-1" />
                                      העלה
                                    </Button>
                                  </label>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                          );
                        })
                      )}
                      
                      {/* Add Exercise Button */}
                      {addingExercise !== routine.id ? (
                        <Button
                          variant="outline"
                          className="w-full mt-4"
                          onClick={() => setAddingExercise(routine.id)}
                        >
                          <Plus className="h-4 w-4 ml-2" />
                          הוסף תרגיל חדש
                        </Button>
                      ) : (
                        <Card className="mt-4 border-2 border-blue-500">
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              {/* Toggle between History and Library */}
                              <div className="flex gap-2 mb-4">
                                <Button
                                  type="button"
                                  variant={!showHistoryExercises[routine.id] ? "default" : "outline"}
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => setShowHistoryExercises(prev => ({ ...prev, [routine.id]: false }))}
                                >
                                  מאגר תרגילים
                                </Button>
                                <Button
                                  type="button"
                                  variant={showHistoryExercises[routine.id] ? "default" : "outline"}
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => setShowHistoryExercises(prev => ({ ...prev, [routine.id]: true }))}
                                  disabled={exerciseHistory.length === 0}
                                >
                                  היסטוריה ({exerciseHistory.length})
                                </Button>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  {showHistoryExercises[routine.id] ? "בחר תרגיל מהיסטוריה" : "בחר תרגיל"}
                                </label>
                                {showHistoryExercises[routine.id] ? (
                                  <select
                                    id={`exercise-history-select-${routine.id}`}
                                    className="w-full px-3 py-2 border rounded-md"
                                    onChange={(e) => {
                                      const selectedExercise = exerciseHistory.find(
                                        ex => ex.name === e.target.value
                                      );
                                      if (selectedExercise) {
                                        // Fill all fields with history data
                                        const setsInput = document.getElementById(`sets-${routine.id}`) as HTMLInputElement;
                                        const repsInput = document.getElementById(`reps-${routine.id}`) as HTMLInputElement;
                                        const rirInput = document.getElementById(`rir-${routine.id}`) as HTMLInputElement;
                                        const instructionsInput = document.getElementById(`instructions-${routine.id}`) as HTMLTextAreaElement;
                                        const imageInput = document.getElementById(`image_url-${routine.id}`) as HTMLInputElement;
                                        
                                        if (setsInput) setsInput.value = selectedExercise.sets.toString();
                                        if (repsInput) repsInput.value = selectedExercise.reps;
                                        if (rirInput) rirInput.value = selectedExercise.rir.toString();
                                        if (instructionsInput) instructionsInput.value = selectedExercise.instructions || "";
                                        if (imageInput) imageInput.value = selectedExercise.image_url || "";
                                      }
                                    }}
                                  >
                                    <option value="">בחר תרגיל מההיסטוריה...</option>
                                    {exerciseHistory.map((ex) => (
                                      <option key={ex.name} value={ex.name}>
                                        {ex.name} {ex.instructions ? `(${ex.instructions.substring(0, 30)}...)` : ""}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="relative">
                                    <Input
                                      type="text"
                                      id={`exercise-select-${routine.id}`}
                                      placeholder="הקלד או בחר תרגיל..."
                                      value={exerciseInputs[`new-${routine.id}`] || ""}
                                      onChange={(e) => {
                                        setExerciseInputs(prev => ({ ...prev, [`new-${routine.id}`]: e.target.value }));
                                        setExerciseDropdownOpen(prev => ({ ...prev, [`new-${routine.id}`]: true }));
                                      }}
                                      onFocus={() => setExerciseDropdownOpen(prev => ({ ...prev, [`new-${routine.id}`]: true }))}
                                      onBlur={() => {
                                        // Delay closing to allow click on dropdown item
                                        setTimeout(() => {
                                          setExerciseDropdownOpen(prev => ({ ...prev, [`new-${routine.id}`]: false }));
                                        }, 200);
                                      }}
                                      className="w-full"
                                    />
                                    {exerciseDropdownOpen[`new-${routine.id}`] && (
                                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                        {exerciseLibrary.length === 0 ? (
                                          <div className="px-4 py-2 text-sm text-muted-foreground">
                                            אין תרגילים במאגר. הקלד שם תרגיל חדש.
                                          </div>
                                        ) : (
                                          <>
                                            {exerciseLibrary
                                              .filter((ex) => 
                                                !exerciseInputs[`new-${routine.id}`] || 
                                                ex.name.toLowerCase().includes(exerciseInputs[`new-${routine.id}`].toLowerCase())
                                              )
                                              .map((ex) => (
                                                <div
                                                  key={ex.id}
                                                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                                                  onClick={() => {
                                                    setExerciseInputs(prev => ({ ...prev, [`new-${routine.id}`]: ex.name }));
                                                    setExerciseDropdownOpen(prev => ({ ...prev, [`new-${routine.id}`]: false }));
                                                  }}
                                                >
                                                  {ex.name}
                                                </div>
                                              ))}
                                            {exerciseInputs[`new-${routine.id}`] && 
                                             exerciseLibrary.every(ex => 
                                               !ex.name.toLowerCase().includes(exerciseInputs[`new-${routine.id}`].toLowerCase())
                                             ) && (
                                              <div className="px-4 py-2 text-sm text-blue-600 border-t">
                                                יצירת תרגיל חדש: "{exerciseInputs[`new-${routine.id}`]}"
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {!showHistoryExercises[routine.id] && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    💡 תוכל להקליד שם תרגיל חדש או לבחור מהרשימה. אם התרגיל לא קיים, הוא ייווצר אוטומטית.
                                  </p>
                                )}
                                {showHistoryExercises[routine.id] && exerciseHistory.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    💡 בחירת תרגיל מההיסטוריה תמלא אוטומטית את כל השדות (סטים, חזרות, RIR, הוראות, תמונה)
                                  </p>
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="text-xs text-muted-foreground mb-1 block">
                                    סטים
                                  </label>
                                  <Input
                                    id={`sets-${routine.id}`}
                                    type="number"
                                    defaultValue={3}
                                    className="text-center"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground mb-1 block">
                                    חזרות
                                  </label>
                                  <Input
                                    id={`reps-${routine.id}`}
                                    type="text"
                                    defaultValue="8-12"
                                    placeholder="8-12"
                                    className="text-center"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground mb-1 block">
                                    RIR
                                  </label>
                                  <Input
                                    id={`rir-${routine.id}`}
                                    type="number"
                                    min="0"
                                    max="4"
                                    defaultValue={1}
                                    className="text-center"
                                  />
                                </div>
                              </div>
                              
                              {/* Instructions Field */}
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                  הוראות ביצוע (איך לעשות את התרגיל)
                                </label>
                                <textarea
                                  id={`instructions-${routine.id}`}
                                  placeholder="לדוגמה: רוחב כתפיים, ברכיים נעולות..."
                                  className="w-full px-3 py-2 border rounded-md text-sm min-h-[80px] resize-y"
                                />
                              </div>
                              
                              {/* Image Upload Field */}
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                  <ImageIcon className="inline h-3 w-3 ml-1" />
                                  תמונה של התרגיל (URL או העלאה)
                                </label>
                                <div className="flex gap-2">
                                  <Input
                                    type="text"
                                    id={`image_url-${routine.id}`}
                                    placeholder="הזן URL של תמונה..."
                                    className="flex-1"
                                  />
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          // TODO: Upload to Supabase storage and get URL
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            const url = event.target?.result as string;
                                            const imageInput = document.getElementById(`image_url-${routine.id}`) as HTMLInputElement;
                                            if (imageInput) {
                                              imageInput.value = url;
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                    <Button type="button" variant="outline" size="sm" className="whitespace-nowrap">
                                      <Upload className="h-4 w-4 ml-1" />
                                      העלה
                                    </Button>
                                  </label>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  onClick={async () => {
                                    const exerciseInput = showHistoryExercises[routine.id]
                                      ? document.getElementById(`exercise-history-select-${routine.id}`) as HTMLSelectElement
                                      : document.getElementById(`exercise-select-${routine.id}`) as HTMLInputElement;
                                    const setsInput = document.getElementById(`sets-${routine.id}`) as HTMLInputElement;
                                    const repsInput = document.getElementById(`reps-${routine.id}`) as HTMLInputElement;
                                    const rirInput = document.getElementById(`rir-${routine.id}`) as HTMLInputElement;
                                    const instructionsInput = document.getElementById(`instructions-${routine.id}`) as HTMLTextAreaElement;
                                    const imageInput = document.getElementById(`image_url-${routine.id}`) as HTMLInputElement;
                                    
                                    const exerciseName = exerciseInput?.value?.trim();
                                    if (exerciseName) {
                                      await handleAddExercise(
                                        routine.id,
                                        exerciseName,
                                        parseInt(setsInput?.value || "3"),
                                        repsInput?.value || "8-12",
                                        parseInt(rirInput?.value || "1"),
                                        instructionsInput?.value || "",
                                        imageInput?.value || null
                                      );
                                    } else {
                                      alert("אנא הזן שם תרגיל");
                                    }
                                  }}
                                  className="flex-1"
                                >
                                  <Save className="h-4 w-4 ml-2" />
                                  שמור
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setAddingExercise(null);
                                    setShowHistoryExercises(prev => ({ ...prev, [routine.id]: false }));
                                  }}
                                  className="flex-1"
                                >
                                  <X className="h-4 w-4 ml-2" />
                                  ביטול
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
              
              {/* Add New Routine Button */}
              {routines.length > 0 && !showAddRoutineForm && (
                <Card className="border-dashed border-2">
                  <CardContent className="pt-6">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setShowAddRoutineForm(true);
                        // Set default letter to first available
                        const usedLetters = routines.map(r => r.letter);
                        const availableLetters = (['A', 'B', 'C', 'D', 'E'] as RoutineLetter[]).filter(l => !usedLetters.includes(l));
                        if (availableLetters.length > 0) {
                          setNewRoutineLetter(availableLetters[0]);
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      הוסף אימון חדש
                    </Button>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        )}

        {/* Workout Logs Tab - Shows all logs the trainee entered */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            {/* Body Weight Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  משקל גוף - מה שהמתאמן רשם
                </CardTitle>
                <CardDescription>
                  היסטוריית המשקלים שהמתאמן רשם בעצמו
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Weight */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">משקל נוכחי</p>
                      <p className="text-3xl font-bold">
                        {weeklyWeights.length > 0 ? weeklyWeights[0].weight : "—"} ק"ג
                      </p>
                    </div>
                    <Scale className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                {/* Weight History */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">היסטוריית משקלים</h3>
                  <div className="space-y-2">
                    {weeklyWeights.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">אין נתוני משקל עדיין</p>
                    ) : (
                      weeklyWeights.map((entry, idx) => (
                        <div
                          key={entry.date || idx}
                          className="flex items-center justify-between p-3 bg-white border rounded-lg"
                        >
                          <div>
                            <p className="font-semibold">{new Date(entry.date).toLocaleDateString("he-IL")}</p>
                          </div>
                          <p className="text-xl font-bold">{entry.weight} ק"ג</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Weight Progress Summary */}
                {weeklyWeights.length > 1 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      סיכום התקדמות משקל
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <p className="text-sm text-muted-foreground mb-1">משקל התחלתי</p>
                        <p className="text-2xl font-bold text-gray-700">
                          {weeklyWeights[weeklyWeights.length - 1].weight} ק"ג
                        </p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <p className="text-sm text-muted-foreground mb-1">משקל נוכחי</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {weeklyWeights[0].weight} ק"ג
                        </p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <p className="text-sm text-muted-foreground mb-1">שינוי כולל</p>
                        <p className={`text-2xl font-bold ${
                          weeklyWeights[0].weight - weeklyWeights[weeklyWeights.length - 1].weight > 0 
                            ? "text-green-600" 
                            : weeklyWeights[0].weight - weeklyWeights[weeklyWeights.length - 1].weight < 0
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}>
                          {weeklyWeights[0].weight - weeklyWeights[weeklyWeights.length - 1].weight > 0 ? "+" : ""}
                          {(weeklyWeights[0].weight - weeklyWeights[weeklyWeights.length - 1].weight).toFixed(1)} ק"ג
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Workout Logs Section */}
            <Card>
              <CardHeader>
                <CardTitle>לוגים והתקדמות - כל מה שהמתאמן רשם</CardTitle>
                <CardDescription>
                  צפה בכל האימונים והנתונים שהמתאמן רשם
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
              {/* Real workout logs from Supabase - only show logs with actual sets (real workouts) */}
              {workoutLogs.filter(workout => workout.set_logs && workout.set_logs.length > 0).length > 0 ? (
                workoutLogs
                  .filter(workout => workout.set_logs && workout.set_logs.length > 0)
                  .map((workout) => (
                    <Card key={workout.id} className="border-2">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {workout.routine ? `אימון ${workout.routine.letter}` : 'אימון'}
                          </CardTitle>
                          <span className="text-sm text-muted-foreground">
                            {new Date(workout.date).toLocaleDateString("he-IL", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {(workout.set_logs || []).map((setLog, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                            >
                              <div className="flex-1">
                                <p className="font-semibold">{setLog.exercise?.name || 'תרגיל לא ידוע'}</p>
                              </div>
                              <div className="flex gap-6 text-sm">
                                <div>
                                  <span className="text-muted-foreground">משקל: </span>
                                  <span className="font-bold">
                                    {setLog.weight_kg > 0 ? `${setLog.weight_kg} ק"ג` : "משקל גוף"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">חזרות: </span>
                                  <span className="font-bold">{setLog.reps}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
              ) : (
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="pt-6 text-center">
                    <div className="text-4xl mb-4">📋</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">אין אימונים עדיין</h3>
                    <p className="text-gray-600">
                      המתאמן עדיין לא רשם אימונים. כשתהיה פעילות, היא תופיע כאן.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Progress Summary */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    סיכום התקדמות
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">אימונים השבוע</p>
                      <p className="text-2xl font-bold text-blue-600">3</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">סקוואט - שיפור</p>
                      <p className="text-2xl font-bold text-green-600">+2.5 ק"ג</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">דד ליפט - שיפור</p>
                      <p className="text-2xl font-bold text-green-600">+5 ק"ג</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Nutrition Menu Tab */}
        {activeTab === "nutrition" && (
          <Card>
            <CardHeader>
              <CardTitle>תפריט תזונה</CardTitle>
              <CardDescription>
                הגדר את התפריט התזונתי היומי של המתאמן
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {nutritionMenu?.meals?.map((meal) => (
                <Card key={meal.id} className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">{meal.mealName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {meal.foods.map((food) => (
                        <div
                          key={food.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex-1">
                            <p className="font-semibold">{food.foodName}</p>
                            <p className="text-sm text-muted-foreground">{food.amount} גרם</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // TODO: Delete food from meal
                              setNutritionMenu(prev => {
                                if (!prev) return prev;
                                return {
                                  ...prev,
                                  meals: prev.meals.map(m =>
                                    m.id === meal.id
                                      ? {
                                          ...m,
                                          foods: m.foods.filter(f => f.id !== food.id),
                                        }
                                      : m
                                  ),
                                };
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4 ml-1" />
                            מחק
                          </Button>
                        </div>
                      ))}
                      
                      {/* Add Food to Meal */}
                      <Card className="border-dashed border-2 bg-blue-50">
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-2 gap-3">
                            <select
                              id={`food-select-${meal.id}`}
                              className="px-3 py-2 border rounded-md text-sm"
                            >
                              <option value="">בחר מזון...</option>
                              {foodLibrary.map((food) => (
                                <option key={food.id} value={food.name}>
                                  {food.name}
                                </option>
                              ))}
                            </select>
                            <Input
                              id={`amount-${meal.id}`}
                              type="number"
                              placeholder="כמות (גרם)"
                              className="text-sm"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-3"
                            onClick={() => {
                              const select = document.getElementById(`food-select-${meal.id}`) as HTMLSelectElement;
                              const amountInput = document.getElementById(`amount-${meal.id}`) as HTMLInputElement;
                              
                              if (select?.value && amountInput?.value) {
                                setNutritionMenu(prev => {
                                  if (!prev) return prev;
                                  return {
                                    ...prev,
                                    meals: prev.meals.map(m =>
                                      m.id === meal.id
                                        ? {
                                            ...m,
                                            foods: [
                                              ...m.foods,
                                              {
                                                id: `food-${Date.now()}`,
                                                foodName: select.value,
                                                amount: amountInput.value,
                                              },
                                            ],
                                          }
                                        : m
                                    ),
                                  };
                                });
                                select.value = "";
                                amountInput.value = "";
                              }
                            }}
                          >
                            <Plus className="h-4 w-4 ml-1" />
                            הוסף מזון
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Add New Meal */}
              <Card className="border-dashed border-2">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Input
                      id="new-meal-name"
                      placeholder="שם ארוחה (לדוגמה: נשנוש בוקר)"
                      className="text-center"
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const mealNameInput = document.getElementById("new-meal-name") as HTMLInputElement;
                        if (mealNameInput?.value) {
                          setNutritionMenu(prev => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              meals: [
                                ...prev.meals,
                                {
                                  id: `meal-${Date.now()}`,
                                  mealName: mealNameInput.value,
                                  foods: [],
                                },
                              ],
                            };
                          });
                          mealNameInput.value = "";
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      הוסף ארוחה חדשה
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function TraineeManagementPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <TraineeManagementPageContent />
    </ProtectedRoute>
  );
}

