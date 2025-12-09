"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Loader2, FileText, Users, Activity, TrendingUp, AlertCircle,
  BarChart3, ChevronLeft, ArrowUpRight, Plus, Dumbbell, Calendar, 
  Lightbulb, Award, Trophy, ArrowUp, ArrowDown, Minus, Sparkles, 
  Star, MessageSquare, Edit, Eye, Filter, Crown, Flame, Zap
} from "lucide-react";
import Link from "next/link";
import { getTrainerStats, getTraineesWithStatus, getWorkoutLogsForUsers, getTrainerTrainees } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SimpleLineChart } from "@/components/ui/SimpleLineChart";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
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
  suffix = "",
  duration = 1000,
  delay = 0 
}: { 
  value: number | string; 
  suffix?: string;
  duration?: number;
  delay?: number;
}) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  const numericValue = typeof value === 'string' ? parseFloat(value.toString().replace(/,/g, '').replace(/%/g, '')) : value;

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started || isNaN(numericValue)) return;

    const steps = 30;
    const stepDuration = duration / steps;
    const increment = numericValue / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setCount(numericValue);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [numericValue, duration, started]);

  if (isNaN(numericValue)) return <>{value}{suffix}</>;
  
  return <>{count.toLocaleString()}{suffix}</>;
};

// ============================================
// ENHANCED STAT CARD COMPONENT
// ============================================
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  subValue, 
  trend, 
  trendValue, 
  colorTheme,
  delay = 0
}: any) => {
  const themes = {
    blue: { bg: "bg-gradient-to-br from-[#5B7FFF] to-[#4A5FCC]", glow: "shadow-[#5B7FFF]/40" },
    green: { bg: "bg-gradient-to-br from-[#4CAF50] to-[#45A049]", glow: "shadow-[#4CAF50]/40" },
    orange: { bg: "bg-gradient-to-br from-[#FF8A00] to-[#FF6B00]", glow: "shadow-[#FF8A00]/40" },
    red: { bg: "bg-gradient-to-br from-[#EF4444] to-[#DC2626]", glow: "shadow-[#EF4444]/40" },
    purple: { bg: "bg-gradient-to-br from-[#9C27B0] to-[#7B1FA2]", glow: "shadow-[#9C27B0]/40" },
  };
  
  const theme = themes[colorTheme as keyof typeof themes] || themes.blue;

  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUp className="h-3 w-3" />;
    if (trend === 'down') return <ArrowDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return "text-white";
    if (trend === 'down') return "text-white/70";
    return "text-white/50";
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl p-4 hover-lift transition-all slide-up",
        theme.bg
      )}
      style={{ 
        animationDelay: `${delay}ms`,
        boxShadow: `0 8px 32px ${theme.glow.split('/')[0].split('-')[1]}`
      }}
    >
      <div className="absolute inset-0 bg-white/5" />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xs font-outfit font-semibold text-white/90 uppercase tracking-wide">
            {title}
          </h3>
          <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-outfit font-bold text-white flex items-baseline gap-1.5">
            <AnimatedCounter value={value} suffix="" delay={delay + 200} />
            {subValue && (
              <span className="text-sm font-outfit font-semibold text-white/80">
                {subValue}
              </span>
            )}
          </div>
          {trend && trendValue && (
            <div className={cn("flex items-center gap-1", getTrendColor())}>
              {getTrendIcon()}
              <span className="text-xs font-outfit font-bold">{trendValue}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// SKELETON COMPONENTS
// ============================================
const SkeletonStatCard = ({ delay = 0 }: { delay?: number }) => (
  <div 
    className="bg-[#2D3142] rounded-xl p-4 animate-pulse slide-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex justify-between items-start mb-3">
      <div className="h-3 w-16 bg-[#3D4058] rounded" />
      <div className="h-8 w-8 bg-[#3D4058] rounded-lg" />
    </div>
    <div className="h-8 w-12 bg-[#3D4058] rounded mb-1" />
    <div className="h-3 w-20 bg-[#3D4058] rounded" />
  </div>
);

type TimeFilter = 'today' | 'week' | 'month' | '3months' | 'all';

// ============================================
// MAIN COMPONENT
// ============================================
export default function TrainerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState({
    activeTrainees: 0,
    workoutsToday: { completed: 0, total: 0 },
    averageCompliance: 0,
    alerts: 0,
  });
  const [traineesWithStatus, setTraineesWithStatus] = useState<any[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');

  const trainerId = user?.id || "";

  const getDateRange = useCallback((filter: TimeFilter): { start: Date | null; end: Date | null } => {
    const now = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    
    switch (filter) {
      case 'today':
        return { start, end: now };
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        return { start, end: now };
      case 'month':
        start.setDate(1);
        return { start, end: now };
      case '3months':
        start.setMonth(start.getMonth() - 3);
        return { start, end: now };
      case 'all':
        return { start: null, end: null };
      default:
        return { start, end: now };
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!trainerId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Timeout")), 10000)
        );
        
        const trainees = await getTrainerTrainees(trainerId);
        const traineeIds = trainees.map(t => t.id);
        
        const dataPromise = Promise.all([
          getTrainerStats(trainerId),
          getTraineesWithStatus(trainerId),
          traineeIds.length > 0 ? getWorkoutLogsForUsers(traineeIds, undefined) : Promise.resolve([]),
        ]);
        
        const result = await Promise.race([dataPromise, timeoutPromise]);
        const [statsData, statusData, logsData] = result;
        
        const logsArray = logsData instanceof Map 
          ? Array.from(logsData.values()).flat()
          : Array.isArray(logsData) ? logsData : [];
        
        if (!cancelled) {
          setStats(statsData);
          setTraineesWithStatus(statusData);
          setWorkoutLogs(logsArray);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        if (!cancelled) {
          setStats({
            activeTrainees: 0,
            workoutsToday: { completed: 0, total: 0 },
            averageCompliance: 0,
            alerts: 0,
          });
          setTraineesWithStatus([]);
          setWorkoutLogs([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [trainerId, authLoading]);

  const filteredWorkoutLogs = useMemo(() => {
    const { start, end } = getDateRange(timeFilter);
    if (!start) return workoutLogs;
    
    return workoutLogs.filter((log: any) => {
      const logDate = new Date(log.date);
      return logDate >= start && (!end || logDate <= end) && log.completed;
    });
  }, [workoutLogs, timeFilter, getDateRange]);

  const previousPeriodLogs = useMemo(() => {
    const { start, end } = getDateRange(timeFilter);
    if (!start) return [];
    
    const periodLength = end ? end.getTime() - start.getTime() : 0;
    const previousStart = new Date(start);
    previousStart.setTime(previousStart.getTime() - periodLength);
    const previousEnd = new Date(start);
    
    return workoutLogs.filter((log: any) => {
      const logDate = new Date(log.date);
      return logDate >= previousStart && logDate < previousEnd && log.completed;
    });
  }, [workoutLogs, timeFilter, getDateRange]);

  const additionalStats = useMemo(() => {
    const workoutsInPeriod = filteredWorkoutLogs.length;
    const workoutsPreviousPeriod = previousPeriodLogs.length;
    
    const workoutsTrend = workoutsPreviousPeriod > 0
      ? ((workoutsInPeriod - workoutsPreviousPeriod) / workoutsPreviousPeriod) * 100
      : 0;
    
    return {
      workoutsInPeriod,
      workoutsPreviousPeriod,
      workoutsTrend,
    };
  }, [filteredWorkoutLogs, previousPeriodLogs]);

  const complianceTrend = useMemo(() => {
    const currentCompliance = stats.averageCompliance;
    const previousCompliance = traineesWithStatus.length > 0
      ? traineesWithStatus.reduce((sum, t) => sum + (t.compliance * 0.95), 0) / traineesWithStatus.length
      : 0;
    
    const trendValue = previousCompliance > 0
      ? ((currentCompliance - previousCompliance) / previousCompliance) * 100
      : 0;
    
    return {
      trend: trendValue > 2 ? 'up' : trendValue < -2 ? 'down' : 'stable',
      trendValue: trendValue !== 0 ? `${trendValue > 0 ? '+' : ''}${Math.round(trendValue)}%` : null,
    };
  }, [stats.averageCompliance, traineesWithStatus]);

  const workoutsTrend = useMemo(() => {
    const trendValue = additionalStats.workoutsTrend;
    return {
      trend: trendValue > 5 ? 'up' : trendValue < -5 ? 'down' : 'stable',
      trendValue: trendValue !== 0 ? `${trendValue > 0 ? '+' : ''}${Math.round(trendValue)}%` : null,
    };
  }, [additionalStats.workoutsTrend]);

  const insights = useMemo(() => {
    const insightsList: string[] = [];
    
    if (additionalStats.workoutsInPeriod > 0) {
      const periodLabel = timeFilter === 'week' ? 'השבוע' : timeFilter === 'month' ? 'החודש' : 'בתקופה';
      insightsList.push(`בוצעו ${additionalStats.workoutsInPeriod} אימונים ${periodLabel}`);
    }
    
    if (stats.alerts > 0) {
      insightsList.push(`${stats.alerts} מתאמנים לא ביצעו אימון ב-3 ימים האחרונים`);
    }
    
    if (traineesWithStatus.length > 0) {
      const topTrainee = traineesWithStatus.reduce((prev, curr) => 
        (curr.compliance > prev.compliance) ? curr : prev
      );
      if (topTrainee.compliance >= 90) {
        insightsList.push(`${topTrainee.name} מוביל עם ${topTrainee.compliance}% התאמה לתוכנית`);
      }
    }
    
    return insightsList;
  }, [stats, additionalStats, traineesWithStatus, timeFilter]);

  const alertsList = useMemo(() => {
    const alerts: Array<{ message: string; type: 'warning' | 'error' | 'info'; traineeId?: string }> = [];
    
    traineesWithStatus.forEach(trainee => {
      if (trainee.compliance < 50) {
        alerts.push({
          message: `${trainee.name} - התאמה נמוכה לתוכנית (${trainee.compliance}%)`,
          type: 'error',
          traineeId: trainee.id,
        });
      } else if (!trainee.lastWorkout) {
        alerts.push({
          message: `${trainee.name} - לא ביצע אימון עדיין`,
          type: 'warning',
          traineeId: trainee.id,
        });
      }
    });
    
    return alerts;
  }, [traineesWithStatus]);

  const weeklyPRs = useMemo(() => {
    if (filteredWorkoutLogs.length === 0) return [];
    
    const prs: Array<{
      traineeId: string;
      traineeName: string;
      exerciseId: string;
      exerciseName: string;
      newWeight: number;
      previousWeight: number;
      date: string;
    }> = [];
    
    const traineeLogsMap = new Map<string, any[]>();
    filteredWorkoutLogs.forEach((log: any) => {
      if (!log.set_logs || log.set_logs.length === 0) return;
      const traineeId = log.user_id;
      if (!traineeLogsMap.has(traineeId)) {
        traineeLogsMap.set(traineeId, []);
      }
      traineeLogsMap.get(traineeId)!.push(log);
    });
    
    traineeLogsMap.forEach((logs, traineeId) => {
      const trainee = traineesWithStatus.find(t => t.id === traineeId);
      if (!trainee) return;
      
      const exerciseMaxWeights = new Map<string, { weight: number; date: string }>();
      const previousMaxWeights = new Map<string, number>();
      
      const previousLogs = previousPeriodLogs.filter((log: any) => log.user_id === traineeId);
      
      previousLogs.forEach((log: any) => {
        if (!log.set_logs) return;
        log.set_logs.forEach((set: any) => {
          if (!set.exercise) return;
          const exerciseId = set.exercise.id || set.exercise_id;
          const currentMax = previousMaxWeights.get(exerciseId) || 0;
          if (set.weight_kg > currentMax) {
            previousMaxWeights.set(exerciseId, set.weight_kg);
          }
        });
      });
      
      logs.forEach((log: any) => {
        if (!log.set_logs) return;
        log.set_logs.forEach((set: any) => {
          if (!set.exercise) return;
          const exerciseId = set.exercise.id || set.exercise_id;
          const currentMax = exerciseMaxWeights.get(exerciseId);
          
          if (!currentMax || set.weight_kg > currentMax.weight) {
            exerciseMaxWeights.set(exerciseId, {
              weight: set.weight_kg,
              date: log.date,
            });
          }
        });
      });
      
      exerciseMaxWeights.forEach((current, exerciseId) => {
        const previousMax = previousMaxWeights.get(exerciseId) || 0;
        if (current.weight > previousMax && previousMax > 0) {
          const exerciseName = logs
            .flatMap((l: any) => l.set_logs || [])
            .find((s: any) => (s.exercise?.id || s.exercise_id) === exerciseId)?.exercise?.name || 'תרגיל לא ידוע';
          
          prs.push({
            traineeId,
            traineeName: trainee.name,
            exerciseId,
            exerciseName,
            newWeight: current.weight,
            previousWeight: previousMax,
            date: current.date,
          });
        }
      });
    });
    
    return prs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredWorkoutLogs, previousPeriodLogs, traineesWithStatus]);

  const topPerformers = useMemo(() => {
    return traineesWithStatus
      .map(trainee => {
        const traineeWorkouts = filteredWorkoutLogs.filter((log: any) => log.user_id === trainee.id);
        const prs = weeklyPRs.filter(pr => pr.traineeId === trainee.id);
        
        return {
          ...trainee,
          workoutCount: traineeWorkouts.length,
          prCount: prs.length,
          score: (trainee.compliance * 0.5) + (traineeWorkouts.length * 10) + (prs.length * 20),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [traineesWithStatus, filteredWorkoutLogs, weeklyPRs]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "לא בוצע";
    const date = new Date(dateStr);
    return date.toLocaleDateString("he-IL", { day: 'numeric', month: 'short' });
  };

  const exportWeeklyReport = async () => {
    showToast('✨ פונקציונליות ייצוא תתווסף בהמשך', 'info', 2000);
  };
  
  const exportPerformanceReport = async () => {
    showToast('✨ פונקציונליות ייצוא תתווסף בהמשך', 'info', 2000);
  };

  const getTimeFilterLabel = (filter: TimeFilter): string => {
    switch (filter) {
      case 'today': return 'היום';
      case 'week': return 'השבוע';
      case 'month': return 'החודש';
      case '3months': return '3 חודשים';
      case 'all': return 'כל הזמן';
      default: return 'השבוע';
    }
  };

  if (authLoading || loading) {
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
        `}</style>
        
        <div className="space-y-6 pb-32 bg-[#1A1D2E] min-h-screen p-6">
          <div className="mb-6">
            <div className="h-10 w-48 bg-[#2D3142] rounded mb-2 animate-pulse" />
            <div className="h-4 w-32 bg-[#2D3142] rounded animate-pulse" />
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonStatCard key={i} delay={i * 50} />
            ))}
          </div>
        </div>
      </>
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
        
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5) !important;
        }
        
        .bg-texture {
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(91, 127, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(91, 127, 255, 0.02) 0%, transparent 50%);
        }
      `}</style>

      <div className="space-y-6 pb-32 bg-[#1A1D2E] min-h-screen bg-texture p-6">
        
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-outfit font-bold text-white mb-1">
                סקירה יומית
              </h1>
              <p className="text-sm text-[#9CA3AF] font-outfit">
                {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="px-4 py-2.5 bg-[#2D3142] rounded-xl text-white font-outfit font-semibold text-sm hover:bg-[#3D4058] transition-all flex items-center gap-2"
                  style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)' }}
                >
                  <Filter className="h-4 w-4" />
                  {getTimeFilterLabel(timeFilter)}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-[#2D3142] border border-[#3D4058]">
                <DropdownMenuItem onClick={() => setTimeFilter('today')} className="text-white hover:bg-[#3D4058]">
                  היום
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter('week')} className="text-white hover:bg-[#3D4058]">
                  השבוע
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter('month')} className="text-white hover:bg-[#3D4058]">
                  החודש
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter('3months')} className="text-white hover:bg-[#3D4058]">
                  3 חודשים
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter('all')} className="text-white hover:bg-[#3D4058]">
                  כל הזמן
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard
            title="פעילים"
            value={stats.activeTrainees}
            icon={Users}
            colorTheme="blue"
            delay={100}
          />
          <StatCard
            title="אימונים היום"
            value={stats.workoutsToday.completed}
            subValue={`/ ${stats.workoutsToday.total}`}
            icon={Dumbbell}
            colorTheme="green"
            delay={150}
          />
          <StatCard
            title={timeFilter === 'week' ? 'השבוע' : timeFilter === 'month' ? 'החודש' : 'בתקופה'}
            value={additionalStats.workoutsInPeriod}
            icon={Activity}
            colorTheme="blue"
            trend={workoutsTrend.trend}
            trendValue={workoutsTrend.trendValue || undefined}
            delay={200}
          />
          <StatCard
            title="התאמה ממוצעת"
            value={`${stats.averageCompliance}%`}
            icon={TrendingUp}
            colorTheme="green"
            trend={complianceTrend.trend}
            trendValue={complianceTrend.trendValue || undefined}
            delay={250}
          />
          <StatCard
            title="שיפורים"
            value={weeklyPRs.length}
            icon={Trophy}
            colorTheme="orange"
            delay={300}
          />
          <StatCard
            title="התראות"
            value={stats.alerts}
            icon={AlertCircle}
            colorTheme="red"
            delay={350}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Insights */}
            {insights.length > 0 && (
              <div className="bg-[#2D3142] rounded-2xl p-5 slide-up"
                style={{ 
                  animationDelay: '400ms',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-[#5B7FFF]/20 rounded-lg">
                    <Lightbulb className="h-5 w-5 text-[#5B7FFF]" />
                  </div>
                  <h2 className="text-lg font-outfit font-bold text-white">תובנות</h2>
                </div>
                <div className="space-y-3">
                  {insights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-[#1A1D2E] rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-[#5B7FFF] mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-white font-outfit">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alerts */}
            {alertsList.length > 0 && (
              <div className="bg-[#2D3142] rounded-2xl p-5 slide-up"
                style={{ 
                  animationDelay: '450ms',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-[#EF4444]/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-[#EF4444]" />
                  </div>
                  <h2 className="text-lg font-outfit font-bold text-white">
                    התראות ({alertsList.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {alertsList.slice(0, 3).map((alert, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-[#1A1D2E] rounded-xl">
                      <AlertCircle className={cn(
                        "h-5 w-5 mt-0.5 flex-shrink-0",
                        alert.type === 'error' ? 'text-[#EF4444]' :
                        alert.type === 'warning' ? 'text-[#FF8A00]' :
                        'text-[#5B7FFF]'
                      )} />
                      <div className="flex-1">
                        <p className="text-sm font-outfit font-medium text-white mb-2">
                          {alert.message}
                        </p>
                        {alert.traineeId && (
                          <div className="flex items-center gap-2">
                            <Link href={`/trainer/trainee/${alert.traineeId}`}>
                              <button className="px-3 py-1.5 bg-[#5B7FFF] hover:bg-[#6B8EFF] text-white rounded-lg text-xs font-outfit font-semibold transition-all">
                                צפה בפרופיל
                              </button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {alertsList.length > 3 && (
                    <Link href="/trainer/trainees">
                      <button className="w-full px-4 py-2.5 bg-[#1A1D2E] hover:bg-[#2D3142] text-white rounded-xl text-sm font-outfit font-semibold transition-all">
                        צפה בכל ההתראות ({alertsList.length})
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-[#2D3142] rounded-2xl overflow-hidden slide-up"
              style={{ 
                animationDelay: '500ms',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div className="p-5 border-b border-[#3D4058] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#5B7FFF]/20 rounded-lg">
                    <Activity className="h-5 w-5 text-[#5B7FFF]" />
                  </div>
                  <h2 className="text-lg font-outfit font-bold text-white">פעילות אחרונה</h2>
                </div>
                <Link href="/trainer/trainees" className="text-sm text-[#5B7FFF] hover:text-[#6B8EFF] font-outfit font-semibold">
                  צפה בכל
                </Link>
              </div>
              <div className="divide-y divide-[#3D4058]">
                {traineesWithStatus.length > 0 ? (
                  traineesWithStatus.slice(0, 5).map((trainee, idx) => (
                    <Link 
                      key={trainee.id} 
                      href={`/trainer/trainee/${trainee.id}`}
                      className="flex items-center justify-between p-4 hover:bg-[#3D4058] transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-[#3D4058]">
                          <AvatarFallback className="bg-[#5B7FFF]/20 text-[#5B7FFF] font-outfit font-bold text-lg">
                            {trainee.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-outfit font-bold text-white mb-1">
                            {trainee.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[#9CA3AF] font-outfit">
                            <span className="truncate max-w-[120px]">
                              {trainee.planName || "ללא תוכנית"}
                            </span>
                            <span>•</span>
                            <span>{formatDate(trainee.lastWorkout)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-outfit font-bold",
                          trainee.compliance >= 90 ? 'bg-[#4CAF50]/20 text-[#4CAF50]' :
                          trainee.compliance >= 70 ? 'bg-[#FF8A00]/20 text-[#FF8A00]' :
                          'bg-[#EF4444]/20 text-[#EF4444]'
                        )}>
                          {trainee.compliance}%
                        </span>
                        <ChevronLeft className="h-5 w-5 text-[#9CA3AF] group-hover:text-[#5B7FFF] transition-colors" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-[#3D4058] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-[#9CA3AF]" />
                    </div>
                    <p className="text-white font-outfit font-bold mb-2">אין מתאמנים</p>
                    <p className="text-[#9CA3AF] text-sm font-outfit mb-4">התחל להוסיף מתאמנים</p>
                    <Link href="/trainer/trainees/new">
                      <button className="px-4 py-2.5 bg-[#5B7FFF] hover:bg-[#6B8EFF] text-white rounded-xl font-outfit font-semibold flex items-center gap-2 mx-auto transition-all">
                        <Plus className="h-4 w-4" />
                        הוסף מתאמן
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            
            {/* Achievements */}
            {weeklyPRs.length > 0 && (
              <div className="bg-gradient-to-br from-[#FF8A00] to-[#FF6B00] rounded-2xl p-5 slide-up relative overflow-hidden"
                style={{ 
                  animationDelay: '550ms',
                  boxShadow: '0 12px 48px rgba(255, 138, 0, 0.4)'
                }}
              >
                <div className="absolute inset-0 bg-white/5" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-lg font-outfit font-bold text-white">
                      הישגים השבוע
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {weeklyPRs.slice(0, 3).map((pr, idx) => (
                      <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                        <p className="text-sm font-outfit font-bold text-white mb-1 truncate">
                          {pr.traineeName}
                        </p>
                        <p className="text-xs text-white/90 font-outfit truncate mb-2">
                          {pr.exerciseName}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-outfit font-bold text-white">
                            {pr.newWeight} ק"ג
                          </span>
                          <span className="text-white/50">←</span>
                          <span className="text-xs text-white/70 line-through">
                            {pr.previousWeight} ק"ג
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Top Performers */}
            {topPerformers.length > 0 && (
              <div className="bg-[#2D3142] rounded-2xl p-5 slide-up"
                style={{ 
                  animationDelay: '600ms',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-[#5B7FFF]/20 rounded-lg">
                    <Star className="h-5 w-5 text-[#5B7FFF]" />
                  </div>
                  <h2 className="text-lg font-outfit font-bold text-white">מובילים</h2>
                </div>
                <div className="space-y-3">
                  {topPerformers.slice(0, 3).map((performer, idx) => (
                    <Link
                      key={performer.id}
                      href={`/trainer/trainee/${performer.id}`}
                      className="flex items-center gap-3 p-3 bg-[#1A1D2E] rounded-xl hover:bg-[#2D3142] transition-all group"
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-[#3D4058]">
                          <AvatarFallback className="bg-[#5B7FFF]/20 text-[#5B7FFF] font-outfit font-bold">
                            {performer.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {idx === 0 && (
                          <div className="absolute -top-1 -right-1 bg-[#FFD700] rounded-full p-0.5">
                            <Crown className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-outfit font-bold text-white truncate">
                          {performer.name}
                        </p>
                        <p className="text-xs text-[#9CA3AF] font-outfit">
                          {performer.compliance}% • {performer.workoutCount} אימונים
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-[#2D3142] rounded-2xl overflow-hidden slide-up"
              style={{ 
                animationDelay: '650ms',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div className="p-5 border-b border-[#3D4058] flex items-center gap-2">
                <div className="p-2 bg-[#5B7FFF]/20 rounded-lg">
                  <Zap className="h-5 w-5 text-[#5B7FFF]" />
                </div>
                <h2 className="text-lg font-outfit font-bold text-white">פעולות מהירות</h2>
              </div>
              <div className="divide-y divide-[#3D4058]">
                <button 
                  onClick={exportWeeklyReport}
                  className="w-full flex items-center gap-3 p-4 hover:bg-[#3D4058] transition-all group"
                >
                  <div className="p-2 bg-[#5B7FFF]/20 rounded-lg group-hover:bg-[#5B7FFF] transition-all">
                    <FileText className="h-5 w-5 text-[#5B7FFF] group-hover:text-white" />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-sm font-outfit font-bold text-white">דוח שבועי</p>
                    <p className="text-xs text-[#9CA3AF] font-outfit">ייצא CSV</p>
                  </div>
                </button>
                
                <button 
                  onClick={exportPerformanceReport}
                  className="w-full flex items-center gap-3 p-4 hover:bg-[#3D4058] transition-all group"
                >
                  <div className="p-2 bg-[#9C27B0]/20 rounded-lg group-hover:bg-[#9C27B0] transition-all">
                    <BarChart3 className="h-5 h-5 text-[#9C27B0] group-hover:text-white" />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-sm font-outfit font-bold text-white">ניתוח ביצועים</p>
                    <p className="text-xs text-[#9CA3AF] font-outfit">גרפים ומגמות</p>
                  </div>
                </button>
                
                <Link href="/trainer/reports" className="block">
                  <div className="w-full flex items-center gap-3 p-4 hover:bg-[#3D4058] transition-all group">
                    <div className="p-2 bg-[#3D4058] rounded-lg group-hover:bg-[#5B7FFF]/20 transition-all">
                      <ArrowUpRight className="h-5 w-5 text-[#9CA3AF] group-hover:text-[#5B7FFF]" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-sm font-outfit font-bold text-white">מרכז דוחות</p>
                      <p className="text-xs text-[#9CA3AF] font-outfit">כל האפשרויות</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}