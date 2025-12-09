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
  
  const [showRightSidebar, setShowRightSidebar] = useState(false);

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

      const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
      setRoutines(updatedRoutines);
      setShowRightSidebar(false);
      setSelectedRoutineForExercise(null);
    } catch (error: any) {
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
      let exercise = await getExerciseByName(exerciseData.name.trim());
      
      if (!exercise) {
        exercise = await createExercise({
          name: exerciseData.name.trim(),
          muscle_group: exerciseData.muscle_group,
          image_url: exerciseData.image_url.trim() || null,
          video_url: null,
          description: null,
          created_by: user?.id || null,
        });

        setExerciseLibrary(prev => [...prev, exercise!]);
      }

      await handleAddExercise(routineId, exercise);
    } catch (error: any) {
      alert("שגיאה ביצירת תרגיל: " + error.message);
      throw error;
    }
  };

  const handleUpdateExercise = async (exerciseId: string, updates: any) => {
    const previousRoutines = [...routines];
    setRoutines(prev => prev.map(routine => ({
      ...routine,
      routine_exercises: routine.routine_exercises.map(re =>
        re.id === exerciseId ? { ...re, ...updates } : re
      )
    })));

    try {
      await updateRoutineExercise(exerciseId, updates);
      if (workoutPlan) {
        const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
        setRoutines(updatedRoutines);
      }
    } catch (error: any) {
      setRoutines(previousRoutines);
      alert("שגיאה בעדכון תרגיל: " + error.message);
      throw error;
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    const previousRoutines = [...routines];
    setRoutines(prev => prev.map(routine => ({
      ...routine,
      routine_exercises: routine.routine_exercises.filter(re => re.id !== exerciseId)
    })));

    try {
      await deleteRoutineExercise(exerciseId);
      if (workoutPlan) {
        const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
        setRoutines(updatedRoutines);
      }
    } catch (error: any) {
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
      alert("✅ התוכנית נשמרה בהצלחה!");
    } catch (error: any) {
      alert("❌ שגיאה בשמירת התוכנית: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateExerciseImage = async (exerciseId: string, imageUrl: string) => {
    const routineExercise = routines
      .flatMap(r => r.routine_exercises)
      .find(re => re.id === exerciseId);
    
    if (!routineExercise?.exercise?.id) {
      alert("תרגיל לא נמצא");
      return;
    }

    const previousRoutines = [...routines];
    setRoutines(prev => prev.map(routine => ({
      ...routine,
      routine_exercises: routine.routine_exercises.map(re =>
        re.id === exerciseId && re.exercise
          ? { ...re, exercise: { ...re.exercise, image_url: imageUrl.trim() || null } }
          : re
      )
    })));

    setExerciseLibrary(prev => prev.map(ex =>
      ex.id === routineExercise.exercise!.id
        ? { ...ex, image_url: imageUrl.trim() || null }
        : ex
    ));

    try {
      await updateExercise(routineExercise.exercise.id, {
        image_url: imageUrl.trim() || null,
      });
      
      if (workoutPlan) {
        const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
        setRoutines(updatedRoutines);
        const exercises = await getExerciseLibrary();
        setExerciseLibrary(exercises);
      }
    } catch (error: any) {
      setRoutines(previousRoutines);
      alert("שגיאה בעדכון תמונה: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1D2E] flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#5B7FFF]" />
          <p className="text-[#9CA3AF] font-outfit font-semibold">טוען עורך תוכניות...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .slide-up {
          animation: slideUp 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        
        .bg-texture {
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(91, 127, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(91, 127, 255, 0.02) 0%, transparent 50%);
        }
      `}</style>

      <div className="flex flex-col lg:flex-row h-full bg-[#1A1D2E] bg-texture" dir="rtl">
        {/* Center Editor */}
        <main className="flex-1 overflow-y-auto pb-32">
          {/* Top Bar */}
          <div 
            className="sticky top-0 z-10 bg-[#2D3142] border-b-2 border-[#3D4058] px-4 py-4 flex items-center justify-between slide-up"
            style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)' }}
          >
            <div className="flex items-center gap-3">
              <Link href={`/trainer/trainee/${traineeId}`}>
                <button className="w-10 h-10 rounded-xl bg-[#1A1D2E] hover:bg-[#3D4058] border-2 border-[#3D4058] flex items-center justify-center transition-all hover:scale-105">
                  <ArrowLeft className="h-5 w-5 text-white" />
                </button>
              </Link>
              <div>
                <h1 className="text-xl font-outfit font-bold text-white">עורך תוכניות אימון</h1>
                {trainee && (
                  <p className="text-sm font-outfit text-[#9CA3AF]">{trainee.name}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleSavePlan}
              disabled={saving}
              className="bg-gradient-to-br from-[#5B7FFF] to-[#4A5FCC] hover:from-[#6B8EFF] hover:to-[#5A6FDD] text-white px-5 py-2.5 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              style={{ boxShadow: '0 8px 32px rgba(91, 127, 255, 0.4)' }}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  שמור תוכנית
                </>
              )}
            </button>
          </div>

          {/* Plan Structure */}
          <div className="p-4 sm:p-6 space-y-6">
            <div 
              className="slide-up"
              style={{ animationDelay: '100ms' }}
            >
              <label className="text-sm font-outfit font-semibold text-[#9CA3AF] mb-2 block">
                שם התוכנית:
              </label>
              <Input
                value={workoutPlan?.name || ""}
                onChange={(e) => setWorkoutPlan({ ...workoutPlan, name: e.target.value })}
                className="bg-[#2D3142] border-2 border-[#3D4058] text-white placeholder:text-[#9CA3AF] max-w-md rounded-xl font-outfit focus:border-[#5B7FFF] transition-all"
                placeholder="שם התוכנית"
              />
            </div>

            <div className="space-y-4">
              {routines.map((routine, index) => (
                <div
                  key={routine.id}
                  className="slide-up"
                  style={{ animationDelay: `${(index + 2) * 50}ms` }}
                >
                  <WorkoutRoutineCard
                    routine={routine}
                    isExpanded={!!expandedRoutines[routine.id]}
                    onToggle={() => toggleRoutine(routine.id)}
                    onAddExercise={() => {
                      setSelectedRoutineForExercise(routine.id);
                      setShowRightSidebar(true);
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
                </div>
              ))}
              
              <button
                onClick={handleAddRoutine}
                className="w-full bg-[#2D3142] border-2 border-[#3D4058] border-dashed text-white hover:bg-[#3D4058] hover:border-[#5B7FFF] rounded-xl py-4 font-outfit font-semibold text-sm transition-all flex items-center justify-center gap-2 slide-up hover:scale-[1.02]"
                style={{ 
                  animationDelay: `${(routines.length + 2) * 50}ms`,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                <Plus className="h-5 w-5" />
                הוסף רוטינה חדשה
              </button>
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
    </>
  );
}

export default function WorkoutPlanEditorPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <WorkoutPlanEditorContent />
    </ProtectedRoute>
  );
}