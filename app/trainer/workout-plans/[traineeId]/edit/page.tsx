"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Plus, Loader2 } from "lucide-react";
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
import { WorkoutRoutineCard } from "@/components/trainer/workout-editor/WorkoutRoutineCard";
import { ExerciseLibrarySidebar } from "@/components/trainer/workout-editor/ExerciseLibrarySidebar";

function WorkoutPlanEditorContent() {
  const params = useParams();
  const traineeId = params.traineeId as string;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trainee, setTrainee] = useState<User | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [expandedRoutines, setExpandedRoutines] = useState<Record<string, boolean>>({});
  const [selectedRoutineForExercise, setSelectedRoutineForExercise] = useState<string | null>(null);
  
  // Mobile responsive states
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  // Load data
  useEffect(() => {
    if (traineeId && user?.id) {
      loadData();
    }
  }, [traineeId, user?.id]);

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
    } catch (error: any) {
      console.error("Error loading data:", error);
      alert("שגיאה בטעינת הנתונים: " + error.message);
    } finally {
      setLoading(false);
    }
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

      // Refresh to get full data
      const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
      setRoutines(updatedRoutines);
      setExpandedRoutines(prev => ({ ...prev, [newRoutine.id]: true }));
    } catch (error: any) {
      alert("שגיאה ביצירת רוטינה: " + error.message);
    }
  };

  const handleAddExercise = async (routineId: string, exercise: Exercise) => {
    if (!workoutPlan) return;

    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    // Optimistic UI: Update state immediately
    const tempExerciseId = `temp-${Date.now()}`;
    const newRoutineExercise = {
      id: tempExerciseId,
      routine_id: routineId,
      exercise_id: exercise.id,
      order_index: routine.routine_exercises.length,
      target_sets: 3,
      target_reps_min: 8,
      target_reps_max: 12,
      rir_target: 2,
      rest_time_seconds: 90,
      notes: null,
      special_instructions: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      exercise: exercise,
    };

    setRoutines(prev => prev.map(r => 
      r.id === routineId 
        ? { ...r, routine_exercises: [...r.routine_exercises, newRoutineExercise as any] }
        : r
    ));

    try {
      const created = await createRoutineExercise({
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

      // Replace temp with real data
      const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
      setRoutines(updatedRoutines);
      setShowRightSidebar(false);
      setSelectedRoutineForExercise(null);
    } catch (error: any) {
      // Rollback on error
      setRoutines(prev => prev.map(r => 
        r.id === routineId 
          ? { ...r, routine_exercises: r.routine_exercises.filter(re => re.id !== tempExerciseId) }
          : r
      ));
      alert("שגיאה בהוספת תרגיל: " + error.message);
    }
  };

  const handleCreateAndAddExercise = async (
    routineId: string,
    exerciseData: { name: string; muscle_group: string; image_url: string }
  ) => {
    if (!workoutPlan) {
      alert("שגיאה: תוכנית אימון לא נמצאה");
      return;
    }

    try {
      // Check if exercise already exists
      let exercise = await getExerciseByName(exerciseData.name.trim());
      
      if (!exercise) {
        // Create new exercise
        exercise = await createExercise({
          name: exerciseData.name.trim(),
          muscle_group: exerciseData.muscle_group,
          image_url: exerciseData.image_url.trim() || null,
          video_url: null,
          description: null,
          created_by: user?.id || null,
        });

        // Update exercise library optimistically
        setExerciseLibrary(prev => [...prev, exercise!]);
      }

      // Add exercise to routine (this will handle optimistic UI)
      await handleAddExercise(routineId, exercise);
    } catch (error: any) {
      alert("שגיאה ביצירת תרגיל: " + error.message);
      throw error;
    }
  };

  const handleUpdateExercise = async (exerciseId: string, updates: any) => {
    // Optimistic UI: Update state immediately
    const previousRoutines = [...routines];
    setRoutines(prev => prev.map(routine => ({
      ...routine,
      routine_exercises: routine.routine_exercises.map(re =>
        re.id === exerciseId ? { ...re, ...updates } : re
      )
    })));

    try {
      await updateRoutineExercise(exerciseId, updates);
      // Optionally refresh to get server state, but UI already updated
      if (workoutPlan) {
        const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
        setRoutines(updatedRoutines);
      }
    } catch (error: any) {
      // Rollback on error
      setRoutines(previousRoutines);
      alert("שגיאה בעדכון תרגיל: " + error.message);
      throw error;
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    // Optimistic UI: Remove from state immediately
    const previousRoutines = [...routines];
    setRoutines(prev => prev.map(routine => ({
      ...routine,
      routine_exercises: routine.routine_exercises.filter(re => re.id !== exerciseId)
    })));

    try {
      await deleteRoutineExercise(exerciseId);
      // Optionally refresh to get server state, but UI already updated
      if (workoutPlan) {
        const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
        setRoutines(updatedRoutines);
      }
    } catch (error: any) {
      // Rollback on error
      setRoutines(previousRoutines);
      alert("שגיאה במחיקת תרגיל: " + error.message);
      throw error;
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

  const handleUpdateExerciseImage = async (exerciseId: string, imageUrl: string) => {
    // Find the exercise from routine_exercises
    const routineExercise = routines
      .flatMap(r => r.routine_exercises)
      .find(re => re.id === exerciseId);
    
    if (!routineExercise?.exercise?.id) {
      alert("תרגיל לא נמצא");
      return;
    }

    // Optimistic UI: Update image immediately
    const previousRoutines = [...routines];
    setRoutines(prev => prev.map(routine => ({
      ...routine,
      routine_exercises: routine.routine_exercises.map(re =>
        re.id === exerciseId && re.exercise
          ? { ...re, exercise: { ...re.exercise, image_url: imageUrl.trim() || null } }
          : re
      )
    })));

    // Update exercise library too
    setExerciseLibrary(prev => prev.map(ex =>
      ex.id === routineExercise.exercise!.id
        ? { ...ex, image_url: imageUrl.trim() || null }
        : ex
    ));

    try {
      await updateExercise(routineExercise.exercise.id, {
        image_url: imageUrl.trim() || null,
      });
      
      // Refresh to ensure consistency
      if (workoutPlan) {
        const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
        setRoutines(updatedRoutines);
        const exercises = await getExerciseLibrary();
        setExerciseLibrary(exercises);
      }
    } catch (error: any) {
      // Rollback on error
      setRoutines(previousRoutines);
      alert("שגיאה בעדכון תמונה: " + error.message);
    }
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
                <WorkoutRoutineCard
                  key={routine.id}
                  routine={routine}
                  isExpanded={!!expandedRoutines[routine.id]}
                  onToggle={() => toggleRoutine(routine.id)}
                  onAddExercise={() => {
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
                  onUpdateExercise={handleUpdateExercise}
                  onDeleteExercise={handleDeleteExercise}
                  onUpdateExerciseImage={handleUpdateExerciseImage}
                />
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
      <ExerciseLibrarySidebar
        exercises={exerciseLibrary}
        routines={routines}
        selectedRoutineId={selectedRoutineForExercise}
        onSelectExercise={async (routineId, exercise) => {
          await handleAddExercise(routineId, exercise);
          setShowRightSidebar(false);
          setSelectedRoutineForExercise(null);
        }}
        onCreateAndAdd={handleCreateAndAddExercise}
        onClose={() => setShowRightSidebar(false)}
        onClearSelection={() => setSelectedRoutineForExercise(null)}
        isOpen={showRightSidebar}
      />
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

