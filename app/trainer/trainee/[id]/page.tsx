"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Scale, Edit, Eye, TrendingUp, Loader2, Mail, Phone, Calendar, ChevronDown, ChevronUp, Dumbbell, Users, Activity, Trophy, AlertCircle, Filter, ArrowUpDown, Lightbulb, X, BarChart3, MessageSquare, TrendingDown, Award, Zap, Target } from "lucide-react";
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
import { SimpleLineChart } from "@/components/ui/SimpleLineChart";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ============================================
// ANIMATED COUNTER COMPONENT
// ============================================
const AnimatedCounter = ({ 
  value, 
  duration = 1000,
  delay = 0,
  suffix = ""
}: { 
  value: number; 
  duration?: number;
  delay?: number;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0;
      const end = value;
      const increment = end / 30;
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, duration / 30);
      return () => clearInterval(timer);
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [value, duration, delay]);

  return <>{count}{suffix}</>;
};

// ============================================
// STAT CARD COMPONENT
// ============================================
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  subValue, 
  colorTheme,
  index = 0
}: any) {
  const themes = {
    blue: { 
      gradient: "from-[#5B7FFF] to-[#4A5FCC]",
      shadow: "shadow-[0_8px_32px_rgba(91,127,255,0.4)]",
    },
    green: { 
      gradient: "from-[#4CAF50] to-[#45A049]",
      shadow: "shadow-[0_8px_32px_rgba(76,175,80,0.4)]",
    },
    orange: { 
      gradient: "from-[#FF8A00] to-[#E67A00]",
      shadow: "shadow-[0_8px_32px_rgba(255,138,0,0.4)]",
    },
    red: { 
      gradient: "from-[#EF4444] to-[#DC2626]",
      shadow: "shadow-[0_8px_32px_rgba(239,68,68,0.4)]",
    },
    purple: {
      gradient: "from-[#9C27B0] to-[#7B1FA2]",
      shadow: "shadow-[0_8px_32px_rgba(156,39,176,0.4)]",
    },
  };
  
  const theme = themes[colorTheme as keyof typeof themes] || themes.blue;

  return (
    <div 
      className={cn(
        "bg-gradient-to-br rounded-2xl p-6 relative overflow-hidden group hover:scale-105 transition-all duration-300 slide-up",
        theme.gradient,
        theme.shadow
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* White Overlay */}
      <div className="absolute inset-0 bg-white/5" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-sm font-outfit font-semibold text-white/80">{title}</h3>
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        
        <div className="mt-auto">
          <div className="text-3xl font-outfit font-black text-white flex items-baseline gap-2">
            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
            {subValue && <span className="text-sm font-outfit font-semibold text-white/70">{subValue}</span>}
          </div>
        </div>
      </div>
      
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-white/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

// ============================================
// SKELETON COMPONENTS
// ============================================
function SkeletonStatCard() {
  return (
    <div className="bg-[#2D3142] rounded-2xl p-6 animate-pulse" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>
      <div className="flex justify-between items-start mb-4">
        <Skeleton className="h-4 w-20 bg-[#3D4058]" />
        <Skeleton className="h-10 w-10 rounded-xl bg-[#3D4058]" />
      </div>
      <Skeleton className="h-8 w-16 bg-[#3D4058]" />
    </div>
  );
}

type DateFilter = 'week' | 'month' | '3months' | 'all';
type RoutineFilter = 'all' | string;
type StatusFilter = 'all' | 'completed' | 'incomplete';
type SortBy = 'date-desc' | 'date-asc' | 'sets-desc' | 'sets-asc' | 'volume-desc' | 'volume-asc';

// ============================================
// MAIN COMPONENT
// ============================================
function TraineeManagementPageContent() {
  const params = useParams();
  const traineeId = params.id as string;
  const { user } = useAuth();
  const { showToast } = useToast();

  const [trainee, setTrainee] = useState<User | null>(null);
  const [weeklyWeights, setWeeklyWeights] = useState<Array<{ date: string; weight: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogWithDetails[]>([]);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());
  
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [routineFilter, setRoutineFilter] = useState<RoutineFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date-desc');

  useEffect(() => {
    loadData();
  }, [traineeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const traineeData = await getUser(traineeId);
      setTrainee(traineeData);

      const weights = await getBodyWeightHistory(traineeId);
      setWeeklyWeights(weights);

      const plan = await getActiveWorkoutPlan(traineeId);
      setWorkoutPlan(plan);

      const logs = await getWorkoutLogs(traineeId);
      setWorkoutLogs(logs);
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || "שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

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

  const quickStats = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const workoutsThisWeek = workoutLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= weekStart && log.completed;
    }).length;
    
    const expectedWorkoutsPerWeek = 3;
    const compliance = workoutsThisWeek >= expectedWorkoutsPerWeek 
      ? 100 
      : Math.round((workoutsThisWeek / expectedWorkoutsPerWeek) * 100);
    
    const prsThisWeek = 0;
    
    const currentWeight = weeklyWeights.length > 0 
      ? weeklyWeights[weeklyWeights.length - 1].weight 
      : null;
    
    const completedWorkouts = workoutLogs.filter(log => log.completed);
    const lastWorkoutDate = completedWorkouts.length > 0
      ? completedWorkouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
      : null;
    
    return {
      compliance,
      workoutsThisWeek,
      prsThisWeek,
      currentWeight,
      lastWorkoutDate,
      hasActivePlan: !!workoutPlan,
      totalWorkouts: completedWorkouts.length,
    };
  }, [workoutLogs, weeklyWeights, workoutPlan]);

  const personalRecords = useMemo(() => {
    if (workoutLogs.length === 0) return [];
    
    const prs: Array<{
      exerciseId: string;
      exerciseName: string;
      newWeight: number;
      previousWeight: number;
      date: string;
    }> = [];
    
    const exerciseMaxWeights = new Map<string, { weight: number; date: string }[]>();
    
    workoutLogs
      .filter(log => log.completed && log.set_logs)
      .forEach(log => {
        log.set_logs.forEach(setLog => {
          if (!setLog.exercise) return;
          const exerciseId = setLog.exercise.id || setLog.exercise_id;
          const exerciseName = setLog.exercise.name || 'תרגיל לא ידוע';
          
          if (!exerciseMaxWeights.has(exerciseId)) {
            exerciseMaxWeights.set(exerciseId, []);
          }
          
          exerciseMaxWeights.get(exerciseId)!.push({
            weight: setLog.weight_kg,
            date: log.date,
          });
        });
      });
    
    exerciseMaxWeights.forEach((weights, exerciseId) => {
      const sortedWeights = weights.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const exerciseName = workoutLogs
        .flatMap(log => log.set_logs || [])
        .find(set => (set.exercise?.id || set.exercise_id) === exerciseId)?.exercise?.name || 'תרגיל לא ידוע';
      
      let previousMax = 0;
      sortedWeights.forEach(({ weight, date }) => {
        if (weight > previousMax && previousMax > 0) {
          prs.push({
            exerciseId,
            exerciseName,
            newWeight: weight,
            previousWeight: previousMax,
            date,
          });
        }
        previousMax = Math.max(previousMax, weight);
      });
    });
    
    return prs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [workoutLogs]);

  const insights = useMemo(() => {
    const insightsList: string[] = [];
    
    if (quickStats.workoutsThisWeek > 0) {
      insightsList.push(`בוצעו ${quickStats.workoutsThisWeek} אימונים השבוע`);
    }
    
    if (personalRecords.length > 0) {
      const prsThisWeek = personalRecords.filter(pr => {
        const prDate = new Date(pr.date);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return prDate >= weekStart;
      }).length;
      if (prsThisWeek > 0) {
        insightsList.push(`${prsThisWeek} Personal Records השבוע - כל הכבוד!`);
      }
    }
    
    if (quickStats.lastWorkoutDate) {
      const daysSinceLastWorkout = Math.floor(
        (new Date().getTime() - new Date(quickStats.lastWorkoutDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastWorkout > 3) {
        insightsList.push(`לא בוצע אימון ב-${daysSinceLastWorkout} ימים`);
      }
    }
    
    if (weeklyWeights.length >= 2) {
      const recent = weeklyWeights.slice(-1)[0].weight;
      const previous = weeklyWeights.slice(-2)[0].weight;
      const diff = recent - previous;
      if (Math.abs(diff) > 0.5) {
        insightsList.push(`משקל ${diff > 0 ? 'עלה' : 'ירד'} ב-${Math.abs(diff).toFixed(1)} ק"ג החודש`);
      }
    }
    
    return insightsList;
  }, [quickStats, personalRecords, weeklyWeights]);

  const filteredAndSortedWorkouts = useMemo(() => {
    let filtered = [...workoutLogs];
    
    if (dateFilter !== 'all') {
      const now = new Date();
      const startDate = new Date();
      switch (dateFilter) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
      }
      filtered = filtered.filter(log => new Date(log.date) >= startDate);
    }
    
    if (routineFilter !== 'all') {
      filtered = filtered.filter(log => log.routine_id === routineFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => 
        statusFilter === 'completed' ? log.completed : !log.completed
      );
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'sets-desc':
          return (b.set_logs?.length || 0) - (a.set_logs?.length || 0);
        case 'sets-asc':
          return (a.set_logs?.length || 0) - (b.set_logs?.length || 0);
        case 'volume-desc':
          const volumeB = (b.set_logs || []).reduce((sum, set) => sum + (set.weight_kg * set.reps), 0);
          const volumeA = (a.set_logs || []).reduce((sum, set) => sum + (set.weight_kg * set.reps), 0);
          return volumeB - volumeA;
        case 'volume-asc':
          const volumeA2 = (a.set_logs || []).reduce((sum, set) => sum + (set.weight_kg * set.reps), 0);
          const volumeB2 = (b.set_logs || []).reduce((sum, set) => sum + (set.weight_kg * set.reps), 0);
          return volumeA2 - volumeB2;
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [workoutLogs, dateFilter, routineFilter, statusFilter, sortBy]);

  const uniqueRoutines = useMemo(() => {
    const routines = new Map<string, { id: string; name: string }>();
    workoutLogs.forEach(log => {
      if (log.routine && !routines.has(log.routine_id)) {
        routines.set(log.routine_id, {
          id: log.routine_id,
          name: log.routine.name || `רוטינה ${log.routine.letter}`,
        });
      }
    });
    return Array.from(routines.values());
  }, [workoutLogs]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#1A1D2E] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#5B7FFF]" />
          <p className="mt-2 text-[#9CA3AF] font-outfit">טוען...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1D2E] p-4 lg:p-6 pb-32" dir="rtl">
        <div className="max-w-6xl mx-auto space-y-6">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      </div>
    );
  }

  if (error || !trainee) {
    return (
      <div className="min-h-screen bg-[#1A1D2E] p-4 lg:p-6 pb-32 flex items-center justify-center" dir="rtl">
        <div className="bg-[#2D3142] rounded-2xl p-8 text-center max-w-md"
          style={{ boxShadow: '0 12px 48px rgba(239, 68, 68, 0.4)' }}
        >
          <AlertCircle className="h-16 w-16 text-[#EF4444] mx-auto mb-4" />
          <p className="text-lg font-outfit font-bold text-white mb-2">
            {error || "לא נמצא מתאמן"}
          </p>
          <Link href="/trainer/trainees">
            <Button className="mt-4 gap-2 bg-[#5B7FFF] hover:bg-[#6B8EFF] font-outfit">
              <ArrowLeft className="h-4 w-4" />
              חזור לרשימת המתאמנים
            </Button>
          </Link>
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
        
        .slide-up {
          animation: slideUp 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .bg-texture {
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(91, 127, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(91, 127, 255, 0.02) 0%, transparent 50%);
        }
      `}</style>

      <div className="min-h-screen bg-[#1A1D2E] bg-texture p-4 lg:p-6 pb-32" dir="rtl">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center gap-3 slide-up">
            <Link href="/trainer/trainees">
              <button className="w-10 h-10 rounded-xl bg-[#2D3142] hover:bg-[#3D4058] flex items-center justify-center transition-all">
                <ArrowLeft className="h-5 w-5 text-[#9CA3AF]" />
              </button>
            </Link>
            <h1 className="text-3xl font-outfit font-bold text-white">
              פרופיל מתאמן
            </h1>
          </div>

          {/* Profile Card */}
          <div 
            className="bg-gradient-to-br from-[#5B7FFF] to-[#4A5FCC] rounded-2xl p-6 relative overflow-hidden slide-up"
            style={{ 
              animationDelay: '50ms',
              boxShadow: '0 12px 48px rgba(91, 127, 255, 0.4)'
            }}
          >
            <div className="absolute inset-0 bg-white/5" />
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <Avatar className="w-24 h-24 border-4 border-white/20 ring-4 ring-white/10">
                  <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-4xl font-outfit font-bold">
                    {trainee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-outfit font-bold text-white mb-2">
                      {trainee.name}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-white/80">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm font-outfit truncate">{trainee.email || "אין אימייל"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/80">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-outfit">הצטרף: {formatDate(trainee.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/80">
                        <Dumbbell className="h-4 w-4" />
                        <span className="text-sm font-outfit">
                          <AnimatedCounter value={quickStats.totalWorkouts} /> אימונים
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-white/80" />
                        <span className="text-sm font-outfit font-semibold text-white">
                          {workoutPlan?.name || "אין תוכנית"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {workoutPlan && (
                      <Link href={`/trainer/workout-plans/${traineeId}/edit`}>
                        <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          ערוך תוכנית
                        </button>
                      </Link>
                    )}
                    <Link href={`/trainer/reports?trainee=${traineeId}`}>
                      <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        דוחות
                      </button>
                    </Link>
                    <button 
                      onClick={() => showToast('🔜 Coming soon!', 'info', 2000)}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      הודעה
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="אימונים השבוע"
              value={quickStats.workoutsThisWeek}
              icon={Dumbbell}
              colorTheme="blue"
              index={0}
            />
            <StatCard
              title="עמידה ביעדים"
              value={quickStats.compliance}
              subValue="%"
              icon={Target}
              colorTheme="green"
              index={1}
            />
            {quickStats.currentWeight && (
              <StatCard
                title="משקל נוכחי"
                value={quickStats.currentWeight.toFixed(1)}
                subValue="ק״ג"
                icon={Scale}
                colorTheme="orange"
                index={2}
              />
            )}
            <StatCard
              title="סה״כ אימונים"
              value={quickStats.totalWorkouts}
              icon={Activity}
              colorTheme="purple"
              index={3}
            />
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div 
              className="bg-[#2D3142] rounded-2xl p-6 slide-up"
              style={{ 
                animationDelay: '150ms',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-[#5B7FFF]" />
                <h2 className="text-xl font-outfit font-bold text-white">תובנות</h2>
              </div>
              <div className="space-y-2">
                {insights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-[#1A1D2E] rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-[#5B7FFF] mt-2" />
                    <p className="text-sm font-outfit text-white">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personal Records */}
          {personalRecords.length > 0 && (
            <div 
              className="bg-gradient-to-br from-[#FF8A00] to-[#E67A00] rounded-2xl p-6 relative overflow-hidden slide-up"
              style={{ 
                animationDelay: '200ms',
                boxShadow: '0 12px 48px rgba(255, 138, 0, 0.4)'
              }}
            >
              <div className="absolute inset-0 bg-white/5" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-5 w-5 text-white" />
                  <h2 className="text-xl font-outfit font-bold text-white">
                    Personal Records (<AnimatedCounter value={personalRecords.length} />)
                  </h2>
                </div>
                <div className="space-y-2">
                  {personalRecords.slice(0, 5).map((pr, idx) => (
                    <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Trophy className="h-5 w-5 text-[#FFD700]" />
                        <div>
                          <p className="font-outfit font-bold text-white text-sm">{pr.exerciseName}</p>
                          <div className="flex items-center gap-2 text-xs text-white/70 font-outfit">
                            <span className="font-bold text-white">{pr.newWeight} ק"ג</span>
                            <span>←</span>
                            <span className="line-through">{pr.previousWeight} ק"ג</span>
                            <span>• {formatDate(pr.date)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Weight Chart */}
          <div 
            className="bg-[#2D3142] rounded-2xl p-6 slide-up"
            style={{ 
              animationDelay: '250ms',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
            }}
          >
            <h2 className="text-xl font-outfit font-bold text-white mb-4">נתונים ביומטריים</h2>
            {weeklyWeights.length > 0 ? (
              <div>
                <h3 className="text-base font-outfit font-semibold text-[#9CA3AF] mb-4">התקדמות משקל גוף</h3>
                <SimpleLineChart 
                  data={weeklyWeights} 
                  height={200}
                  chartWidth={600}
                  yAxisSteps={4}
                  useThemeColors={true}
                  unit="kg"
                  className="pb-2 scrollbar-hide"
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <Scale className="h-16 w-16 text-[#3D4058] mx-auto mb-4" />
                <p className="text-base font-outfit font-bold text-white mb-2">אין נתוני משקל</p>
                <p className="text-sm font-outfit text-[#9CA3AF]">המתאמן עדיין לא הזין משקל גוף</p>
              </div>
            )}
          </div>

          {/* Recent Workouts */}
          <div 
            className="bg-[#2D3142] rounded-2xl overflow-hidden slide-up"
            style={{ 
              animationDelay: '300ms',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div className="p-6 border-b border-[#3D4058]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-xl font-outfit font-bold text-white">אימונים אחרונים</h2>
                
                <div className="flex flex-wrap gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="bg-[#1A1D2E] hover:bg-[#3D4058] text-white px-4 py-2 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        {dateFilter === 'all' ? 'תאריך' : dateFilter === 'week' ? 'השבוע' : dateFilter === 'month' ? 'החודש' : '3 חודשים'}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#2D3142] border-[#3D4058]">
                      <DropdownMenuItem onClick={() => setDateFilter('all')} className="text-white font-outfit">כל הזמן</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDateFilter('week')} className="text-white font-outfit">השבוע</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDateFilter('month')} className="text-white font-outfit">החודש</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDateFilter('3months')} className="text-white font-outfit">3 חודשים</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {uniqueRoutines.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="bg-[#1A1D2E] hover:bg-[#3D4058] text-white px-4 py-2 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          רוטינה
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#2D3142] border-[#3D4058]">
                        <DropdownMenuItem onClick={() => setRoutineFilter('all')} className="text-white font-outfit">כל הרוטינות</DropdownMenuItem>
                        {uniqueRoutines.map(routine => (
                          <DropdownMenuItem key={routine.id} onClick={() => setRoutineFilter(routine.id)} className="text-white font-outfit">
                            {routine.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {filteredAndSortedWorkouts.length === 0 ? (
                <div className="text-center py-16">
                  <Dumbbell className="h-16 w-16 text-[#3D4058] mx-auto mb-4" />
                  <p className="text-lg font-outfit font-bold text-white mb-2">
                    {workoutLogs.length === 0 ? 'אין אימונים עדיין' : 'לא נמצאו תוצאות'}
                  </p>
                  <p className="text-base font-outfit text-[#9CA3AF] mb-6">
                    {workoutLogs.length === 0 ? 'המתאמן עדיין לא ביצע אימונים' : 'נסה לשנות את הפילטרים'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAndSortedWorkouts.slice(0, 10).map((workout) => {
                    const isExpanded = expandedWorkouts.has(workout.id);
                    const groupedSets = workout.set_logs ? groupSetsByExercise(workout.set_logs) : {};
                    
                    return (
                      <div key={workout.id} className="bg-[#1A1D2E] rounded-xl overflow-hidden border border-[#3D4058] hover:border-[#5B7FFF] transition-all">
                        <button
                          onClick={() => toggleWorkoutExpansion(workout.id)}
                          className="w-full p-4 flex items-center justify-between hover:bg-[#3D4058]/30 transition-all"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-[#5B7FFF]" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-[#9CA3AF]" />
                            )}
                            <div className="flex-1 text-right">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-base font-outfit font-bold text-white">
                                  {workout.routine ? `אימון ${workout.routine.letter}${workout.routine.name ? ` - ${workout.routine.name}` : ''}` : 'אימון'}
                                </span>
                                <span className="text-sm font-outfit text-[#9CA3AF]">
                                  {formatWorkoutDate(workout.date)}
                                </span>
                                {workout.completed ? (
                                  <span className="px-3 py-1 rounded-full text-xs font-outfit font-bold bg-[#4CAF50]/20 text-[#4CAF50] border border-[#4CAF50]/30">
                                    הושלם
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 rounded-full text-xs font-outfit font-bold bg-[#FF8A00]/20 text-[#FF8A00] border border-[#FF8A00]/30">
                                    לא הושלם
                                  </span>
                                )}
                              </div>
                              {workout.set_logs && workout.set_logs.length > 0 && (
                                <div className="flex items-center gap-2 mt-2 text-xs text-[#9CA3AF] font-outfit">
                                  <span>{workout.set_logs.length} סטים</span>
                                  <span>•</span>
                                  <span>{Object.keys(groupedSets).length} תרגילים</span>
                                  <span>•</span>
                                  <span>
                                    {workout.set_logs.reduce((total, set) => total + (set.weight_kg * set.reps), 0).toFixed(0)} ק"ג נפח
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>

                        {isExpanded && workout.set_logs && workout.set_logs.length > 0 && (
                          <div className="p-6 border-t border-[#3D4058] space-y-4">
                            {Object.entries(groupedSets).map(([exerciseName, sets]) => (
                              <div key={exerciseName} className="bg-[#2D3142] rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Dumbbell className="h-4 w-4 text-[#5B7FFF]" />
                                  <h4 className="text-base font-outfit font-bold text-white">{exerciseName}</h4>
                                  <span className="text-xs text-[#9CA3AF] font-outfit">({sets.length} סטים)</span>
                                </div>
                                <div className="space-y-2">
                                  {sets.map((setLog, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-[#1A1D2E] rounded-lg">
                                      <div className="flex items-center gap-4 text-sm font-outfit">
                                        <span className="text-[#9CA3AF]">סט {idx + 1}</span>
                                        <span className="text-white font-bold">
                                          {setLog.weight_kg > 0 ? `${setLog.weight_kg} ק"ג` : 'משקל גוף'}
                                        </span>
                                        <span className="text-[#9CA3AF]">×</span>
                                        <span className="text-white font-bold">{setLog.reps} חזרות</span>
                                        {setLog.rir_actual !== null && (
                                          <>
                                            <span className="text-[#9CA3AF]">•</span>
                                            <span className="text-[#9CA3AF]">RIR: {setLog.rir_actual}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default function TraineeManagementPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <TraineeManagementPageContent />
    </ProtectedRoute>
  );
}