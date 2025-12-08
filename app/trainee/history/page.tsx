"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Share2, Clock, Flame, Crown, Star, TrendingUp, Activity,
  Award, Target, Zap, ChevronDown, Calendar
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { getWorkoutLogs } from "@/lib/db";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

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

  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;

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
// STAT CARD COMPONENT
// ============================================
const StatCard = ({
  icon: Icon,
  value,
  label,
  color,
  delay = 0
}: {
  icon: any;
  value: string;
  label: string;
  color: string;
  delay?: number;
}) => (
  <div 
    className="flex items-center gap-3 bg-[#2D3142] rounded-xl p-3 hover-lift transition-all slide-up"
    style={{ 
      animationDelay: `${delay}ms`,
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
    }}
  >
    <div 
      className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}
      style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }}
    >
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div className="flex flex-col">
      <div className="text-white text-lg font-outfit font-bold">
        {value}
      </div>
      <div className="text-[#9CA3AF] text-xs font-outfit font-medium">
        {label}
      </div>
    </div>
  </div>
);

// ============================================
// ANIMATED LINE GRAPH COMPONENT
// ============================================
const AnimatedLineGraph = ({ 
  data, 
  color = "white",
  delay = 0
}: { 
  data: { x: number; y: number }[];
  color?: string;
  delay?: number;
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(100);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (data.length === 0) return null;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const maxY = Math.max(...data.map(d => d.y), 1);
    const y = 100 - (d.y / maxY) * 80;
    return { x, y };
  });

  const pathData = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
  ).join(' ');

  const pathLength = points.length * 30; // Approximate

  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Animated Line */}
      <path
        d={pathData}
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
        style={{
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength * (1 - progress / 100),
          transition: 'stroke-dashoffset 2s ease-out'
        }}
      />
      
      {/* Animated Markers */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="0"
          fill={color}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
          style={{
            animation: `markerPop 0.4s ease-out ${delay + 2000 + i * 100}ms forwards`
          }}
        />
      ))}
    </svg>
  );
};

// ============================================
// CIRCULAR PROGRESS COMPONENT
// ============================================
const CircularProgress = ({ 
  value, 
  max,
  size = 112,
  strokeWidth = 10,
  color = "#5B7FFF",
  label,
  delay = 0
}: { 
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label: string;
  delay?: number;
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(Math.min((value / max) * 100, 100));
    }, delay);
    return () => clearTimeout(timer);
  }, [value, max, delay]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg 
        className="transform -rotate-90"
        width={size} 
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#3D4058"
          strokeWidth={strokeWidth}
        />
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
          style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-xl font-outfit font-bold" style={{ color }}>
          <AnimatedCounter value={value} delay={delay} />
        </div>
        <div className="text-[#9CA3AF] text-xs font-outfit font-medium mt-1">
          {label}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function ProgressPage() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleDateString('en-US', { month: 'short' }));
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const logs = await getWorkoutLogs(user.id, 365);
        setWorkoutLogs(logs || []);
      } catch (err) {
        console.error("Error loading progress data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const monthStats = useMemo(() => {
    const monthIndex = months.indexOf(selectedMonth);
    if (monthIndex === -1) return null;

    const currentYear = new Date().getFullYear();
    const monthStart = new Date(currentYear, monthIndex, 1);
    const monthEnd = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59);

    const monthLogs = workoutLogs.filter(log => {
      const logDate = new Date(log.date || log.start_time);
      return logDate >= monthStart && logDate <= monthEnd && log.completed;
    });

    const workoutSets = monthLogs.length;

    const totalSeconds = monthLogs.reduce((total, log: any) => {
      if (log.duration_seconds) return total + log.duration_seconds;
      if (log.start_time && log.end_time) {
        const start = new Date(log.start_time).getTime();
        const end = new Date(log.end_time).getTime();
        return total + ((end - start) / 1000);
      }
      return total + (45 * 60);
    }, 0);
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const totalTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const totalMinutes = totalSeconds / 60;
    const burnedCalories = Math.round(totalMinutes * 9).toLocaleString();
    const collectedPoints = (workoutSets * 10).toLocaleString();
    const distanceKm = Math.round((totalMinutes * 0.1) * 10) / 10;
    const steps = Math.round(totalMinutes * 120);
    const heartRate = workoutSets > 0 ? 105 : 72;

    const weeksInMonth = Math.ceil(monthEnd.getDate() / 7);
    const distanceGraphData = Array.from({ length: weeksInMonth }, (_, i) => {
      const weekStart = new Date(currentYear, monthIndex, i * 7 + 1);
      const weekEnd = new Date(currentYear, monthIndex, Math.min((i + 1) * 7, monthEnd.getDate()));
      const weekLogs = monthLogs.filter(log => {
        const logDate = new Date(log.date || log.start_time);
        return logDate >= weekStart && logDate <= weekEnd;
      });
      const weekMinutes = weekLogs.reduce((total, log: any) => {
        if (log.duration_seconds) return total + (log.duration_seconds / 60);
        if (log.start_time && log.end_time) {
          const start = new Date(log.start_time).getTime();
          const end = new Date(log.end_time).getTime();
          return total + ((end - start) / (1000 * 60));
        }
        return total + 45;
      }, 0);
      return { x: i, y: Math.round((weekMinutes * 0.1) * 10) / 10 };
    });

    const lastMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
    const lastMonthYear = monthIndex === 0 ? currentYear - 1 : currentYear;
    const lastMonthStart = new Date(lastMonthYear, lastMonthIndex, 1);
    const lastMonthEnd = new Date(lastMonthYear, lastMonthIndex + 1, 0, 23, 59, 59);
    const lastMonthLogs = workoutLogs.filter(log => {
      const logDate = new Date(log.date || log.start_time);
      return logDate >= lastMonthStart && logDate <= lastMonthEnd && log.completed;
    });
    const lastMonthMinutes = lastMonthLogs.reduce((total, log: any) => {
      if (log.duration_seconds) return total + (log.duration_seconds / 60);
      if (log.start_time && log.end_time) {
        const start = new Date(log.start_time).getTime();
        const end = new Date(log.end_time).getTime();
        return total + ((end - start) / (1000 * 60));
      }
      return total + 45;
    }, 0);
    const lastMonthDistance = Math.round((lastMonthMinutes * 0.1) * 10) / 10;

    return {
      workoutSets,
      totalTime,
      burnedCalories,
      collectedPoints,
      distanceKm,
      lastMonthDistance,
      steps,
      heartRate,
      distanceGraphData,
    };
  }, [workoutLogs, selectedMonth, months]);

  const handleShare = () => {
    if (navigator.share && monthStats) {
      navigator.share({
        title: "דוח התקדמות",
        text: `ההתקדמות שלי ל-${selectedMonth}: ${monthStats.workoutSets} אימונים, ${monthStats.totalTime} זמן כולל, ${monthStats.distanceKm}km מרחק`,
      }).catch(console.error);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="טוען דוח התקדמות..." size="lg" />;
  }

  if (!monthStats) {
    return (
      <div className="relative bg-[#1A1D2E] w-full min-h-screen bg-texture flex items-center justify-center p-6">
        <div className="text-center slide-up">
          <div className="w-20 h-20 bg-[#2D3142] rounded-2xl flex items-center justify-center mb-6 mx-auto"
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}
          >
            <Activity className="w-10 h-10 text-[#9CA3AF]" />
          </div>
          <p className="text-[#9CA3AF] text-lg font-outfit">אין נתונים זמינים</p>
        </div>
      </div>
    );
  }

  const { workoutSets, totalTime, burnedCalories, collectedPoints, distanceKm, lastMonthDistance, steps, heartRate, distanceGraphData } = monthStats;
  const distanceChange = distanceKm - lastMonthDistance;
  const distanceChangePercent = lastMonthDistance > 0 ? Math.round((distanceChange / lastMonthDistance) * 100) : 0;

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
        
        @keyframes markerPop {
          from { r: 0; }
          to { r: 4; }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .slide-up {
          animation: slideUp 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
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
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .bg-texture {
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(91, 127, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(91, 127, 255, 0.02) 0%, transparent 50%);
        }
      `}</style>

      <div className="relative bg-[#1A1D2E] w-full min-h-screen bg-texture">
        <div className="w-full overflow-y-auto pb-24 scrollbar-hide">
          <div className="w-full max-w-[393px] mx-auto px-5 pt-12">
            <div className="flex flex-col items-start w-full gap-6">
              
              {/* Header */}
              <div className="w-full flex items-center justify-between animate-fade-in">
                <h1 className="text-[32px] font-outfit font-bold text-white">התקדמות</h1>
                <button
                  onClick={handleShare}
                  className="w-12 h-12 bg-[#2D3142] rounded-full flex items-center justify-center hover:bg-[#3D4058] transition-all hover:scale-110"
                  style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)' }}
                >
                  <Share2 className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Month Selector */}
              <div className="w-full slide-up" style={{ animationDelay: '100ms' }}>
                <button
                  onClick={() => setShowMonthPicker(!showMonthPicker)}
                  className="w-full bg-[#2D3142] rounded-xl px-4 py-3 flex items-center justify-between hover:bg-[#3D4058] transition-all"
                  style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)' }}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#5B7FFF]" />
                    <span className="text-white font-outfit font-semibold">{selectedMonth}</span>
                  </div>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-[#9CA3AF] transition-transform duration-300",
                    showMonthPicker && "rotate-180"
                  )} />
                </button>
                
                {showMonthPicker && (
                  <div className="mt-3 grid grid-cols-4 gap-2 animate-fade-in">
                    {months.map((month) => (
                      <button
                        key={month}
                        onClick={() => {
                          setSelectedMonth(month);
                          setShowMonthPicker(false);
                        }}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-outfit font-semibold transition-all",
                          selectedMonth === month
                            ? "bg-[#5B7FFF] text-white shadow-lg shadow-[#5B7FFF]/30"
                            : "bg-[#2D3142] text-[#9CA3AF] hover:text-white hover:bg-[#3D4058]"
                        )}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Hero Stats */}
              <div className="w-full flex gap-4 slide-up" style={{ animationDelay: '200ms' }}>
                {/* Large Circle */}
                <div 
                  className="flex-shrink-0 w-36 h-36 rounded-full bg-gradient-to-br from-[#EF4444] to-[#DC2626] flex flex-col items-center justify-center hover-lift transition-all pulse-animation"
                  style={{ boxShadow: '0 12px 48px rgba(239, 68, 68, 0.4)' }}
                >
                  <div className="text-white text-4xl font-outfit font-bold">
                    <AnimatedCounter value={workoutSets} delay={300} />
                  </div>
                  <div className="text-white text-sm font-outfit font-medium mt-1">
                    סטי אימון
                  </div>
                </div>

                {/* Right Stats */}
                <div className="flex-1 flex flex-col gap-3">
                  <StatCard
                    icon={Clock}
                    value={totalTime}
                    label="זמן כולל"
                    color="bg-[#4CAF50]"
                    delay={350}
                  />
                  <StatCard
                    icon={Flame}
                    value={`${burnedCalories} cal`}
                    label="נשרף"
                    color="bg-[#FF8A00]"
                    delay={400}
                  />
                  <StatCard
                    icon={Crown}
                    value={collectedPoints}
                    label="נקודות"
                    color="bg-[#9C27B0]"
                    delay={450}
                  />
                </div>
              </div>

              {/* Distance Card */}
              <div 
                className="w-full bg-gradient-to-br from-[#4CAF50] to-[#45A049] rounded-2xl p-6 slide-up relative overflow-hidden"
                style={{ 
                  animationDelay: '500ms',
                  boxShadow: '0 12px 48px rgba(76, 175, 80, 0.4)'
                }}
              >
                <div className="absolute inset-0 bg-white/5" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-white text-sm font-outfit font-bold uppercase tracking-wide">
                      אתה על המסלול
                    </div>
                  </div>
                  
                  <div className="mb-5">
                    <div className="text-white text-3xl font-outfit font-bold mb-2">
                      <AnimatedCounter value={distanceKm} suffix=" km" delay={600} />
                    </div>
                    <div className="text-white/90 text-sm font-outfit font-medium mb-2">
                      מרחק שנכסה ב-{selectedMonth}
                    </div>
                    {lastMonthDistance > 0 && (
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1",
                          distanceChange >= 0 ? "text-white" : "text-white/70"
                        )}>
                          {distanceChange >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingUp className="w-3 h-3 rotate-180" />
                          )}
                          <span className="text-xs font-outfit font-bold">
                            {Math.abs(distanceChangePercent)}%
                          </span>
                        </div>
                        <span className="text-white/70 text-xs font-outfit font-normal">
                          לעומת חודש שעבר ({lastMonthDistance}km)
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Animated Line Graph */}
                  <div className="w-full h-32 relative bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <AnimatedLineGraph 
                      data={distanceGraphData} 
                      color="white"
                      delay={700}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Stats */}
              <div className="w-full grid grid-cols-2 gap-4">
                {/* Steps Card */}
                <div 
                  className="bg-[#2D3142] rounded-2xl p-5 flex flex-col items-center gap-4 hover-lift transition-all slide-up"
                  style={{ 
                    animationDelay: '600ms',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <div className="text-[#9CA3AF] text-sm font-outfit font-medium">
                    צעדים
                  </div>
                  <CircularProgress
                    value={steps}
                    max={250000}
                    size={112}
                    strokeWidth={10}
                    color="#5B7FFF"
                    label="צעדים"
                    delay={800}
                  />
                </div>

                {/* Heart Rate Card */}
                <div 
                  className="bg-[#2D3142] rounded-2xl p-5 flex flex-col gap-4 hover-lift transition-all slide-up"
                  style={{ 
                    animationDelay: '650ms',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <div className="text-[#9CA3AF] text-sm font-outfit font-medium text-center">
                    דופק
                  </div>
                  
                  {/* Animated Heart Rate Graph */}
                  <div className="flex-1 flex items-center justify-center h-20">
                    <svg width="100%" height="100%" viewBox="0 0 100 60" className="overflow-visible">
                      <defs>
                        <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#5B7FFF" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#5B7FFF" stopOpacity="1" />
                        </linearGradient>
                      </defs>
                      <polyline
                        points="0,45 15,35 25,30 35,25 45,20 55,15 65,20 75,25 85,15 100,20"
                        fill="none"
                        stroke="url(#heartGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="pulse-animation"
                      />
                    </svg>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="text-[#5B7FFF] text-2xl font-outfit font-bold">
                      <AnimatedCounter value={heartRate} delay={900} />
                    </div>
                    <div className="text-[#9CA3AF] text-xs font-outfit font-medium">
                      פעימות לדקה
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievements Summary */}
              {workoutSets > 0 && (
                <div 
                  className="w-full bg-gradient-to-br from-[#5B7FFF] to-[#4A5FCC] rounded-2xl p-5 slide-up relative overflow-hidden"
                  style={{ 
                    animationDelay: '700ms',
                    boxShadow: '0 12px 48px rgba(91, 127, 255, 0.4)'
                  }}
                >
                  <div className="absolute inset-0 bg-white/5" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-white text-lg font-outfit font-bold">
                          חודש מעולה!
                        </div>
                        <div className="text-white/80 text-sm font-outfit">
                          {workoutSets} אימונים הושלמו
                        </div>
                      </div>
                    </div>
                    <Star className="w-8 h-8 text-white pulse-animation" />
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}