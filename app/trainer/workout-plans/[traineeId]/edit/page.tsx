"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Save, Plus, X, ChevronDown, ChevronUp, GripVertical,
  Search, X as XIcon, Image as ImageIcon, Upload
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  getUser,
  getActiveWorkoutPlan,
  createWorkoutPlan,
  getRoutinesWithExercises,
  createRoutine,
  updateRoutine,
  getExerciseLibrary,
  createRoutineExercise,
  updateRoutineExercise,
  deleteRoutineExercise,
  updateWorkoutPlan,
  createExercise,
  getExerciseByName,
  updateExercise,
} from "@/lib/db";
import type { User, RoutineWithExercises, Exercise, RoutineLetter } from "@/lib/types";
import { Loader2 } from "lucide-react";

function WorkoutPlanEditorContent() {
  const params = useParams();
  const router = useRouter();
  const traineeId = params.traineeId as string;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trainee, setTrainee] = useState<User | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("הכל");
  const [expandedRoutines, setExpandedRoutines] = useState<Record<string, boolean>>({});
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, any>>({});
  const [selectedRoutineForExercise, setSelectedRoutineForExercise] = useState<string | null>(null);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseMuscleGroup, setNewExerciseMuscleGroup] = useState("כללי");
  const [newExerciseImageUrl, setNewExerciseImageUrl] = useState("");
  const [showNewExerciseForm, setShowNewExerciseForm] = useState(false);
  const [creatingExercise, setCreatingExercise] = useState(false);
  const [editingExerciseImage, setEditingExerciseImage] = useState<Record<string, string>>({});
  
  // Mobile responsive states
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  // Load data
  useEffect(() => {
    if (traineeId && user?.id) {
      loadData();
    }
  }, [traineeId, user?.id]);

  useEffect(() => {
    filterExercises();
  }, [searchQuery, selectedMuscleGroup, exerciseLibrary]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const traineeData = await getUser(traineeId);
      setTrainee(traineeData);

      let plan = await getActiveWorkoutPlan(traineeId);
      
      if (!plan) {
        // Create a new plan if none exists
        plan = await createWorkoutPlan({
          trainee_id: traineeId,
          trainer_id: user!.id,
          name: `תוכנית אימונים - ${traineeData?.name || 'מתאמן'}`,
          is_active: true,
          start_date: new Date().toISOString().split('T')[0],
          end_date: null,
          weekly_target_workouts: 5,
        });
      }

      setWorkoutPlan(plan);

      const routinesData = await getRoutinesWithExercises(plan.id);
      setRoutines(routinesData);
      
      // Expand first routine by default
      if (routinesData.length > 0) {
        setExpandedRoutines({ [routinesData[0].id]: true });
      }

      const exercises = await getExerciseLibrary();
      setExerciseLibrary(exercises);
      setFilteredExercises(exercises);
    } catch (error: any) {
      console.error("Error loading data:", error);
      alert("שגיאה בטעינת הנתונים: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = () => {
    let filtered = exerciseLibrary;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by muscle group
    if (selectedMuscleGroup !== "הכל") {
      filtered = filtered.filter(ex => ex.muscle_group === selectedMuscleGroup);
    }

    setFilteredExercises(filtered);
  };

  const getMuscleGroups = () => {
    const groups = new Set(exerciseLibrary.map(ex => ex.muscle_group));
    return ["הכל", ...Array.from(groups).sort()];
  };

  const toggleRoutine = (routineId: string) => {
    setExpandedRoutines(prev => ({
      ...prev,
      [routineId]: !prev[routineId]
    }));
  };

  const handleAddRoutine = async () => {
    if (!workoutPlan) return;

    const existingLetters = routines.map(r => r.letter);
    const availableLetters: RoutineLetter[] = ['A', 'B', 'C', 'D', 'E'];
    const nextLetter = availableLetters.find(l => !existingLetters.includes(l));

    if (!nextLetter) {
      alert("כל הרוטינות (A-E) כבר קיימות");
      return;
    }

    try {
      const newRoutine = await createRoutine({
        plan_id: workoutPlan.id,
        letter: nextLetter,
        name: `רוטינה ${nextLetter}`,
        description: null,
        order_index: routines.length,
      });

      const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
      setRoutines(updatedRoutines);
      setExpandedRoutines(prev => ({ ...prev, [newRoutine.id]: true }));
    } catch (error: any) {
      alert("שגיאה ביצירת רוטינה: " + error.message);
    }
  };

  const handleAddExercise = async (routineId: string, exercise: Exercise) => {
    if (!workoutPlan) return;

    try {
      const routine = routines.find(r => r.id === routineId);
      if (!routine) return;

      await createRoutineExercise({
        routine_id: routineId,
        exercise_id: exercise.id,
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 12,
        rir_target: 2,
        rest_time_seconds: 90,
        notes: null,
        special_instructions: null,
        order_index: routine.routine_exercises.length,
      });

      const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
      setRoutines(updatedRoutines);
      setShowRightSidebar(false);
      setSelectedRoutineForExercise(null);
    } catch (error: any) {
      alert("שגיאה בהוספת תרגיל: " + error.message);
    }
  };

  const handleCreateAndAddExercise = async (routineId: string) => {
    if (!workoutPlan || !newExerciseName.trim()) {
      alert("אנא הזן שם תרגיל");
      return;
    }

    try {
      setCreatingExercise(true);

      // Check if exercise already exists
      let exercise = await getExerciseByName(newExerciseName.trim());
      
      if (!exercise) {
        // Create new exercise
        exercise = await createExercise({
          name: newExerciseName.trim(),
          muscle_group: newExerciseMuscleGroup,
          image_url: newExerciseImageUrl.trim() || null,
          video_url: null,
          description: null,
          created_by: user?.id || null,
        });

        // Reload exercise library
        const updatedExercises = await getExerciseLibrary();
        setExerciseLibrary(updatedExercises);
        setFilteredExercises(updatedExercises);
      }

      // Add exercise to routine
      await handleAddExercise(routineId, exercise);

      // Reset form
      setNewExerciseName("");
      setNewExerciseMuscleGroup("כללי");
      setNewExerciseImageUrl("");
      setShowNewExerciseForm(false);
    } catch (error: any) {
      alert("שגיאה ביצירת תרגיל: " + error.message);
    } finally {
      setCreatingExercise(false);
    }
  };

  const handleUpdateExercise = async (exerciseId: string, updates: any) => {
    try {
      await updateRoutineExercise(exerciseId, updates);
      if (workoutPlan) {
        const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
        setRoutines(updatedRoutines);
      }
      setEditingExercise(null);
      setEditingValues({});
    } catch (error: any) {
      alert("שגיאה בעדכון תרגיל: " + error.message);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק תרגיל זה?")) return;

    try {
      await deleteRoutineExercise(exerciseId);
      if (workoutPlan) {
        const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
        setRoutines(updatedRoutines);
      }
    } catch (error: any) {
      alert("שגיאה במחיקת תרגיל: " + error.message);
    }
  };

  const handleSavePlan = async () => {
    if (!workoutPlan) return;

    try {
      setSaving(true);
      await updateWorkoutPlan(workoutPlan.id, {
        name: workoutPlan.name,
      });
      alert("התוכנית נשמרה בהצלחה!");
    } catch (error: any) {
      alert("שגיאה בשמירת התוכנית: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (exercise: any) => {
    setEditingExercise(exercise.id);
    setEditingValues({
      target_sets: exercise.target_sets,
      target_reps_min: exercise.target_reps_min,
      target_reps_max: exercise.target_reps_max,
      rir_target: exercise.rir_target,
      rest_time_seconds: exercise.rest_time_seconds,
      special_instructions: exercise.special_instructions || '',
    });
    // Set current image URL for editing
    if (exercise.exercise?.image_url) {
      setEditingExerciseImage({ [exercise.id]: exercise.exercise.image_url });
    }
  };

  const handleUpdateExerciseImage = async (exerciseId: string, imageUrl: string) => {
    try {
      // Find the exercise from routine_exercises
      const routineExercise = routines
        .flatMap(r => r.routine_exercises)
        .find(re => re.id === exerciseId);
      
      if (routineExercise?.exercise?.id) {
        await updateExercise(routineExercise.exercise.id, {
          image_url: imageUrl.trim() || null,
        });
        
        // Reload data
        if (workoutPlan) {
          const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
          setRoutines(updatedRoutines);
          const exercises = await getExerciseLibrary();
          setExerciseLibrary(exercises);
          setFilteredExercises(exercises);
        }
      }
    } catch (error: any) {
      alert("שגיאה בעדכון תמונה: " + error.message);
    }
  };

  const cancelEditing = () => {
    setEditingExercise(null);
    setEditingValues({});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-[#00ff88]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full" dir="rtl">
      {/* Center Editor */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar - Editor specific */}
        <div className="sticky top-0 z-10 bg-[#0a1628] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/trainer/trainee/${traineeId}`}>
              <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-white">עורך תוכניות אימון</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSavePlan}
              disabled={saving}
              className="bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  שמור תוכנית
                </>
              )}
            </Button>
          </div>
        </div>

          {/* Plan Structure */}
          <div className="p-4 lg:p-6 space-y-4">
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">שם התוכנית:</label>
              <Input
                value={workoutPlan?.name || ""}
                onChange={(e) => setWorkoutPlan({ ...workoutPlan, name: e.target.value })}
                className="bg-[#1a2332] border-gray-700 text-white max-w-md"
                placeholder="שם התוכנית"
              />
            </div>

            <div className="space-y-3">
              {routines.map((routine) => (
                <Card key={routine.id} className="bg-[#1a2332] border-gray-800">
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => toggleRoutine(routine.id)}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">
                        רוטינה {routine.letter}: {routine.name}
                      </CardTitle>
                      {expandedRoutines[routine.id] ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedRoutines[routine.id] && (
                    <CardContent className="space-y-4">
                      {routine.routine_exercises
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((re, index) => (
                          <div key={re.id} className="border-b border-gray-800 pb-4 last:border-0">
                            <div className="flex items-start gap-3">
                              <GripVertical className="h-5 w-5 text-gray-600 mt-1" />
                              <div className="flex-1">
                                <h4 className="text-white font-semibold mb-3">
                                  {index + 1}. {re.exercise?.name || 'תרגיל לא ידוע'}
                                </h4>
                                {editingExercise === re.id ? (
                                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div>
                                      <label className="text-xs text-gray-400 mb-1 block">סטים:</label>
                                      <Input
                                        type="number"
                                        value={editingValues.target_sets || 0}
                                        onChange={(e) => setEditingValues({
                                          ...editingValues,
                                          target_sets: parseInt(e.target.value) || 0
                                        })}
                                        className="bg-[#0f1a2a] border-gray-700 text-white text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-gray-400 mb-1 block">חזרות:</label>
                                      <div className="flex gap-1">
                                        <Input
                                          type="number"
                                          value={editingValues.target_reps_min || 0}
                                          onChange={(e) => setEditingValues({
                                            ...editingValues,
                                            target_reps_min: parseInt(e.target.value) || 0
                                          })}
                                          className="bg-[#0f1a2a] border-gray-700 text-white text-sm"
                                          placeholder="מינימום"
                                        />
                                        <span className="text-gray-400 self-center">-</span>
                                        <Input
                                          type="number"
                                          value={editingValues.target_reps_max || 0}
                                          onChange={(e) => setEditingValues({
                                            ...editingValues,
                                            target_reps_max: parseInt(e.target.value) || 0
                                          })}
                                          className="bg-[#0f1a2a] border-gray-700 text-white text-sm"
                                          placeholder="מקסימום"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-xs text-gray-400 mb-1 block">RIR:</label>
                                      <Input
                                        type="number"
                                        value={editingValues.rir_target || 0}
                                        onChange={(e) => setEditingValues({
                                          ...editingValues,
                                          rir_target: parseInt(e.target.value) || 0
                                        })}
                                        className="bg-[#0f1a2a] border-gray-700 text-white text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-gray-400 mb-1 block">מנוחה:</label>
                                      <Input
                                        type="number"
                                        value={editingValues.rest_time_seconds || 0}
                                        onChange={(e) => setEditingValues({
                                          ...editingValues,
                                          rest_time_seconds: parseInt(e.target.value) || 0
                                        })}
                                        className="bg-[#0f1a2a] border-gray-700 text-white text-sm"
                                      />
                                    </div>
                                    <div className="col-span-2 lg:col-span-4">
                                      <label className="text-xs text-gray-400 mb-1 block">הוראות ביצוע:</label>
                                      <Textarea
                                        value={editingValues.special_instructions || ''}
                                        onChange={(e) => setEditingValues({
                                          ...editingValues,
                                          special_instructions: e.target.value
                                        })}
                                        placeholder="הזן הוראות ביצוע מפורטות לתרגיל..."
                                        className="bg-[#0f1a2a] border-gray-700 text-white text-sm min-h-[100px]"
                                        rows={4}
                                      />
                                    </div>
                                    <div className="col-span-2 lg:col-span-4">
                                      <label className="text-xs text-gray-400 mb-1 block">
                                        <ImageIcon className="inline h-3 w-3 ml-1" />
                                        URL תמונה:
                                      </label>
                                      <div className="flex gap-2">
                                        <Input
                                          value={editingExerciseImage[re.id] || re.exercise?.image_url || ''}
                                          onChange={(e) => setEditingExerciseImage({
                                            ...editingExerciseImage,
                                            [re.id]: e.target.value
                                          })}
                                          placeholder="https://example.com/image.jpg"
                                          className="bg-[#0f1a2a] border-gray-700 text-white text-sm flex-1"
                                        />
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            const imageUrl = editingExerciseImage[re.id] || re.exercise?.image_url || '';
                                            if (imageUrl.trim()) {
                                              handleUpdateExerciseImage(re.id, imageUrl);
                                            }
                                          }}
                                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                        >
                                          <Save className="h-3 w-3 ml-1" />
                                          שמור תמונה
                                        </Button>
                                      </div>
                                      {(editingExerciseImage[re.id] || re.exercise?.image_url) && (
                                        <div className="mt-2">
                                          <img
                                            src={editingExerciseImage[re.id] || re.exercise?.image_url || ''}
                                            alt="תצוגה מקדימה"
                                            className="w-24 h-24 rounded object-cover border border-gray-700"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                    <div className="col-span-2 lg:col-span-4 flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleUpdateExercise(re.id, editingValues)}
                                        className="bg-[#00ff88] hover:bg-[#00e677] text-black"
                                      >
                                        שמור
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={cancelEditing}
                                        className="border-gray-700 text-gray-300"
                                      >
                                        ביטול
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDeleteExercise(re.id)}
                                        className="border-red-700 text-red-400 hover:bg-red-900/20"
                                      >
                                        <X className="h-4 w-4" />
                                        מחק
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-3">
                                      <div>
                                        <span className="text-gray-400">סטים:</span>
                                        <span className="text-white mr-2">{re.target_sets}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400">חזרות:</span>
                                        <span className="text-white mr-2">{re.target_reps_min}-{re.target_reps_max}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400">RIR:</span>
                                        <span className="text-white mr-2">{re.rir_target}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400">מנוחה:</span>
                                        <span className="text-white mr-2">{re.rest_time_seconds}ש</span>
                                      </div>
                                    </div>
                                    {re.exercise?.image_url && (
                                      <div className="mb-3">
                                        <img
                                          src={re.exercise.image_url}
                                          alt={re.exercise.name}
                                          className="w-32 h-32 rounded object-cover border border-gray-700"
                                        />
                                      </div>
                                    )}
                                    {re.special_instructions && (
                                      <div className="col-span-2 lg:col-span-4 mt-2 p-3 bg-[#0f1a2a] rounded-lg border border-gray-700 mb-3">
                                        <p className="text-xs text-gray-400 mb-1">הוראות ביצוע:</p>
                                        <p className="text-sm text-white whitespace-pre-line">{re.special_instructions}</p>
                                      </div>
                                    )}
                                    <div className="col-span-2 lg:col-span-4">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => startEditing(re)}
                                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                      >
                                        ערוך
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      <Button
                        onClick={() => {
                          setSelectedRoutineForExercise(routine.id);
                          setShowRightSidebar(true);
                          // Scroll to top of sidebar on mobile
                          if (window.innerWidth < 1024) {
                            setTimeout(() => {
                              const sidebar = document.querySelector('aside');
                              if (sidebar) {
                                sidebar.scrollTop = 0;
                              }
                            }, 100);
                          }
                        }}
                        className="w-full bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
                      >
                        <Plus className="h-4 w-4 ml-2" />
                        הוסף תרגיל
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))}
              
              <Button
                onClick={handleAddRoutine}
                className="w-full bg-[#1a2332] border border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Plus className="h-4 w-4 ml-2" />
                הוסף רוטינה
              </Button>
            </div>
          </div>
        </main>

      {/* Right Sidebar - Exercise Library */}
      <aside className={`
          ${showRightSidebar ? 'flex' : 'hidden'} lg:flex
          lg:w-80 flex-col bg-[#1a2332] border-l border-gray-800
          fixed lg:relative inset-y-0 left-0 z-30 lg:z-auto
        `}>
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">ספריית תרגילים</h2>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-gray-800"
              onClick={() => setShowRightSidebar(false)}
            >
              <XIcon className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="p-4 border-b border-gray-800 space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // If typing a new name, show option to create
                  if (e.target.value.trim() && !filteredExercises.some(ex => 
                    ex.name.toLowerCase() === e.target.value.toLowerCase().trim()
                  )) {
                    setNewExerciseName(e.target.value.trim());
                  }
                }}
                placeholder="חפש תרגיל או הקלד שם חדש..."
                className="bg-[#0f1a2a] border-gray-700 text-white pr-10"
              />
            </div>
            
            {/* Add New Exercise Button */}
            {!showNewExerciseForm && (
              <Button
                onClick={() => {
                  setShowNewExerciseForm(true);
                  setNewExerciseName(searchQuery.trim() || "");
                }}
                className="w-full bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
                size="sm"
              >
                <Plus className="h-4 w-4 ml-2" />
                הוסף תרגיל חדש
              </Button>
            )}

            {/* New Exercise Form */}
            {showNewExerciseForm && (
              <Card className="bg-[#0f1a2a] border-gray-700">
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">שם התרגיל:</label>
                    <Input
                      value={newExerciseName}
                      onChange={(e) => setNewExerciseName(e.target.value)}
                      placeholder="לדוגמה: סקוואט"
                      className="bg-[#1a2332] border-gray-700 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">קבוצת שרירים:</label>
                    <select
                      value={newExerciseMuscleGroup}
                      onChange={(e) => setNewExerciseMuscleGroup(e.target.value)}
                      className="w-full bg-[#1a2332] border border-gray-700 text-white text-sm rounded px-3 py-2"
                    >
                      <option value="כללי">כללי</option>
                      <option value="חזה">חזה</option>
                      <option value="גב">גב</option>
                      <option value="כתפיים">כתפיים</option>
                      <option value="ידיים">ידיים</option>
                      <option value="רגליים">רגליים</option>
                      <option value="בטן">בטן</option>
                      <option value="קרדיו">קרדיו</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                      <ImageIcon className="inline h-3 w-3 ml-1" />
                      URL תמונה (אופציונלי):
                    </label>
                    <Input
                      value={newExerciseImageUrl}
                      onChange={(e) => setNewExerciseImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="bg-[#1a2332] border-gray-700 text-white text-sm"
                    />
                    {newExerciseImageUrl && (
                      <div className="mt-2">
                        <img
                          src={newExerciseImageUrl}
                          alt="תצוגה מקדימה"
                          className="w-20 h-20 rounded object-cover border border-gray-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (selectedRoutineForExercise) {
                          handleCreateAndAddExercise(selectedRoutineForExercise);
                        } else if (routines.length > 0) {
                          handleCreateAndAddExercise(routines[0].id);
                        } else {
                          alert("אנא צור רוטינה קודם");
                        }
                      }}
                      disabled={creatingExercise || !newExerciseName.trim()}
                      className="flex-1 bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
                      size="sm"
                    >
                      {creatingExercise ? (
                        <>
                          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                          יוצר...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 ml-2" />
                          צור והוסף
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowNewExerciseForm(false);
                        setNewExerciseName("");
                        setNewExerciseMuscleGroup("כללי");
                        setNewExerciseImageUrl("");
                      }}
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="flex flex-wrap gap-2">
              {getMuscleGroups().map((group) => (
                <Button
                  key={group}
                  size="sm"
                  variant={selectedMuscleGroup === group ? "default" : "outline"}
                  onClick={() => setSelectedMuscleGroup(group)}
                  className={
                    selectedMuscleGroup === group
                      ? "bg-[#00ff88] text-black"
                      : "border-gray-700 text-gray-300 hover:bg-gray-800"
                  }
                >
                  {group}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {selectedRoutineForExercise && (
              <div className="mb-3 p-3 bg-[#00ff88]/20 border border-[#00ff88]/50 rounded-lg">
                <p className="text-xs text-[#00ff88] font-semibold mb-1">מוסיף לרוטינה:</p>
                <p className="text-sm text-white">
                  {routines.find(r => r.id === selectedRoutineForExercise)?.letter || ''} - {routines.find(r => r.id === selectedRoutineForExercise)?.name || ''}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedRoutineForExercise(null)}
                  className="mt-2 text-xs text-gray-400 hover:text-white h-6 px-2"
                >
                  <X className="h-3 w-3 ml-1" />
                  ביטול בחירה
                </Button>
              </div>
            )}
            {filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                className="flex items-center gap-3 p-3 bg-[#0f1a2a] rounded-lg hover:bg-[#1a2332] cursor-pointer border border-gray-800"
                onClick={() => {
                  if (selectedRoutineForExercise) {
                    handleAddExercise(selectedRoutineForExercise, exercise);
                    setShowRightSidebar(false);
                    setSelectedRoutineForExercise(null);
                  } else if (routines.length > 0) {
                    // Auto-select first routine if none selected
                    const firstRoutine = routines[0];
                    handleAddExercise(firstRoutine.id, exercise);
                    setShowRightSidebar(false);
                  } else {
                    alert("אנא צור רוטינה קודם");
                  }
                }}
              >
                <GripVertical className="h-5 w-5 text-gray-600" />
                <div className="flex-1">
                  <p className="text-white text-sm">{exercise.name}</p>
                  <p className="text-gray-500 text-xs">{exercise.muscle_group}</p>
                </div>
                {exercise.image_url ? (
                  <img
                    src={exercise.image_url}
                    alt={exercise.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-500 text-xs">תמונה</span>
                  </div>
                )}
              </div>
            ))}
            {filteredExercises.length === 0 && searchQuery.trim() && !showNewExerciseForm && (
              <div className="text-center py-8 space-y-3">
                <p className="text-gray-400">לא נמצאו תרגילים</p>
                <Button
                  onClick={() => {
                    setShowNewExerciseForm(true);
                    setNewExerciseName(searchQuery.trim());
                  }}
                  className="bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
                  size="sm"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  צור תרגיל חדש: "{searchQuery.trim()}"
                </Button>
              </div>
            )}
            {filteredExercises.length === 0 && !searchQuery.trim() && (
              <div className="text-center text-gray-500 py-8">
                לא נמצאו תרגילים
              </div>
            )}
          </div>
      </aside>
    </div>
  );
}

export default function WorkoutPlanEditorPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <WorkoutPlanEditorContent />
    </ProtectedRoute>
  );
}

