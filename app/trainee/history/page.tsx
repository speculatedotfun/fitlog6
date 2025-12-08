"use client";

import { useState, useEffect, useMemo } from "react";
import { Share2, Clock, Flame, Crown, Star, TrendingUp, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { getWorkoutLogs } from "@/lib/db";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function ProgressPage() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleDateString('en-US', { month: 'short' }));
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Load workout logs
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
    try {
      setLoading(true);
        const logs = await getWorkoutLogs(user.id, 365); // Last year
        setWorkoutLogs(logs || []);
      } catch (err) {
        console.error("Error loading progress data:", err);
    } finally {
      setLoading(false);
    }
  };

    loadData();
  }, [user?.id]);

  // Calculate stats for selected month
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

    // Calculate workout sets (number of completed workouts)
    const workoutSets = monthLogs.length;

    // Calculate total time
    const totalSeconds = monthLogs.reduce((total, log: any) => {
      if (log.duration_seconds) {
        return total + log.duration_seconds;
      } else if (log.start_time && log.end_time) {
        const start = new Date(log.start_time).getTime();
        const end = new Date(log.end_time).getTime();
        return total + ((end - start) / 1000);
      }
      return total + (45 * 60); // Default 45 minutes
    }, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const totalTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Calculate burned calories (~9 calories per minute)
    const totalMinutes = totalSeconds / 60;
    const burnedCalories = Math.round(totalMinutes * 9).toString();

    // Calculate collected points (10 points per workout)
    const collectedPoints = (workoutSets * 10).toLocaleString();

    // Calculate distance (estimate: ~0.1 km per minute of workout)
    const distanceKm = Math.round((totalMinutes * 0.1) * 10) / 10;

    // Calculate steps (estimate: ~120 steps per minute)
    const steps = Math.round(totalMinutes * 120);

    // Average heart rate (estimate based on workout intensity)
    const heartRate = workoutSets > 0 ? 105 : 72;

    // Calculate distance graph data (weekly breakdown)
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

    // Last month distance for comparison
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

  if (loading) {
    return <LoadingSpinner fullScreen text="טוען דוח התקדמות..." size="lg" />;
  }

  if (!monthStats) {
    return (
      <div className="relative bg-[#1A1D2E] w-full min-h-screen flex items-center justify-center">
        <p className="text-[#9CA3AF]">אין נתונים זמינים</p>
      </div>
    );
  }

  const { workoutSets, totalTime, burnedCalories, collectedPoints, distanceKm, lastMonthDistance, steps, heartRate, distanceGraphData } = monthStats;

  const handleShare = () => {
    if (navigator.share && monthStats) {
      navigator.share({
        title: "דוח התקדמות",
        text: `ההתקדמות שלי ל-${selectedMonth}: ${workoutSets} סטי אימון, ${totalTime} זמן כולל`,
      }).catch(console.error);
    }
  };

    return (
    <div className="relative bg-[#1A1D2E] w-full min-h-screen">
      {/* Main Content */}
      <div className="w-full overflow-y-auto pb-24">
        <div className="w-full max-w-[393px] mx-auto px-5 pt-12">
          <div className="flex flex-col items-start w-full gap-6">
            
            {/* Header with Title and Share Icon */}
            <div className="w-full flex items-center justify-between">
              <h1 className="text-[28px] font-outfit font-bold text-white">דוח התקדמות</h1>
              <button
                onClick={handleShare}
                className="w-10 h-10 bg-[#2D3142] rounded-full flex items-center justify-center hover:bg-[#3D4058] transition-colors"
              >
                <Share2 className="w-5 h-5 text-white" />
              </button>
      </div>

            {/* Month Tabs */}
            <div className="w-full flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {months.map((month) => (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(month)}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-sm font-outfit font-semibold transition-all flex-shrink-0",
                    selectedMonth === month
                      ? "bg-[#5B7FFF] text-white"
                      : "bg-[#2D3142] text-[#9CA3AF] hover:text-white hover:bg-[#3D4058]"
                  )}
                >
                  {month}
                </button>
              ))}
            </div>

            {/* Top Stats Section */}
            <div className="w-full flex gap-4">
              {/* Large Circle - Workout Sets */}
              <div className="flex-shrink-0 w-36 h-36 rounded-full bg-gradient-to-br from-[#EF4444] to-[#DC2626] flex flex-col items-center justify-center shadow-lg shadow-red-500/30">
                <div className="text-white text-4xl font-outfit font-bold">{workoutSets}</div>
                <div className="text-white text-sm font-outfit font-medium mt-1">סטי אימון</div>
              </div>

              {/* Right Stats */}
              <div className="flex-1 flex flex-col gap-3">
                {/* Total Time */}
                <div className="flex items-center gap-3 bg-[#2D3142] rounded-xl p-3">
                  <div className="w-11 h-11 bg-[#4CAF50] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-white" />
              </div>
                  <div className="flex flex-col">
                    <div className="text-white text-lg font-outfit font-bold">{totalTime}</div>
                    <div className="text-[#9CA3AF] text-xs font-outfit font-medium">זמן כולל</div>
            </div>
            </div>

                {/* Burned Calories */}
                <div className="flex items-center gap-3 bg-[#2D3142] rounded-xl p-3">
                  <div className="w-11 h-11 bg-[#FF8A00] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Flame className="w-5 h-5 text-white" />
              </div>
                  <div className="flex flex-col">
                    <div className="text-white text-lg font-outfit font-bold">{burnedCalories} cal</div>
                    <div className="text-[#9CA3AF] text-xs font-outfit font-medium">נשרף</div>
            </div>
            </div>

                {/* Collected Points */}
                <div className="flex items-center gap-3 bg-[#2D3142] rounded-xl p-3">
                  <div className="w-11 h-11 bg-[#9C27B0] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Crown className="w-5 h-5 text-white" />
              </div>
                  <div className="flex flex-col">
                    <div className="text-white text-lg font-outfit font-bold">{collectedPoints}</div>
                    <div className="text-[#9CA3AF] text-xs font-outfit font-medium">נקודות</div>
            </div>
            </div>
      </div>
              </div>

            {/* Distance Covered Section */}
            <div className="w-full bg-gradient-to-br from-[#4CAF50] to-[#45A049] rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-white" />
                <div className="text-white text-sm font-outfit font-bold uppercase tracking-wide">אתה על המסלול</div>
                </div>
              <div className="mb-4">
                <div className="text-white text-xl font-outfit font-bold mb-1">
                  {distanceKm} km
              </div>
                <div className="text-white/90 text-sm font-outfit font-medium">
                  מרחק שנכסה ב-{selectedMonth}
                  </div>
                <div className="text-white/70 text-sm font-outfit font-normal mt-1">
                  לעומת {lastMonthDistance}ק"מ בתאריך זה בחודש שעבר
              </div>
            </div>
              
              {/* Line Graph */}
              <div className="w-full h-32 relative bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="white" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  <polyline
                    points={distanceGraphData.map((d, i) => {
                      const x = (i / (distanceGraphData.length - 1)) * 100;
                      const y = 100 - (d.y / 25) * 100;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Markers */}
                  {distanceGraphData.map((d, i) => {
                    const x = (i / (distanceGraphData.length - 1)) * 100;
                    const y = 100 - (d.y / 25) * 100;
                  return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="white"
                        stroke="rgba(255,255,255,0.5)"
                        strokeWidth="2"
                      />
                  );
                  })}
                </svg>
                      </div>
                    </div>

            {/* Bottom Stats Section */}
            <div className="w-full grid grid-cols-2 gap-4">
              {/* Steps Card */}
              <div className="bg-[#2D3142] rounded-2xl p-4 flex flex-col items-center gap-4">
                <div className="text-[#9CA3AF] text-sm font-outfit font-medium">צעדים</div>
                <div className="relative w-28 h-28">
                  <svg className="w-28 h-28 transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      fill="none"
                      stroke="#3D4058"
                      strokeWidth="10"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      fill="none"
                      stroke="#5B7FFF"
                      strokeWidth="10"
                      strokeDasharray={`${(steps / 250000) * 301.6} 301.6`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-[#5B7FFF] text-xl font-outfit font-bold">{steps.toLocaleString()}</div>
                    <div className="text-[#9CA3AF] text-xs font-outfit font-medium mt-1">צעדים</div>
                                </div>
                              </div>
                          </div>

              {/* Heart Rate Card */}
              <div className="bg-[#2D3142] rounded-2xl p-4 flex flex-col gap-3">
                <div className="text-[#9CA3AF] text-sm font-outfit font-medium">דופק</div>
                {/* Heart rate line graph */}
                <div className="flex-1 flex items-center justify-center" style={{ height: '80px' }}>
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
                    />
                  </svg>
              </div>
                <div className="flex flex-col items-center">
                  <div className="text-[#5B7FFF] text-2xl font-outfit font-bold">{heartRate}</div>
                    <div className="text-[#9CA3AF] text-xs font-outfit font-medium">פעימות לדקה</div>
            </div>
                    </div>
                  </div>

                    </div>
                  </div>
                </div>
    </div>
  );
}