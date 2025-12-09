"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, CheckCircle2, Trophy, Share2, Home, Target, Dumbbell, 
  Loader2, Timer, ArrowUp, ArrowDown, Sparkles, TrendingUp, Award,
  Flame, Zap, Star, PartyPopper, Medal, Crown
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { RoutineWithExercises, Exercise } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface SetData {
  setNumber: number;
  weight: string;
  reps: string;
  rir: string;
}

interface ExerciseData extends Exercise {
  sets: SetData[];
  muscleGroup: string;
  exerciseId: string;
  previousPerformance?: { weight: number; reps: number }[];
}

// ============================================
// CONFETTI COMPONENT
// ============================================
const Confetti = ({ intense = false }: { intense?: boolean }) => {
  const colors = ['#5B7FFF', '#FF8A00', '#4CAF50', '#EF4444', '#FFD700', '#FF69B4'];
  const count = intense ? 50 : 30;
  
  const pieces = Array.from({ length: count }).map((_, i) => ({
    id: i,
    color: colors[Math.floor(Math.random() * colors.length)],
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            left: `${piece.left}%`,
            top: '-10px',
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </div>
  );
};

// ============================================
// FIREWORKS COMPONENT
// ============================================
const Fireworks = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-firework"
          style={{
            left: `${20 + i * 15}%`,
            top: '50%',
            animationDelay: `${i * 0.3}s`,
          }}
        >
          {Array.from({ length: 12 }).map((_, j) => (
            <div
              key={j}
              className="absolute w-1 h-1 rounded-full bg-[#FFD700]"
              style={{
                transform: `rotate(${j * 30}deg) translateY(-40px)`,
                opacity: 0,
                animation: `fireworkSpark 1s ease-out ${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// ============================================
// COUNTER ANIMATION COMPONENT
// ============================================
const AnimatedCounter = ({ 
  value, 
  duration = 1000,
  delay = 0 
}: { 
  value: number; 
  duration?: number;
  delay?: number;
}) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStarted(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    const steps = 30;
    const stepDuration = duration / steps;
    const increment = value / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [value, duration, started]);

  return <>{count}</>;
};

// ============================================
// STATS CARD COMPONENT
// ============================================
const StatsCard = ({ 
  icon: Icon, 
  value, 
  label, 
  bgColor,
  iconBg,
  delay = 0,
  highlight = false,
  animated = false
}: {
  icon: any;
  value: string | number;
  label: string;
  bgColor: string;
  iconBg: string;
  delay?: number;
  highlight?: boolean;
  animated?: boolean;
}) => (
  <div 
    className={cn(
      "rounded-xl p-3 flex flex-col items-center gap-2 slide-up transition-all duration-300",
      highlight ? bgColor : "bg-[#1A1D2E]",
      highlight ? "shadow-2xl" : "hover-lift"
    )}
    style={{ 
      animationDelay: `${delay}ms`,
      boxShadow: highlight 
        ? '0 8px 32px rgba(255, 138, 0, 0.4)' 
        : '0 4px 16px rgba(0, 0, 0, 0.2)'
    }}
  >
    <div className={cn(
      "p-2 rounded-lg",
      highlight ? "bg-white/20" : iconBg
    )}
      style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }}
    >
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div className="text-center">
      <div className="text-xl font-outfit font-bold text-white">
        {animated && typeof value === 'number' ? (
          <AnimatedCounter value={value} delay={delay} />
        ) : value}
      </div>
      <div className={cn(
        "text-xs font-outfit font-normal mt-1",
        highlight ? "text-white/90" : "text-[#9CA3AF]"
      )}>
        {label}
      </div>
    </div>
  </div>
);

// ============================================
// ACHIEVEMENT BADGE COMPONENT
// ============================================
const AchievementBadge = ({
  icon: Icon,
  label,
  description,
  color,
  delay = 0
}: {
  icon: any;
  label: string;
  description: string;
  color: string;
  delay?: number;
}) => (
  <div 
    className="bg-[#2D3142] rounded-xl p-4 flex items-center gap-3 slide-up hover-lift"
    style={{ 
      animationDelay: `${delay}ms`,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
    }}
  >
    <div className={`${color} p-3 rounded-full`}
      style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)' }}
    >
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="flex-1">
      <h3 className="text-white font-outfit font-bold text-sm">{label}</h3>
      <p className="text-[#9CA3AF] font-outfit text-xs mt-0.5">{description}</p>
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
function WorkoutSummaryContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [workoutData, setWorkoutData] = useState<{
    exercises: ExerciseData[];
    routine: RoutineWithExercises | null;
    startTime: string;
  } | null>(null);
  const [summary, setSummary] = useState({
    duration: "00:00:00",
    totalWeight: 0,
    volume: "Low",
    volumePercent: 0,
    completedExercises: [] as Array<{ name: string; sets: number; weight: number; reps: number; previousWeight?: number; previousReps?: number; isRecord?: boolean }>,
    personalRecords: [] as Array<{ exercise: string; weight: number; previousWeight: number }>,
    exerciseCount: 0,
    recordsCount: 0,
  });

  useEffect(() => {
    if (user?.id) {
      loadWorkoutData();
    }
  }, [user?.id]);

  // Celebration effects
  useEffect(() => {
    if (!loading && summary.recordsCount > 0) {
      // Show fireworks for records
      setShowFireworks(true);
      setTimeout(() => setShowFireworks(false), 3000);
    }
    
    if (!loading) {
      // Show confetti for any completed workout
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
  }, [loading, summary.recordsCount]);

  const loadWorkoutData = async () => {
    try {
      setLoading(true);

      const storedData = sessionStorage.getItem('workoutSummaryData');
      if (!storedData) {
        router.push('/trainee/workout');
        return;
      }

      const data = JSON.parse(storedData);
      setWorkoutData(data);

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

    const exerciseStats: Record<string, { weight: number; sets: number; reps: number; previousWeight?: number; previousReps?: number; isRecord?: boolean }> = {};

    exercises.forEach((exercise: ExerciseData) => {
      let maxWeight = 0;
      let maxReps = 0;
      
      exercise.sets.forEach((set) => {
        const weight = parseFloat(set.weight) || 0;
        const reps = parseInt(set.reps) || 0;
        if (weight > maxWeight) {
          maxWeight = weight;
          maxReps = reps;
        }
      });
      
      if (maxWeight > 0) {
        const previousWeight = exercise.previousPerformance?.[0]?.weight;
        const previousReps = exercise.previousPerformance?.[0]?.reps;
        const isRecord = previousWeight ? maxWeight > previousWeight || (maxWeight === previousWeight && maxReps > (previousReps || 0)) : false;
        
        exerciseStats[exercise.name] = {
          weight: maxWeight,
          sets: exercise.sets.filter(s => s.weight && s.reps).length,
          reps: maxReps,
          previousWeight,
          previousReps,
          isRecord,
        };
      }
    });

    const totalExercises = Object.keys(exerciseStats).length;
    const totalWeight = Object.values(exerciseStats).reduce((sum, stat) => sum + (stat.weight * stat.reps), 0);
    
    let volume = "Low";
    let volumePercent = 33;
    if (totalExercises >= 6) {
      volume = "High";
      volumePercent = 100;
    } else if (totalExercises >= 4) {
      volume = "Medium";
      volumePercent = 66;
    }

    const completedExercises = Object.entries(exerciseStats).map(([name, stats]) => ({
      name,
      sets: stats.sets,
      weight: stats.weight,
      reps: stats.reps,
      previousWeight: stats.previousWeight,
      previousReps: stats.previousReps,
      isRecord: stats.isRecord || false,
    }));

    const personalRecords: Array<{ exercise: string; weight: number; previousWeight: number }> = [];
    exercises.forEach((exercise: ExerciseData) => {
      const maxWeight = Math.max(...exercise.sets.map(s => parseFloat(s.weight) || 0));
      if (maxWeight > 0 && exercise.previousPerformance?.[0]) {
        const previousMax = exercise.previousPerformance[0].weight;
        if (maxWeight > previousMax) {
          personalRecords.push({
            exercise: exercise.name,
            weight: maxWeight,
            previousWeight: previousMax,
          });
        }
      }
    });

    setSummary({
      duration,
      totalWeight,
      volume,
      volumePercent,
      completedExercises,
      personalRecords,
      exerciseCount: completedExercises.length,
      recordsCount: personalRecords.length,
    });
  };

  const handleSaveWorkout = async () => {
    if (!workoutData || !user?.id) return;

    try {
      setSaving(true);
      sessionStorage.removeItem('workoutSummaryData');
      
      showToast('✅ אימון נשמר בהצלחה!', "success", 2000);
      
      setTimeout(() => {
        router.push('/trainee/dashboard');
      }, 1000);
    } catch (error: any) {
      console.error('Error navigating:', error);
      showToast('Error navigating to home: ' + (error.message || 'Unknown error'), "error", 5000);
    } finally {
      setSaving(false);
    }
  };

  const getSuccessMessage = () => {
    if (summary.recordsCount > 0) {
      return "עבודה מדהימה! שיאים חדשים! 🔥";
    }
    if (summary.exerciseCount >= 5) {
      return "Excellent Work! Keep it up! 💪";
    }
    return "Great Job! Perfect Workout! 🎉";
  };

  const getSuccessEmoji = () => {
    if (summary.recordsCount >= 3) return "👑";
    if (summary.recordsCount > 0) return "🔥";
    if (summary.exerciseCount >= 5) return "💪";
    return "🎉";
  };

  // Calculate achievements
  const achievements = [];
  if (summary.recordsCount > 0) {
    achievements.push({
      icon: Trophy,
      label: "Record Breaker",
      description: `${summary.recordsCount} שיאים חדשים!`,
      color: "bg-gradient-to-br from-[#FF8A00] to-[#FF6B00]"
    });
  }
  if (summary.exerciseCount >= 6) {
    achievements.push({
      icon: Flame,
      label: "Beast Mode",
      description: "סיימת 6+ תרגילים",
      color: "bg-gradient-to-br from-[#EF4444] to-[#DC2626]"
    });
  }
  if (summary.totalWeight >= 1000) {
    achievements.push({
      icon: Zap,
      label: "Power Lifter",
      description: `${Math.round(summary.totalWeight)} ק"ג סה"כ`,
      color: "bg-gradient-to-br from-[#5B7FFF] to-[#4A5FCC]"
    });
  }

  if (loading) {
    return (
      <LoadingSpinner 
        fullScreen 
        text="טוען סיכום..." 
        size="lg"
        className="bg-[#1A1D2E]"
      />
    );
  }

  if (!workoutData) {
    return (
      <div className="min-h-screen bg-[#1A1D2E] bg-texture flex items-center justify-center p-6">
        <div className="text-center slide-up">
          <div className="w-20 h-20 bg-[#2D3142] rounded-2xl flex items-center justify-center mb-6 mx-auto"
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}
          >
            <Trophy className="w-10 h-10 text-[#9CA3AF]" />
          </div>
          <p className="text-[#9CA3AF] mb-6 font-outfit font-normal text-lg">אין נתוני אימון</p>
          <Link href="/trainee/workout">
            <Button className="bg-[#5B7FFF] hover:bg-[#6B8EFF] text-white font-outfit font-semibold rounded-xl h-12 px-8 hover:scale-105 transition-transform"
              style={{ boxShadow: '0 4px 16px rgba(91, 127, 255, 0.4)' }}
            >
              חזרה לאימון
            </Button>
          </Link>
        </div>
      </div>
    );
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
        
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        
        @keyframes firework {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-200px) scale(1); opacity: 0; }
        }
        
        @keyframes fireworkSpark {
          0% { opacity: 1; transform: rotate(0deg) translateY(-40px); }
          100% { opacity: 0; transform: rotate(0deg) translateY(-80px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        
        .slide-up {
          animation: slideUp 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-confetti {
          animation: confetti linear forwards;
        }
        
        .animate-firework {
          animation: firework 1.5s ease-out forwards;
        }
        
        .pulse-animation {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4) !important;
        }
        
        .bg-texture {
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(91, 127, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(91, 127, 255, 0.02) 0%, transparent 50%);
        }
      `}</style>

      <div className="relative bg-[#1A1D2E] w-full min-h-screen bg-texture">
        {/* Celebrations */}
        {showConfetti && <Confetti intense={summary.recordsCount > 0} />}
        {showFireworks && <Fireworks />}
        
        {/* Main Content */}
        <div className="w-full overflow-y-auto pb-24">
          <div className="w-full max-w-[393px] mx-auto px-5 pt-12">
            <div className="flex flex-col items-start w-full gap-6">
              
              {/* Header */}
              <div className="w-full flex items-center justify-between animate-fade-in">
                <Link 
                  href="/trainee/dashboard" 
                  className="w-12 h-12 bg-[#2D3142] rounded-full flex items-center justify-center hover:bg-[#3D4058] transition-all hover:scale-110"
                  style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)' }}
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <h1 className="text-2xl font-outfit font-bold text-white">
                  סיכום אימון
                </h1>
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF8A00] to-[#FF6B00] rounded-full flex items-center justify-center pulse-animation"
                  style={{ boxShadow: '0 4px 20px rgba(255, 138, 0, 0.4)' }}
                >
                  <Trophy className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Success Card */}
              <div className={cn(
                "w-full rounded-2xl p-8 text-center slide-up relative overflow-hidden",
                summary.recordsCount > 0 
                  ? "bg-gradient-to-br from-[#FF8A00] to-[#FF6B00]" 
                  : "bg-gradient-to-br from-[#4CAF50] to-[#45A049]"
              )}
                style={{ 
                  animationDelay: '100ms',
                  boxShadow: summary.recordsCount > 0
                    ? '0 12px 48px rgba(255, 138, 0, 0.5)'
                    : '0 12px 48px rgba(76, 175, 80, 0.5)'
                }}
              >
                <div className="absolute inset-0 bg-white/10" />
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="text-6xl mb-2 pulse-animation">
                    {getSuccessEmoji()}
                  </div>
                  <div>
                    <h2 className="text-3xl font-outfit font-bold text-white mb-3">
                      {getSuccessMessage()}
                    </h2>
                    {summary.recordsCount > 0 && (
                      <div className="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                        <Crown className="w-5 h-5 text-white" />
                        <span className="text-xl text-white font-outfit font-bold">
                          {summary.recordsCount} שיא{summary.recordsCount > 1 ? 'ים' : ''} חדש{summary.recordsCount > 1 ? 'ים' : ''}!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="w-full bg-[#2D3142] rounded-2xl p-4 slide-up"
                style={{ 
                  animationDelay: '200ms',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                }}
              >
                <div className="grid grid-cols-3 gap-3">
                  <StatsCard
                    icon={Timer}
                    value={`${summary.duration.split(':')[1]}:${summary.duration.split(':')[2]}`}
                    label="משך זמן"
                    bgColor="bg-[#1A1D2E]"
                    iconBg="bg-[#5B7FFF]"
                    delay={300}
                  />
                  
                  <StatsCard
                    icon={Target}
                    value={summary.exerciseCount}
                    label="תרגילים"
                    bgColor="bg-[#1A1D2E]"
                    iconBg="bg-[#FF8A00]"
                    delay={350}
                    animated
                  />
                  
                  <StatsCard
                    icon={Trophy}
                    value={summary.recordsCount}
                    label="שיאים"
                    bgColor="bg-[#FF8A00]"
                    iconBg="bg-white/20"
                    delay={400}
                    highlight={summary.recordsCount > 0}
                    animated
                  />
                </div>
                
                {/* Volume Bar */}
                <div className="mt-4 pt-4 border-t border-[#3D4058]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[#9CA3AF] font-outfit">נפח אימון</span>
                    <span className="text-sm text-[#5B7FFF] font-outfit font-semibold">
                      {Math.round(summary.totalWeight)} ק"ג
                    </span>
                  </div>
                  <div className="relative w-full h-3 bg-[#1A1D2E] rounded-full overflow-hidden"
                    style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)' }}
                  >
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#5B7FFF] to-[#4A5FCC] rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${summary.volumePercent}%`,
                        boxShadow: '0 0 12px rgba(91, 127, 255, 0.6)'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Achievements */}
              {achievements.length > 0 && (
                <div className="w-full flex flex-col gap-3">
                  <h2 className="text-lg font-outfit font-bold text-white slide-up" style={{ animationDelay: '450ms' }}>
                    🏆 הישגים
                  </h2>
                  {achievements.map((achievement, index) => (
                    <AchievementBadge
                      key={index}
                      icon={achievement.icon}
                      label={achievement.label}
                      description={achievement.description}
                      color={achievement.color}
                      delay={500 + index * 50}
                    />
                  ))}
                </div>
              )}

              {/* Personal Records Card */}
              {summary.personalRecords.length > 0 && (
                <div className="w-full bg-gradient-to-br from-[#FF8A00] to-[#FF6B00] rounded-2xl p-5 slide-up relative overflow-hidden"
                  style={{ 
                    animationDelay: '550ms',
                    boxShadow: '0 12px 48px rgba(255, 138, 0, 0.5)'
                  }}
                >
                  <div className="absolute inset-0 bg-white/5" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-xl font-outfit font-bold text-white">
                        שיאים אישיים חדשים! 🔥
                      </h2>
                    </div>
                    <div className="flex flex-col gap-3">
                      {summary.personalRecords.map((record, index) => (
                        <div 
                          key={index} 
                          className="bg-white/20 backdrop-blur-sm rounded-xl p-4 hover-lift transition-all"
                          style={{ 
                            animationDelay: `${600 + index * 50}ms`,
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="bg-white/20 p-2 rounded-lg">
                                <Medal className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="text-white font-outfit font-bold text-base">
                                  {record.exercise}
                                </p>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <span className="text-white font-outfit font-bold text-xl">
                                    {record.weight} kg
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <ArrowUp className="w-4 h-4 text-white" />
                                    <span className="text-white/70 text-sm line-through font-outfit font-normal">
                                      {record.previousWeight} kg
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Sparkles className="h-7 w-7 text-white pulse-animation" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Exercises Card */}
              <div className="w-full bg-[#2D3142] rounded-2xl p-5 slide-up"
                style={{ 
                  animationDelay: '650ms',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <div className="bg-[#4CAF50] p-2 rounded-lg"
                    style={{ boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)' }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-outfit font-bold text-white">
                    תרגילים שהושלמו
                  </h2>
                </div>
                <div className="flex flex-col gap-4">
                  {summary.completedExercises.map((exercise, index) => {
                    const hasPrevious = exercise.previousWeight !== undefined;
                    const previousWeight = exercise.previousWeight || 0;
                    const isImprovement = hasPrevious && (exercise.isRecord || (exercise.weight > previousWeight) || (exercise.weight === previousWeight && exercise.reps > (exercise.previousReps || 0)));
                    const isNew = !hasPrevious;
                    
                    return (
                      <div 
                        key={index} 
                        className="bg-[#1A1D2E] rounded-xl p-4 hover-lift transition-all"
                        style={{ 
                          animationDelay: `${700 + index * 40}ms`,
                          boxShadow: exercise.isRecord 
                            ? '0 4px 20px rgba(255, 138, 0, 0.3)' 
                            : '0 4px 16px rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle2 className="h-5 w-5 text-[#4CAF50] flex-shrink-0" />
                              <h3 className="text-lg font-outfit font-bold text-white">
                                {exercise.name}
                              </h3>
                            </div>
                            {exercise.isRecord && (
                              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#FF8A00] to-[#FF6B00] text-white px-3 py-1.5 rounded-lg text-xs font-outfit font-semibold mb-3 animate-fade-in"
                                style={{ boxShadow: '0 4px 12px rgba(255, 138, 0, 0.4)' }}
                              >
                                <Trophy className="w-3.5 h-3.5" />
                                New Record!
                              </div>
                            )}
                            <div className="flex items-center gap-4 flex-wrap">
                              <div>
                                <p className="text-xs text-[#9CA3AF] font-outfit font-medium mb-1.5">
                                  Weight × Reps
                                </p>
                                <p className="text-xl font-outfit font-bold text-white">
                                  {exercise.weight}{" "}
                                  <span className="text-sm text-[#9CA3AF]">kg</span> × {exercise.reps}
                                </p>
                              </div>
                              {hasPrevious && (
                                <div className="flex flex-col gap-1.5">
                                  {isImprovement ? (
                                    <div className="flex items-center gap-1.5 text-[#4CAF50]">
                                      <TrendingUp className="w-4 h-4" />
                                      <span className="text-sm font-outfit font-semibold">
                                        Improved!
                                      </span>
                                    </div>
                                  ) : exercise.weight < previousWeight ? (
                                    <div className="flex items-center gap-1.5 text-[#EF4444]">
                                      <ArrowDown className="w-4 h-4" />
                                      <span className="text-sm font-outfit font-semibold">
                                        Decreased
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-[#9CA3AF]">
                                      <span className="text-sm font-outfit font-semibold">Same</span>
                                    </div>
                                  )}
                                  <span className="text-xs text-[#9CA3AF] font-outfit font-normal">
                                    Previous: {exercise.previousWeight || 0} kg × {exercise.previousReps || 0}
                                  </span>
                                </div>
                              )}
                              {isNew && (
                                <div className="bg-[#5B7FFF]/20 text-[#5B7FFF] px-3 py-1.5 rounded-lg text-xs font-outfit font-semibold flex items-center gap-1.5">
                                  <Star className="w-3.5 h-3.5" />
                                  פעם ראשונה
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col w-full gap-4 slide-up" style={{ animationDelay: '800ms' }}>
                <Button
                  className="w-full bg-[#5B7FFF] hover:bg-[#6B8EFF] text-white font-outfit font-bold h-16 rounded-xl transition-all text-lg hover:scale-105"
                  onClick={handleSaveWorkout}
                  disabled={saving}
                  style={{ boxShadow: '0 8px 32px rgba(91, 127, 255, 0.4)' }}
                >
                  <div className="flex items-center gap-3">
                    {saving ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>מעביר...</span>
                      </>
                    ) : (
                      <>
                        <Home className="w-6 h-6" />
                        <span>חזרה לבית</span>
                      </>
                    )}
                  </div>
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    className="w-full bg-[#2D3142] hover:bg-[#3D4058] text-white font-outfit font-semibold h-12 rounded-xl transition-all hover:scale-105"
                    onClick={() => router.push('/trainee/workouts')}
                    style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)' }}
                  >
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4" />
                      <span>אימון נוסף</span>
                    </div>
                  </Button>
                  
                  <Button
                    className="w-full bg-[#2D3142] hover:bg-[#3D4058] text-[#5B7FFF] font-outfit font-semibold h-12 rounded-xl transition-all hover:scale-105"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: "Workout Summary",
                          text: `סיימתי עכשיו ${summary.exerciseCount} תרגילים ב-${summary.duration}! ${summary.recordsCount > 0 ? `${summary.recordsCount} שיאים חדשים! 🔥` : '💪'}`,
                        }).catch(console.error);
                      } else {
                        showToast('📋 Copied to clipboard!', "success", 2000);
                        navigator.clipboard.writeText(
                          `סיימתי עכשיו ${summary.exerciseCount} תרגילים! ${summary.recordsCount > 0 ? `${summary.recordsCount} שיאים חדשים! 🔥` : '💪'}`
                        );
                      }
                    }}
                    style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)' }}
                  >
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4" />
                      <span>שתף</span>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function WorkoutSummary() {
  return <WorkoutSummaryContent />;
}