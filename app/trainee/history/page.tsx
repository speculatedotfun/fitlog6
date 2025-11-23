"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, TrendingUp, Dumbbell, Activity, Target, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getWorkoutLogs, getBodyWeightHistory } from "@/lib/db";
import type { WorkoutLogWithDetails } from "@/lib/types";

export default function HistoryPage() {
  const { user } = useAuth();
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogWithDetails[]>([]);
  const [weightHistory, setWeightHistory] = useState<Array<{ date: string; weight: number }>>([]);

  // Load data from Supabase
  useEffect(() => {
    if (user?.id) {
      loadHistoryData();
    }
  }, [user?.id]);

  const loadHistoryData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [logs, weights] = await Promise.all([
        getWorkoutLogs(user.id),
        getBodyWeightHistory(user.id)
      ]);

      setWorkoutLogs(logs);
      setWeightHistory(weights);
    } catch (error) {
      console.error('Error loading history data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert workout logs to the format expected by the component
  // Only show logs that have actual sets (real workouts), not just body weight
  const workoutHistory = workoutLogs
    .filter(log => log.set_logs && log.set_logs.length > 0)
    .map(log => ({
      id: log.id,
      date: log.date,
      routine: log.routine ? `אימון ${log.routine.letter}` : 'אימון',
      exercises: log.set_logs?.map(setLog => ({
        name: setLog.exercise?.name || 'תרגיל לא ידוע',
        weight: setLog.weight_kg,
        reps: setLog.reps
      })) || []
    }));

  // Get exercise progress data
  const getExerciseProgress = (exerciseName: string) => {
    const progress: Array<{ date: string; weight: number; reps: number }> = [];
    
    workoutHistory.forEach((workout) => {
      const exercise = workout.exercises.find((ex) => ex.name === exerciseName);
      if (exercise) {
        progress.push({
          date: workout.date,
          weight: exercise.weight,
          reps: exercise.reps,
        });
      }
    });
    
    return progress.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Get unique exercises from history
  const uniqueExercises = Array.from(
    new Set(workoutHistory.flatMap((w) => w.exercises.map((e) => e.name)))
  );

  // Get workouts per week
  const getWorkoutsPerWeek = () => {
    const weeks: Record<string, number> = {};
    workoutHistory.forEach((workout) => {
      const date = new Date(workout.date);
      const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
      weeks[weekKey] = (weeks[weekKey] || 0) + 1;
    });
    return Object.entries(weeks).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  };

  // Simple line chart component
  const SimpleLineChart = ({ data, label, unit = "", height = 200 }: {
    data: Array<{ date: string; value: number }>;
    label: string;
    unit?: string;
    height?: number;
  }) => {
    if (data.length === 0) return null;

    const padding = 40;
    const chartWidth = 600;
    const chartHeight = height;
    const graphWidth = chartWidth - padding * 2;
    const graphHeight = chartHeight - padding * 2;

    const minValue = Math.min(...data.map((d) => d.value));
    const maxValue = Math.max(...data.map((d) => d.value));
    const range = maxValue - minValue || 1;

    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1 || 1)) * graphWidth;
      const y = padding + graphHeight - ((d.value - minValue) / range) * graphHeight;
      return { x, y, value: d.value, date: d.date };
    });

    const path = points
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
      .join(" ");

    return (
      <div className="w-full overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="border rounded-lg bg-white">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding + graphHeight * (1 - ratio);
            const value = minValue + range * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={padding}
                  y1={y}
                  x2={padding + graphWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text x={padding - 10} y={y + 4} fontSize="10" textAnchor="end" fill="#6b7280">
                  {value.toFixed(unit === "kg" ? 1 : 0)}
                </text>
              </g>
            );
          })}

          {/* Data line */}
          <path
            d={path}
            fill="none"
            stroke="#3b82f6"
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
                fill="#3b82f6"
                stroke="white"
                strokeWidth="2"
              />
              <title>
                {new Date(point.date).toLocaleDateString("he-IL")}: {point.value}
                {unit}
              </title>
            </g>
          ))}

          {/* Labels */}
          <text
            x={chartWidth / 2}
            y={chartHeight - 10}
            fontSize="12"
            textAnchor="middle"
            fill="#6b7280"
          >
            {label}
          </text>
        </svg>
      </div>
    );
  };

  // Bar chart component
  const SimpleBarChart = ({ data, label, height = 200 }: {
    data: Array<{ label: string; value: number }>;
    label: string;
    height?: number;
  }) => {
    if (data.length === 0) return null;

    const padding = 40;
    const chartWidth = 600;
    const chartHeight = height;
    const graphWidth = chartWidth - padding * 2;
    const graphHeight = chartHeight - padding * 2;
    const barWidth = graphWidth / data.length - 10;
    const maxValue = Math.max(...data.map((d) => d.value));

    return (
      <div className="w-full overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="border rounded-lg bg-white">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding + graphHeight * (1 - ratio);
            const value = maxValue * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={padding}
                  y1={y}
                  x2={padding + graphWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text x={padding - 10} y={y + 4} fontSize="10" textAnchor="end" fill="#6b7280">
                  {value.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((item, i) => {
            const barHeight = (item.value / maxValue) * graphHeight;
            const x = padding + i * (graphWidth / data.length) + 5;
            const y = padding + graphHeight - barHeight;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#3b82f6"
                  rx="4"
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  fontSize="10"
                  textAnchor="middle"
                  fill="#6b7280"
                >
                  {item.value}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 25}
                  fontSize="10"
                  textAnchor="middle"
                  fill="#6b7280"
                  transform={`rotate(-45 ${x + barWidth / 2} ${chartHeight - 25})`}
                >
                  {item.label}
                </text>
              </g>
            );
          })}

          {/* Label */}
          <text
            x={chartWidth / 2}
            y={chartHeight - 10}
            fontSize="12"
            textAnchor="middle"
            fill="#6b7280"
          >
            {label}
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/trainee/dashboard">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <CardTitle className="text-2xl">היסטוריית אימונים והתקדמות</CardTitle>
                  <CardDescription>צפה בכל האימונים וההתקדמות שלך</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Content */}
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="mt-2 text-muted-foreground">טוען היסטוריית אימונים...</p>
            </CardContent>
          </Card>
        ) : workoutHistory.length === 0 ? (
          /* No Data State */
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-blue-900 mb-2">אין היסטוריית אימונים עדיין</h3>
              <p className="text-blue-800 mb-4">
                כשתתחיל לרשום אימונים, ההיסטוריה והגרפים שלך יופיעו כאן.
              </p>
              <div className="space-y-2 text-sm text-blue-700">
                <p>• בצע אימון והשלם אותו</p>
                <p>• רשום את המשקלים והחזרות</p>
                <p>• חזור לכאן כדי לראות התקדמות</p>
              </div>
              <Link href="/trainee/workout" className="inline-block mt-4">
                <Button>התחל אימון ראשון</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          /* Stats Summary */
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">סה"כ אימונים</p>
                    <p className="text-2xl font-bold">{workoutHistory.length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">אימונים השבוע</p>
                    <p className="text-2xl font-bold">
                      {workoutHistory.filter(
                        (w) =>
                          new Date(w.date) >=
                          new Date(new Date().setDate(new Date().getDate() - 7))
                      ).length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">משקל נוכחי</p>
                    <p className="text-2xl font-bold">
                      {weightHistory[weightHistory.length - 1]?.weight || '—'} ק"ג
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">תרגילים שונים</p>
                    <p className="text-2xl font-bold">{uniqueExercises.length}</p>
                  </div>
                  <Dumbbell className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
