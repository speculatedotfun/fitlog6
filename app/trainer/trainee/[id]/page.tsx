"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Scale, Edit, Eye, TrendingUp, Loader2, Mail, Phone, Calendar, ChevronDown, ChevronUp, Dumbbell } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  getUser,
  getActiveWorkoutPlan,
  getWorkoutLogs,
  getBodyWeightHistory,
} from "@/lib/db";
import type { User, WorkoutLogWithDetails } from "@/lib/types";

function TraineeManagementPageContent() {
  const params = useParams();
  const traineeId = params.id as string;
  const { user } = useAuth();

  // State for real data from Supabase
  const [trainee, setTrainee] = useState<User | null>(null);
  const [weeklyWeights, setWeeklyWeights] = useState<Array<{ date: string; weight: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogWithDetails[]>([]);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());

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

      // Load workout logs
      const logs = await getWorkoutLogs(traineeId);
      setWorkoutLogs(logs);
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || "שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  };

  // Line Chart Component for Body Weight
  const LineChart = ({ 
    data, 
    height = 200 
  }: { 
    data: Array<{ date: string; weight: number }>;
    height?: number;
  }) => {
    if (data.length === 0) {
      return (
        <div className={`h-[${height}px] flex items-center justify-center text-gray-500`}>
          אין נתונים להצגה
        </div>
      );
    }

    const padding = 50;
    const chartWidth = 600;
    const chartHeight = height;
    const graphWidth = chartWidth - padding * 2;
    const graphHeight = chartHeight - padding * 2;

    const values = data.map(d => d.weight);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    // Generate Y-axis labels
    const yLabels = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const value = minValue + (range * i / steps);
      yLabels.push(value);
    }

    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1 || 1)) * graphWidth;
      const y = padding + graphHeight - ((d.weight - minValue) / range) * graphHeight;
      return { x, y, weight: d.weight, date: d.date };
    });

    const path = points
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
      .join(" ");

    return (
      <div className="w-full overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="w-full">
          {/* Grid lines and Y-axis labels */}
          {yLabels.map((value, idx) => {
            const ratio = (value - minValue) / range;
            const y = padding + graphHeight - (ratio * graphHeight);
            return (
              <g key={idx}>
                <line
                  x1={padding}
                  y1={y}
                  x2={padding + graphWidth}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                />
                <text 
                  x={padding - 10} 
                  y={y + 4} 
                  fontSize="12" 
                  textAnchor="end" 
                  fill="#64748b"
                >
                  {value.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Data line */}
          <path
            d={path}
            fill="none"
            stroke="#00ff88"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, i) => (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill="#00ff88"
                stroke="#0a1628"
                strokeWidth="2"
              />
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Format date and time for workout logs
  const formatWorkoutDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `היום, ${date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `אתמול, ${date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return date.toLocaleDateString("he-IL", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // Calculate workout completion percentage
  const getWorkoutCompletion = (workout: WorkoutLogWithDetails) => {
    if (!workout.set_logs || workout.set_logs.length === 0) return 0;
    // Simple calculation - you can make it more sophisticated
    return Math.min(100, Math.round((workout.set_logs.length / 10) * 100));
  };

  // Toggle workout expansion
  const toggleWorkoutExpansion = (workoutId: string) => {
    setExpandedWorkouts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workoutId)) {
        newSet.delete(workoutId);
      } else {
        newSet.add(workoutId);
      }
      return newSet;
    });
  };

  // Group sets by exercise
  const groupSetsByExercise = (setLogs: WorkoutLogWithDetails['set_logs']) => {
    const grouped: Record<string, typeof setLogs> = {};
    setLogs.forEach(setLog => {
      const exerciseName = setLog.exercise?.name || 'תרגיל לא ידוע';
      if (!grouped[exerciseName]) {
        grouped[exerciseName] = [];
      }
      grouped[exerciseName].push(setLog);
    });
    return grouped;
  };

  // Ensure user is authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#00ff88]" />
          <p className="mt-2 text-gray-400">טוען...</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#00ff88]" />
          <p className="mt-2 text-gray-400">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !trainee) {
    return (
      <div className="min-h-screen bg-[#0a1628] p-4" dir="rtl">
        <div className="max-w-6xl mx-auto pt-8">
          <Card className="bg-[#1a2332] border-red-500 border-gray-800">
            <CardContent className="pt-6">
              <p className="text-red-400">{error || "לא נמצא מתאמן"}</p>
              <Link href="/trainer/trainees">
                <Button variant="outline" className="mt-4 border-gray-700 text-gray-300 hover:bg-gray-800">
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
    <div className="min-h-screen bg-[#0a1628] p-4 lg:p-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Trainee Profile Section */}
        <Card className="bg-[#1a2332] border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/trainer/trainees">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <CardTitle className="text-2xl text-white">פרופיל מתאמן: {trainee.name}</CardTitle>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              {/* Profile Picture */}
              <div className="w-24 h-24 rounded-full bg-[#00ff88] flex items-center justify-center text-black font-bold text-2xl flex-shrink-0">
                {trainee.name.charAt(0)}
              </div>
              
              {/* Profile Details */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-300">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{trainee.email || "אין אימייל"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">אין טלפון</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">הצטרף: {formatDate(trainee.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">תוכנית פעילה:</span>
                  <span className="text-sm text-white font-semibold">
                    {workoutPlan?.name || "אין תוכנית"}
                  </span>
                  {workoutPlan && (
                    <Link href={`/trainer/workout-plans/${traineeId}/edit`}>
                      <Button className="bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold text-xs h-8 px-3">
                        <Eye className="h-3 w-3 ml-1" />
                        צפה בתוכנית
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Biometric Data Section */}
        <Card className="bg-[#1a2332] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-xl">נתונים ביומטריים</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">התקדמות משקל גוף</h3>
              <LineChart data={weeklyWeights} height={200} />
            </div>
          </CardContent>
        </Card>

        {/* Recent Workouts Table */}
        <Card className="bg-[#1a2332] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-xl">אימונים אחרונים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workoutLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  אין אימונים עדיין
                </div>
              ) : (
                workoutLogs.slice(0, 10).map((workout) => {
                  const isExpanded = expandedWorkouts.has(workout.id);
                  const groupedSets = workout.set_logs ? groupSetsByExercise(workout.set_logs) : {};
                  
                  return (
                    <div key={workout.id} className="border border-gray-800 rounded-lg overflow-hidden">
                      {/* Workout Header */}
                      <div 
                        className="bg-[#0f1a2a] hover:bg-[#1a2332] transition-colors cursor-pointer"
                        onClick={() => toggleWorkoutExpansion(workout.id)}
                      >
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="text-white font-semibold">
                                  {workout.routine ? `אימון ${workout.routine.letter}${workout.routine.name ? ` - ${workout.routine.name}` : ''}` : 'אימון'}
                                </span>
                                <span className="text-sm text-gray-400">
                                  {formatWorkoutDate(workout.date)}
                                </span>
                              </div>
                              {workout.set_logs && workout.set_logs.length > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {workout.set_logs.length} סטים • {Object.keys(groupedSets).length} תרגילים
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[#00ff88] font-semibold text-sm">
                              הושלם ({getWorkoutCompletion(workout)}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Workout Details */}
                      {isExpanded && workout.set_logs && workout.set_logs.length > 0 && (
                        <div className="bg-[#1a2332] p-4 space-y-4">
                          {Object.entries(groupedSets).map(([exerciseName, sets]) => (
                            <div key={exerciseName} className="border border-gray-800 rounded-lg p-4 bg-[#0f1a2a]">
                              <div className="flex items-center gap-2 mb-3">
                                <Dumbbell className="h-4 w-4 text-[#00ff88]" />
                                <h4 className="text-white font-semibold">{exerciseName}</h4>
                                <span className="text-xs text-gray-400">({sets.length} סטים)</span>
                              </div>
                              <div className="space-y-2">
                                {sets.map((setLog, idx) => (
                                  <div 
                                    key={idx} 
                                    className="flex items-center justify-between p-2 bg-[#1a2332] rounded border border-gray-800"
                                  >
                                    <div className="flex items-center gap-4 text-sm">
                                      <span className="text-gray-400">סט {idx + 1}</span>
                                      <span className="text-white">
                                        {setLog.weight_kg > 0 ? `${setLog.weight_kg} ק"ג` : 'משקל גוף'}
                                      </span>
                                      <span className="text-gray-400">×</span>
                                      <span className="text-white">{setLog.reps} חזרות</span>
                                      {setLog.rir_actual !== null && (
                                        <>
                                          <span className="text-gray-400">•</span>
                                          <span className="text-gray-400">RIR: {setLog.rir_actual}</span>
                                        </>
                                      )}
                                    </div>
                                    {setLog.notes && (
                                      <span className="text-xs text-gray-500 max-w-xs truncate" title={setLog.notes}>
                                        {setLog.notes}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          
                          {/* Workout Summary */}
                          <div className="mt-4 pt-4 border-t border-gray-800">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-xs text-gray-400 mb-1">סה"כ סטים</p>
                                <p className="text-lg font-bold text-white">{workout.set_logs.length}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-1">סה"כ תרגילים</p>
                                <p className="text-lg font-bold text-white">{Object.keys(groupedSets).length}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-1">סה"כ נפח</p>
                                <p className="text-lg font-bold text-[#00ff88]">
                                  {workout.set_logs.reduce((total, set) => 
                                    total + (set.weight_kg * set.reps), 0
                                  ).toFixed(0)} ק"ג
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
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
