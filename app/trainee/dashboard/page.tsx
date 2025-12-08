"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Search, Settings, Play, X,
  Clock, Flame, Bell, Home, TrendingUp, BarChart3, User,
  Trophy, Zap, Target, Calendar
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getActiveWorkoutPlan, getRoutinesWithExercises, getWorkoutLogs } from "@/lib/db";
import type { WorkoutPlan, RoutineWithExercises } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// ============================================
// TYPES
// ============================================
interface WorkoutStats {
  calories: number;
  minutes: number;
}

interface DifficultyInfo {
  label: string;
  color: string;
}

interface ActivityStats {
  steps: number;
  stepsProgress: number;
  heartRate: number;
  streak: number;
  weeklyGoal: number;
}

// ============================================
// COMPONENTS
// ============================================

// Circular Progress Component
const CircularProgress = ({ 
  progress, 
  size = 128, 
  strokeWidth = 10,
  value,
  label,
  color = "#5B7FFF"
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number;
  value: string;
  label: string;
  color?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg 
        className="transform -rotate-90 transition-all duration-1000 ease-out"
        width={size} 
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#3D4058"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(91, 127, 255, 0.4))'
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-outfit font-bold animate-fade-in" style={{ color }}>
          {value}
        </span>
        <span className="text-[#9CA3AF] text-xs font-outfit">
          {label}
        </span>
      </div>
    </div>
  );
};

// Activity Card Component
const ActivityCard = ({ 
  title, 
  children, 
  delay = 0 
}: { 
  title: string; 
  children: React.ReactNode;
  delay?: number;
}) => (
  <div 
    className="flex-1 bg-[#2D3142] rounded-2xl p-4 flex flex-col gap-3 hover-lift transition-all duration-300"
    style={{ 
      animationDelay: `${delay}ms`,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
    }}
  >
    <span className="text-white text-sm font-outfit font-normal">{title}</span>
    <div className="flex flex-col items-center justify-center flex-1">
      {children}
    </div>
  </div>
);

// Workout Card Component
const WorkoutCard = ({ 
  routine, 
  imageUrl, 
  stats,
  index = 0,
  variant = 'horizontal'
}: { 
  routine: RoutineWithExercises;
  imageUrl: string;
  stats: WorkoutStats;
  index?: number;
  variant?: 'horizontal' | 'vertical';
}) => {
  const routineName = routine.name || `אימון ${routine.letter}`;
  
  if (variant === 'horizontal') {
    return (
      <Link
        href={`/trainee/workout?routine=${routine.id}`}
        className="flex-shrink-0 w-[280px] h-[160px] rounded-2xl relative overflow-hidden group"
        style={{
          animationDelay: `${index * 100}ms`
        }}
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          style={{ 
            backgroundImage: `url(${imageUrl})`,
          }}
        />
        
        {/* Gradient Overlay */}
        <div 
          className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-90"
          style={{ 
            background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.7) 100%)',
          }}
        />
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'radial-gradient(circle at 50% 100%, rgba(91, 127, 255, 0.2) 0%, transparent 70%)'
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-white text-xl font-outfit font-bold transition-transform duration-300 group-hover:translate-x-1">
              {routineName}
            </h3>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 w-fit transition-all duration-300 group-hover:bg-white">
                <Flame className="w-4 h-4 text-[#1A1D2E]" />
                <span className="text-[#1A1D2E] text-xs font-outfit font-medium">
                  {stats.calories} קלוריות
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 w-fit transition-all duration-300 group-hover:bg-white">
                <Clock className="w-4 h-4 text-[#1A1D2E]" />
                <span className="text-[#1A1D2E] text-xs font-outfit font-medium">
                  {stats.minutes} דקות
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="w-12 h-12 bg-[#5B7FFF] rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[#5B7FFF]/50">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>
        </div>
      </Link>
    );
  }
  
  // Vertical variant
  return (
    <Link
      href={`/trainee/workout?routine=${routine.id}`}
      className="w-full h-[220px] rounded-2xl relative overflow-hidden group slide-up"
      style={{
        animationDelay: `${index * 100}ms`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
        style={{ 
          backgroundImage: `url(${imageUrl})`,
          filter: 'grayscale(20%)',
        }}
      />
      
      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-90"
        style={{ 
          background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%)',
        }}
      />
      
      {/* Glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(circle at 50% 100%, rgba(91, 127, 255, 0.3) 0%, transparent 70%)'
        }}
      />
      
      {/* Content - Will show this section below */}
    </Link>
  );
};

// Streak Badge Component
const StreakBadge = ({ streak }: { streak: number }) => {
  if (streak === 0) return null;
  
  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-[#FF8A00] to-[#EF4444] rounded-full px-3 py-1.5 animate-fade-in"
      style={{
        boxShadow: '0 4px 12px rgba(255, 138, 0, 0.3)'
      }}
    >
      <Flame className="w-4 h-4 text-white" />
      <span className="text-white text-sm font-outfit font-bold">
        {streak} ימים רצוף
      </span>
    </div>
  );
};

// Achievement Badge Component
const AchievementBadge = ({ 
  icon: Icon, 
  label, 
  delay = 0 
}: { 
  icon: any; 
  label: string;
  delay?: number;
}) => (
  <div 
    className="flex flex-col items-center gap-2 p-3 bg-[#2D3142] rounded-xl hover-lift transition-all duration-300"
    style={{
      animationDelay: `${delay}ms`,
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
    }}
  >
    <div className="w-12 h-12 bg-gradient-to-br from-[#5B7FFF] to-[#4A5FCC] rounded-full flex items-center justify-center"
      style={{
        boxShadow: '0 4px 12px rgba(91, 127, 255, 0.4)'
      }}
    >
      <Icon className="w-6 h-6 text-white" />
    </div>
    <span className="text-[#9CA3AF] text-xs font-outfit text-center">{label}</span>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
export default function TraineeDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"discover" | "my-workouts">("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  const traineeId = user?.id || "";

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!traineeId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const [plan, logs] = await Promise.all([
          getActiveWorkoutPlan(traineeId),
          getWorkoutLogs(traineeId, 30),
        ]);
        
        if (!cancelled) {
          setWorkoutPlan(plan);
          setWorkoutLogs(logs || []);
          if (plan) {
            const routinesData = await getRoutinesWithExercises(plan.id);
            if (!cancelled) {
              setRoutines(routinesData);
            }
          }
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [traineeId, authLoading]);

  // Calculate activity stats with streak
  const activityStats: ActivityStats = useMemo(() => {
    const dailyGoalSteps = 300000;
    
    const totalWorkoutMinutes = workoutLogs.reduce((total, log: any) => {
      let durationMinutes = 0;
      
      if (log.duration_seconds) {
        durationMinutes = log.duration_seconds / 60;
      } else if (log.start_time && log.end_time) {
        const start = new Date(log.start_time).getTime();
        const end = new Date(log.end_time).getTime();
        durationMinutes = (end - start) / (1000 * 60);
      } else {
        durationMinutes = 45;
      }
      
      return total + durationMinutes;
    }, 0);
    
    const estimatedSteps = Math.round(totalWorkoutMinutes * 120);
    const baseSteps = 200000;
    const totalSteps = estimatedSteps + baseSteps;
    const stepsProgress = Math.min(Math.round((totalSteps / dailyGoalSteps) * 100), 100);
    const avgHeartRate = workoutLogs.length > 0 ? 105 : 72;
    
    // Calculate streak
    const sortedLogs = [...workoutLogs]
      .filter(log => log.completed)
      .sort((a, b) => new Date(b.date || b.start_time).getTime() - new Date(a.date || a.start_time).getTime());
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const log of sortedLogs) {
      const logDate = new Date(log.date || log.start_time);
      logDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    // Weekly goal progress (assuming 4 workouts per week)
    const thisWeekLogs = workoutLogs.filter(log => {
      const logDate = new Date(log.date || log.start_time);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return logDate >= weekAgo && log.completed;
    });
    const weeklyGoal = Math.min(Math.round((thisWeekLogs.length / 4) * 100), 100);
    
    return {
      steps: totalSteps,
      stepsProgress,
      heartRate: avgHeartRate,
      streak,
      weeklyGoal,
    };
  }, [workoutLogs]);

  // Calculate workout stats
  const calculateWorkoutStats = (routine: RoutineWithExercises): WorkoutStats => {
    if (!routine.routine_exercises || routine.routine_exercises.length === 0) {
      return { calories: 0, minutes: 0 };
    }

    const totalSets = routine.routine_exercises.reduce((sum, re) => sum + (re.target_sets || 3), 0);
    const totalRestTime = routine.routine_exercises.reduce((sum, re) => {
      const sets = re.target_sets || 3;
      const restTime = re.rest_time_seconds || 180;
      return sum + (sets * restTime);
    }, 0);
    
    const executionTime = totalSets * 30;
    const totalTimeSeconds = totalRestTime + executionTime;
    const minutes = Math.round(totalTimeSeconds / 60);
    const calories = Math.round(minutes * 9);
    
    return { calories, minutes };
  };

  // Get difficulty info
  const getDifficultyInfo = (letter: string): DifficultyInfo => {
    if (letter === "A" || letter === "B") {
      return { label: "מתחיל", color: "bg-[#4CAF50]" };
    }
    if (letter === "C" || letter === "D") {
      return { label: "בינוני", color: "bg-[#FF8A00]" };
    }
    if (letter === "E") {
      return { label: "מתקדם", color: "bg-[#EF4444]" };
    }
    return { label: "בינוני", color: "bg-[#FF8A00]" };
  };

  // Get today's routine
  const getTodayRoutine = () => {
    if (routines.length === 0) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastLog = workoutLogs
      .filter(log => log.completed)
      .sort((a, b) => new Date(b.date || b.start_time).getTime() - new Date(a.date || a.start_time).getTime())[0];

    if (lastLog && lastLog.routine_id) {
      const lastRoutineIndex = routines.findIndex(r => r.id === lastLog.routine_id);
      if (lastRoutineIndex >= 0 && lastRoutineIndex < routines.length - 1) {
        return routines[lastRoutineIndex + 1];
      }
    }

    return routines[0];
  };

  // Calculate routine progress
  const calculateRoutineProgress = (routineId: string) => {
    const routineLogs = workoutLogs.filter(log => log.routine_id === routineId && log.completed);
    if (routineLogs.length === 0) return 0;
    return Math.min(Math.round((routineLogs.length / 4) * 100), 100);
  };

  // Filter routines by search
  const filteredRoutines = useMemo(() => {
    if (!searchQuery) return routines;
    return routines.filter(r => 
      (r.name || `אימון ${r.letter}`).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [routines, searchQuery]);

  const todayRoutine = getTodayRoutine();

  const workoutImages = [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=280&h=160&fit=crop',
    'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=280&h=160&fit=crop',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=280&h=160&fit=crop',
  ];

  const myWorkoutImages = [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=393&h=220&fit=crop',
    'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=393&h=220&fit=crop',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=393&h=220&fit=crop',
  ];

  if (loading || authLoading) {
    return <LoadingSpinner fullScreen text="טוען..." size="lg" />;
  }

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        .slide-up {
          animation: slideUp 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4) !important;
        }
        
        .hover-lift:active {
          transform: translateY(-2px);
        }
        
        .pulse-animation {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Background texture */
        .bg-texture {
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(91, 127, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(91, 127, 255, 0.02) 0%, transparent 50%);
        }
        
        /* Glassmorphism effect */
        .glass-effect {
          background: rgba(45, 49, 66, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
      `}</style>

      <div className="relative bg-[#1A1D2E] w-full min-h-screen bg-texture">
        {/* Main Content */}
        <div className="w-full overflow-y-auto pb-24 scrollbar-hide">
          <div className="w-full max-w-[393px] mx-auto px-5 pt-12">
            <div className="flex flex-col items-start w-full gap-6">
              
              {/* Welcome Header */}
              <div className="w-full flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-3">
                  <Avatar className="w-[60px] h-[60px] ring-2 ring-[#5B7FFF]/30 ring-offset-2 ring-offset-[#1A1D2E] transition-all duration-300 hover:ring-[#5B7FFF]/50">
                    <AvatarImage src={user?.profile_image_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-[#5B7FFF] to-[#4A5FCC] text-white text-xl">
                      {user?.name?.charAt(0) || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-[#9CA3AF] text-sm font-outfit font-normal">
                      ברוך הבא
                    </span>
                    <h1 className="text-white text-[32px] font-outfit font-bold leading-tight">
                      {user?.name || 'Stephen'}
                    </h1>
                  </div>
                </div>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-12 h-12 bg-[#2D3142] rounded-full flex items-center justify-center hover-lift transition-all relative"
                  style={{
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <Bell className="w-6 h-6 text-white" />
                  {activityStats.streak > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF4444] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{activityStats.streak}</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Streak Badge */}
              {activityStats.streak > 0 && (
                <div className="w-full flex justify-center" style={{ animationDelay: '100ms' }}>
                  <StreakBadge streak={activityStats.streak} />
                </div>
              )}

              {/* Tabs */}
              <div className="w-full border-b border-[#2D3142]" style={{ animationDelay: '200ms' }}>
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("discover")}
                    className={`flex-1 pb-3 text-base font-outfit font-medium transition-all duration-300 relative ${
                      activeTab === "discover" 
                        ? "text-[#5B7FFF]" 
                        : "text-[#9CA3AF] hover:text-white"
                    }`}
                  >
                    גלה
                    {activeTab === "discover" && (
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#5B7FFF] rounded-t-full"
                        style={{
                          boxShadow: '0 -2px 8px rgba(91, 127, 255, 0.5)'
                        }}
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("my-workouts")}
                    className={`flex-1 pb-3 text-base font-outfit font-medium transition-all duration-300 relative ${
                      activeTab === "my-workouts" 
                        ? "text-[#5B7FFF]" 
                        : "text-[#9CA3AF] hover:text-white"
                    }`}
                  >
                    האימונים שלי
                    {activeTab === "my-workouts" && (
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#5B7FFF] rounded-t-full"
                        style={{
                          boxShadow: '0 -2px 8px rgba(91, 127, 255, 0.5)'
                        }}
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div 
                className="w-full h-[52px] bg-[#2D3142] rounded-xl flex items-center gap-3 px-4 hover-lift transition-all"
                style={{ 
                  animationDelay: '300ms',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                <Search className="w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חיפוש אימון..."
                  className="flex-1 bg-transparent text-white text-base font-outfit outline-none placeholder:text-[#9CA3AF]"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#3D4058] transition-colors"
                  >
                    <X className="w-4 h-4 text-[#9CA3AF]" />
                  </button>
                )}
              </div>

              {/* Tab Content */}
              {activeTab === "discover" ? (
                <>
                  {/* Activity Section */}
                  <div className="w-full flex flex-col gap-4 slide-up" style={{ animationDelay: '400ms' }}>
                    <div className="flex justify-between items-center">
                      <h2 className="text-white text-lg font-outfit font-semibold">
                        הפעילות שלך
                      </h2>
                      <Settings className="w-5 h-5 text-white cursor-pointer hover:rotate-90 transition-transform duration-300" />
                    </div>

                    <div className="flex gap-4">
                      {/* Steps Card */}
                      <ActivityCard title="צעדים" delay={100}>
                        <CircularProgress
                          progress={activityStats.stepsProgress}
                          value={activityStats.steps.toLocaleString()}
                          label="צעדים"
                        />
                      </ActivityCard>

                      {/* Heart Rate Card */}
                      <ActivityCard title="דופק" delay={200}>
                        <div className="flex flex-col items-center gap-2 w-full">
                          {/* Heart Rate Graph */}
                          <svg className="w-full h-16 pulse-animation" viewBox="0 0 160 60" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="heartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#5B7FFF" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#5B7FFF" stopOpacity="0.2" />
                              </linearGradient>
                            </defs>
                            <polyline
                              points="0,50 20,45 30,20 40,55 50,15 60,50 80,40 100,25 120,45 140,30 160,40"
                              fill="none"
                              stroke="url(#heartGradient)"
                              strokeWidth="2.5"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="flex flex-col items-center">
                            <span className="text-[#5B7FFF] text-2xl font-outfit font-bold">
                              {activityStats.heartRate}
                            </span>
                            <span className="text-[#9CA3AF] text-xs font-outfit">
                              פעימות לדקה
                            </span>
                          </div>
                        </div>
                      </ActivityCard>
                    </div>
                  </div>

                  {/* Weekly Goal Progress */}
                  <div className="w-full flex flex-col gap-3 slide-up" style={{ animationDelay: '500ms' }}>
                    <div className="flex justify-between items-center">
                      <h3 className="text-white text-base font-outfit font-medium">יעד שבועי</h3>
                      <span className="text-[#5B7FFF] text-sm font-outfit font-semibold">{activityStats.weeklyGoal}%</span>
                    </div>
                    <div className="relative w-full h-3 bg-[#2D3142] rounded-full overflow-hidden"
                      style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)' }}
                    >
                      <div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#5B7FFF] to-[#4A5FCC] rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${activityStats.weeklyGoal}%`,
                          boxShadow: '0 0 12px rgba(91, 127, 255, 0.6)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="w-full flex flex-col gap-4 slide-up" style={{ animationDelay: '600ms' }}>
                    <h2 className="text-white text-lg font-outfit font-semibold">
                      ההישגים שלך
                    </h2>
                    <div className="grid grid-cols-4 gap-3">
                      <AchievementBadge icon={Trophy} label="100 אימונים" delay={100} />
                      <AchievementBadge icon={Zap} label="7 ימים רצוף" delay={200} />
                      <AchievementBadge icon={Target} label="יעד חודשי" delay={300} />
                      <AchievementBadge icon={Calendar} label="30 יום" delay={400} />
                    </div>
                  </div>

                  {/* Popular Workouts */}
                  <div className="w-full flex flex-col gap-4 slide-up" style={{ animationDelay: '700ms' }}>
                    <h2 className="text-white text-lg font-outfit font-semibold">
                      אימונים פופולריים
                    </h2>
                    <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-5 px-5">
                      {filteredRoutines.slice(0, 3).map((routine, idx) => (
                        <WorkoutCard
                          key={routine.id}
                          routine={routine}
                          imageUrl={workoutImages[idx % workoutImages.length]}
                          stats={calculateWorkoutStats(routine)}
                          index={idx}
                          variant="horizontal"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Today's Plan */}
                  <div className="w-full flex flex-col gap-4 slide-up" style={{ animationDelay: '800ms' }}>
                    <h2 className="text-white text-lg font-outfit font-semibold">
                      התוכנית של היום
                    </h2>
                    {todayRoutine ? (
                      (() => {
                        const difficulty = getDifficultyInfo(todayRoutine.letter || "C");
                        const progress = calculateRoutineProgress(todayRoutine.id);
                        const routineName = todayRoutine.name || `אימון ${todayRoutine.letter}`;
                        const imageIndex = routines.findIndex(r => r.id === todayRoutine.id) % workoutImages.length;
                        
                        return (
                          <Link
                            href={`/trainee/workout?routine=${todayRoutine.id}`}
                            className="w-full bg-[#2D3142] rounded-2xl p-3 flex gap-4 hover-lift transition-all group"
                            style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)' }}
                          >
                            {/* Workout Image */}
                            <div 
                              className="w-[100px] h-[120px] rounded-xl bg-cover bg-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
                              style={{ 
                                backgroundImage: `url(${workoutImages[imageIndex]})`,
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
                              }}
                            />
                            
                            {/* Workout Info */}
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div className="flex flex-col gap-2">
                                <h3 className="text-white text-xl font-outfit font-semibold">
                                  {routineName}
                                </h3>
                                <div className={`inline-flex items-center justify-center ${difficulty.color} rounded-lg px-3 py-1.5 w-fit transition-all duration-300 group-hover:scale-105`}
                                  style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)' }}
                                >
                                  <span className="text-white text-xs font-outfit font-medium">
                                    {difficulty.label}
                                  </span>
                                </div>
                              </div>
                              {/* Progress Bar */}
                              <div className="relative w-full h-8 bg-[#4A4E69] rounded-lg overflow-hidden"
                                style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)' }}
                              >
                                <div 
                                  className="absolute left-0 top-0 h-full bg-[#9CA3AF] flex items-center justify-center transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                >
                                  {progress > 0 && (
                                    <span className="text-[#1A1D2E] text-sm font-outfit font-semibold">
                                      {progress}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })()
                    ) : (
                      <div className="w-full bg-[#2D3142] rounded-2xl p-6 flex items-center justify-center glass-effect">
                        <p className="text-[#9CA3AF] text-sm">אין תוכנית להיום</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* My Workouts Tab */
                <div className="w-full flex flex-col gap-4">
                  {filteredRoutines.length > 0 ? filteredRoutines.map((routine, idx) => {
                    const difficulty = getDifficultyInfo(routine.letter || "C");
                    const progress = calculateRoutineProgress(routine.id);
                    const routineName = routine.name || `אימון ${routine.letter}`;
                    
                    return (
                      <Link
                        key={routine.id}
                        href={`/trainee/workout?routine=${routine.id}`}
                        className="w-full h-[220px] rounded-2xl relative overflow-hidden group slide-up"
                        style={{
                          animationDelay: `${idx * 100}ms`,
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                        }}
                      >
                        {/* Background Image */}
                        <div 
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          style={{ 
                            backgroundImage: `url(${myWorkoutImages[idx % myWorkoutImages.length]})`,
                            filter: 'grayscale(20%)',
                          }}
                        />
                        
                        {/* Gradient Overlay */}
                        <div 
                          className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-90"
                          style={{ 
                            background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%)',
                          }}
                        />
                        
                        {/* Glow effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{
                            background: 'radial-gradient(circle at 50% 100%, rgba(91, 127, 255, 0.3) 0%, transparent 70%)'
                          }}
                        />
                        
                        {/* Content */}
                        <div className="relative z-10 h-full flex flex-col justify-end p-5">
                          <div className="flex flex-col gap-3">
                            <h3 className="text-white text-2xl font-outfit font-bold transition-transform duration-300 group-hover:translate-x-2">
                              {routineName}
                            </h3>
                            <div className={`inline-flex items-center justify-center ${difficulty.color} rounded-lg px-3 py-1.5 w-fit transition-all duration-300 group-hover:scale-105`}
                              style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }}
                            >
                              <span className="text-white text-xs font-outfit font-medium">
                                {difficulty.label}
                              </span>
                            </div>
                            {/* Progress Bar */}
                            <div className="relative w-full h-8 bg-[#4A4E69] rounded-lg overflow-hidden"
                              style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)' }}
                            >
                              {progress > 0 && (
                                <div 
                                  className="absolute left-0 top-0 h-full bg-[#9CA3AF] flex items-center justify-center transition-all duration-700"
                                  style={{ width: `${progress}%` }}
                                >
                                  <span className="text-[#1A1D2E] text-sm font-outfit font-semibold">
                                    {progress}%
                                  </span>
                                </div>
                              )}
                              {progress < 100 && (
                                <div 
                                  className="absolute left-0 top-0 h-full bg-[#5B7FFF] opacity-30"
                                  style={{ width: `${100 - progress}%`, marginLeft: `${progress}%` }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  }) : (
                    <div className="w-full h-[220px] bg-[#2D3142] rounded-2xl p-6 flex items-center justify-center glass-effect">
                      <p className="text-[#9CA3AF] text-sm">
                        {searchQuery ? "לא נמצאו תוצאות" : "אין אימונים זמינים"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#1A1D2E] border-t border-[#2D3142]"
          style={{ 
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="max-w-[393px] mx-auto flex items-center justify-around h-20 px-4">
            <button className="flex flex-col items-center justify-center gap-1 group">
              <div className="w-14 h-9 bg-[#5B7FFF] rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ boxShadow: '0 4px 16px rgba(91, 127, 255, 0.4)' }}
              >
                <Home className="w-6 h-6 text-white" />
              </div>
            </button>
            <button className="flex flex-col items-center justify-center gap-1 group transition-all duration-300 hover:scale-110">
              <TrendingUp className="w-7 h-7 text-[#9CA3AF] group-hover:text-white transition-colors" />
            </button>
            <button className="flex flex-col items-center justify-center gap-1 group transition-all duration-300 hover:scale-110">
              <BarChart3 className="w-7 h-7 text-[#9CA3AF] group-hover:text-white transition-colors" />
            </button>
            <button className="flex flex-col items-center justify-center gap-1 group transition-all duration-300 hover:scale-110">
              <Trophy className="w-7 h-7 text-[#9CA3AF] group-hover:text-white transition-colors" />
            </button>
            <button className="flex flex-col items-center justify-center gap-1 group transition-all duration-300 hover:scale-110">
              <User className="w-7 h-7 text-[#9CA3AF] group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}