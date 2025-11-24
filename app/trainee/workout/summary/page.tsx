"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Trophy, Share2, Home, BarChart3, Users, Target, Settings, Apple, Dumbbell } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  getActiveWorkoutPlan,
  getRoutinesWithExercises,
  createWorkoutLog,
  createSetLog,
  getWorkoutLogs,
} from "@/lib/db";
import type { RoutineWithExercises, Exercise } from "@/lib/types";

interface SetData {
  setNumber: number;
  weight: string;
  reps: string;
  rir: string;
}

interface ExerciseData extends Exercise {
  sets: SetData[];
  muscleGroup: string;
}

function WorkoutSummaryContent() {
  const router = useRouter();
  const { user } = useAuth();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workoutData, setWorkoutData] = useState<{
    exercises: ExerciseData[];
    routine: RoutineWithExercises | null;
    startTime: string;
  } | null>(null);
  const [summary, setSummary] = useState({
    duration: "00:00:00",
    totalWeight: 0,
    volume: "נמוך",
    volumePercent: 0,
    loadDistribution: [] as Array<{ muscleGroup: string; percentage: number; weight: number }>,
    completedExercises: [] as Array<{ name: string; sets: number }>,
    personalRecords: [] as Array<{ exercise: string; weight: number }>,
  });

  useEffect(() => {
    if (user?.id) {
      loadWorkoutData();
    }
  }, [user?.id]);

  const loadWorkoutData = async () => {
    try {
      setLoading(true);

      // Get workout data from sessionStorage (passed from workout page)
      const storedData = sessionStorage.getItem('workoutSummaryData');
      if (!storedData) {
        router.push('/trainee/workout');
        return;
      }

      const data = JSON.parse(storedData);
      setWorkoutData(data);

      // Calculate summary statistics
      calculateSummary(data);

    } catch (error) {
      console.error('Error loading workout data:', error);
      router.push('/trainee/workout');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data: any) => {
    const { exercises, startTime } = data;
    
    // Calculate duration
    const start = new Date(startTime);
    const end = new Date();
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    const duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Calculate total weight lifted
    let totalWeight = 0;
    const exerciseStats: Record<string, { weight: number; sets: number }> = {};
    const muscleGroupStats: Record<string, number> = {};

    exercises.forEach((exercise: ExerciseData) => {
      let exerciseWeight = 0;
      exercise.sets.forEach((set) => {
        const weight = parseFloat(set.weight) || 0;
        const reps = parseInt(set.reps) || 0;
        exerciseWeight += weight * reps;
      });
      
      totalWeight += exerciseWeight;
      
      if (exerciseWeight > 0) {
        exerciseStats[exercise.name] = {
          weight: exerciseWeight,
          sets: exercise.sets.filter(s => s.weight && s.reps).length,
        };
        
        // Group by muscle group
        const muscleGroup = exercise.muscleGroup || 'אחר';
        muscleGroupStats[muscleGroup] = (muscleGroupStats[muscleGroup] || 0) + exerciseWeight;
      }
    });

    // Calculate volume level
    let volume = "נמוך";
    let volumePercent = 33;
    if (totalWeight > 5000) {
      volume = "גבוה";
      volumePercent = 100;
    } else if (totalWeight > 3000) {
      volume = "בינוני";
      volumePercent = 66;
    }

    // Calculate load distribution
    const totalMuscleWeight = Object.values(muscleGroupStats).reduce((a, b) => a + b, 0);
    const loadDistribution = Object.entries(muscleGroupStats)
      .map(([muscleGroup, weight]) => ({
        muscleGroup,
        percentage: totalMuscleWeight > 0 ? Math.round((weight / totalMuscleWeight) * 100) : 0,
        weight,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // Get completed exercises
    const completedExercises = Object.entries(exerciseStats).map(([name, stats]) => ({
      name,
      sets: stats.sets,
    }));

    // Check for personal records (compare with previous workouts)
    const personalRecords: Array<{ exercise: string; weight: number }> = [];
    exercises.forEach((exercise: ExerciseData) => {
      const maxWeight = Math.max(...exercise.sets.map(s => parseFloat(s.weight) || 0));
      if (maxWeight > 0 && exercise.previousPerformance?.[0]) {
        const previousMax = exercise.previousPerformance[0].weight;
        if (maxWeight > previousMax) {
          personalRecords.push({
            exercise: exercise.name,
            weight: maxWeight,
          });
        }
      }
    });

    setSummary({
      duration,
      totalWeight,
      volume,
      volumePercent,
      loadDistribution,
      completedExercises,
      personalRecords,
    });
  };

  const handleSaveWorkout = async () => {
    if (!workoutData || !user?.id) return;

    try {
      setSaving(true);

      const { exercises, routine, startTime } = workoutData;

      // Prepare sets to save
      const setsToSave: Array<{
        exerciseId: string;
        setNumber: number;
        weight: number;
        reps: number;
        rir: number;
      }> = [];

      exercises.forEach((exercise) => {
        exercise.sets.forEach((set) => {
          if (set.weight && set.reps) {
            const weight = parseFloat(set.weight);
            const reps = parseInt(set.reps);
            const rir = parseFloat(set.rir) || 0;
            
            if (!isNaN(weight) && !isNaN(reps) && weight > 0 && reps > 0) {
              setsToSave.push({
                exerciseId: exercise.exerciseId,
                setNumber: set.setNumber,
                weight,
                reps,
                rir,
              });
            }
          }
        });
      });

      if (setsToSave.length === 0) {
        alert('לא ניתן לשמור אימון ריק.');
        setSaving(false);
        return;
      }

      // Create workout log
      const now = new Date().toISOString();
      const workoutLog = await createWorkoutLog({
        user_id: user.id,
        routine_id: routine!.id,
        date: new Date().toISOString().split('T')[0],
        notes: '',
        body_weight: null,
        start_time: startTime,
        end_time: now,
        completed: true,
      });

      // Create set logs
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

      // Clear session storage
      sessionStorage.removeItem('workoutSummaryData');

      // Redirect to dashboard
      router.push('/trainee/dashboard');

    } catch (error: any) {
      console.error('Error saving workout:', error);
      alert('שגיאה בשמירת האימון: ' + (error.message || 'שגיאה לא ידועה'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-gray-400">טוען סיכום...</p>
        </div>
      </div>
    );
  }

  if (!workoutData) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-gray-400">אין נתוני אימון</p>
          <Link href="/trainee/workout">
            <Button className="mt-4 bg-[#00ff88] text-black">חזור לאימון</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Pie chart colors
  const colors = ['#00ff88', '#f97316', '#ef4444', '#3b82f6', '#a855f7'];
  let colorIndex = 0;

  return (
    <div className="min-h-screen bg-[#0a1628] pb-20" dir="rtl">
      {/* Header */}
      <div className="bg-[#1a2332] text-white p-4 sticky top-0 z-10 border-b border-gray-800">
        <div className="max-w-2xl mx-auto flex items-center">
          <Link href="/trainee/workout">
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div className="text-center flex-1">
            <h1 className="text-xl font-bold">סיכום אימון</h1>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Workout Summary Card */}
        <Card className="bg-[#1a2332] border-gray-800">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-400">משך כולל:</p>
              <p className="text-white font-semibold text-lg">{summary.duration}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-400">משקל כולל שהורם:</p>
              <p className="text-white font-semibold text-lg">{summary.totalWeight.toLocaleString()} ק"ג</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-400">נפח אימון:</p>
              <div className="flex items-center gap-3">
                <p className="text-white font-semibold">{summary.volume}</p>
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="#1a2332"
                      strokeWidth="6"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="#00ff88"
                      strokeWidth="6"
                      strokeDasharray={`${(summary.volumePercent / 100) * 176} 176`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{summary.volumePercent}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Load Distribution Card */}
        {summary.loadDistribution.length > 0 && (
          <Card className="bg-[#1a2332] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">פילוג עומס</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                {/* Pie Chart */}
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    {summary.loadDistribution.reduce((acc, item, index) => {
                      const percentage = item.percentage;
                      const offset = acc.offset;
                      const color = colors[index % colors.length];
                      const circumference = 2 * Math.PI * 56;
                      const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                      
                      acc.elements.push(
                        <circle
                          key={item.muscleGroup}
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke={color}
                          strokeWidth="12"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={-offset}
                        />
                      );
                      
                      acc.offset += (percentage / 100) * circumference;
                      return acc;
                    }, { elements: [] as JSX.Element[], offset: 0 }).elements}
                  </svg>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2">
                  {summary.loadDistribution.map((item, index) => (
                    <div key={item.muscleGroup} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      ></div>
                      <span className="text-gray-300 text-sm">
                        {item.muscleGroup} {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Exercises Card */}
        <Card className="bg-[#1a2332] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">תרגילים שהושלמו</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.completedExercises.map((exercise, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#00ff88] flex-shrink-0" />
                <span className="text-gray-300">
                  {exercise.name} ({exercise.sets} סטים)
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Personal Records Card */}
        {summary.personalRecords.length > 0 && (
          <Card className="bg-[#1a2332] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">שיאים אישיים חדשים!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {summary.personalRecords.map((record, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  <span className="text-gray-300">
                    {record.exercise}: {record.weight} ק"ג!
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            className="w-full bg-[#00ff88] hover:bg-[#00e677] text-black font-bold h-14 text-lg"
            onClick={handleSaveWorkout}
            disabled={saving}
          >
            {saving ? "שומר..." : "סיום ורישום ביומן"}
          </Button>
          
          <div className="text-center">
            <button className="text-[#00ff88] hover:text-[#00e677] text-sm">
              שיתוף אימון
            </button>
          </div>
        </div>
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
    </div>
  );
}

export default function WorkoutSummary() {
  return (
    <ProtectedRoute requiredRole="trainee">
      <WorkoutSummaryContent />
    </ProtectedRoute>
  );
}

