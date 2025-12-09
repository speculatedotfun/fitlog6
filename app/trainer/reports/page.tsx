"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { 
  Loader2, FileText, Download, Calendar,
  Users, BarChart3, Target, Activity, Award, AlertTriangle, Upload
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { 
  getTrainerTrainees, 
  getTrainerStats, 
  getTraineesWithStatus, 
  getWorkoutLogsForUsers,
  getBodyWeightHistoryForUsers,
  getWorkoutLogs,
  getBodyWeightHistory,
  getDailyNutritionLogsForUsers
} from "@/lib/db";
import { calculateTraineeStats } from "@/lib/trainee-stats";
import { calculatePRs, calculateNutritionStats } from "@/lib/reports-calculations";
import { useToast } from "@/components/ui/toast";
import type { User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TraineeReport {
  id: string;
  name: string;
  planName: string;
  status: 'active' | 'inactive';
  lastWorkout: string | null;
  compliance: number;
  totalWorkouts: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  averageWeight: number | null;
  weightChange: number | null;
  totalVolume: number;
  prsThisWeek?: number;
  prsThisMonth?: number;
  averageCalories?: number | null;
  averageProtein?: number | null;
  averageCarbs?: number | null;
  averageFat?: number | null;
  nutritionCompliance?: number;
}

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
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  subValue, 
  colorTheme = "blue",
  index = 0
}: any) => {
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
    indigo: {
      gradient: "from-[#6366F1] to-[#4F46E5]",
      shadow: "shadow-[0_8px_32px_rgba(99,102,241,0.4)]",
    },
  };
  
  const theme = themes[colorTheme as keyof typeof themes] || themes.blue;

  return (
    <div 
      className={cn(
        "bg-gradient-to-br rounded-xl p-4 relative overflow-hidden group hover:scale-105 transition-all duration-300 slide-up",
        theme.gradient,
        theme.shadow
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="absolute inset-0 bg-white/5" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xs font-outfit font-semibold text-white/80">{title}</h3>
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
        
        <div className="mt-auto">
          <div className="text-2xl font-outfit font-black text-white flex items-baseline gap-1">
            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
            {subValue && <span className="text-xs font-outfit font-semibold text-white/70">{subValue}</span>}
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 bg-white/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

// ============================================
// SKELETON COMPONENTS
// ============================================
function SkeletonStatCard() {
  return (
    <div className="bg-[#2D3142] rounded-xl p-4 animate-pulse" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>
      <div className="flex justify-between items-start mb-3">
        <Skeleton className="h-3 w-16 bg-[#3D4058]" />
        <Skeleton className="h-8 w-8 rounded-lg bg-[#3D4058]" />
      </div>
      <Skeleton className="h-6 w-12 bg-[#3D4058]" />
    </div>
  );
}

function SkeletonReportCard() {
  return (
    <div className="bg-[#2D3142] rounded-xl p-4 space-y-3 animate-pulse border border-[#3D4058]">
      <Skeleton className="h-6 w-3/4 bg-[#3D4058]" />
      <Skeleton className="h-4 w-1/2 bg-[#3D4058]" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-4 w-full bg-[#3D4058]" />
        <Skeleton className="h-4 w-full bg-[#3D4058]" />
        <Skeleton className="h-4 w-full bg-[#3D4058]" />
        <Skeleton className="h-4 w-full bg-[#3D4058]" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl bg-[#3D4058]" />
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
function ReportsContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploadingToDrive, setUploadingToDrive] = useState(false);
  const [reports, setReports] = useState<TraineeReport[]>([]);
  const [stats, setStats] = useState({
    activeTrainees: 0,
    workoutsToday: { completed: 0, total: 0 },
    averageCompliance: 0,
    alerts: 0,
  });
  const [timeFilter, setTimeFilter] = useState<"week" | "month" | "all">("month");
  const [traineeFilter, setTraineeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [complianceFilter, setComplianceFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [sortBy, setSortBy] = useState<"name" | "workouts" | "compliance" | "weight" | "lastWorkout">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isPending, startTransition] = useTransition();

  const trainerId = user?.id || "";
  const isLoading = loading || isPending;

  useEffect(() => {
    if (trainerId) {
      const controller = new AbortController();
      startTransition(() => {
        loadReports(controller.signal);
      });
      return () => controller.abort();
    }
  }, [trainerId, timeFilter, startTransition]);

  const loadReports = async (signal?: AbortSignal) => {
    if (!trainerId) return;
    if (signal?.aborted) return;

    try {
      setLoading(true);

      const [trainerStats, trainees] = await Promise.all([
        getTrainerStats(trainerId),
        getTrainerTrainees(trainerId),
      ]);

      if (signal?.aborted) return;

      setStats(trainerStats);

      if (trainees.length === 0) {
        setReports([]);
        setLoading(false);
        return;
      }

      const traineeIds = trainees.map(t => t.id);

      const now = new Date();
      let startDate: string | undefined;
      
      if (timeFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
      } else if (timeFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString().split('T')[0];
      }

      const [logsMap, weightsMap, statusData, nutritionLogsMap] = await Promise.all([
        getWorkoutLogsForUsers(traineeIds, startDate),
        getBodyWeightHistoryForUsers(traineeIds),
        getTraineesWithStatus(trainerId),
        getDailyNutritionLogsForUsers(traineeIds, startDate).catch(() => new Map()),
      ]);

      if (signal?.aborted) return;

      const reportsData: TraineeReport[] = trainees.map(trainee => {
        const logs = logsMap.get(trainee.id) || [];
        const weightHistory = weightsMap.get(trainee.id) || [];
        const nutritionLogs = nutritionLogsMap.get(trainee.id) || [];
        const traineeStatus = statusData.find(s => s.id === trainee.id);

        const stats = calculateTraineeStats(logs, weightHistory, timeFilter);
        const prs = calculatePRs(logs, timeFilter);
        const nutritionStats = calculateNutritionStats(nutritionLogs, timeFilter);

        return {
          id: trainee.id,
          name: trainee.name,
          planName: traineeStatus?.planName || "אין תוכנית",
          status: traineeStatus?.status || 'inactive',
          lastWorkout: traineeStatus?.lastWorkout || null,
          compliance: traineeStatus?.compliance || 0,
          totalWorkouts: stats.totalWorkouts,
          workoutsThisWeek: stats.workoutsThisWeek,
          workoutsThisMonth: stats.workoutsThisMonth,
          averageWeight: stats.averageWeight,
          weightChange: stats.weightChange,
          totalVolume: stats.totalVolume,
          prsThisWeek: prs.prsThisWeek,
          prsThisMonth: prs.prsThisMonth,
          averageCalories: nutritionStats.averageCalories,
          averageProtein: nutritionStats.averageProtein,
          averageCarbs: nutritionStats.averageCarbs,
          averageFat: nutritionStats.averageFat,
          nutritionCompliance: nutritionStats.nutritionCompliance,
        };
      });

      setReports(reportsData);
    } catch (error: any) {
      console.error("Error loading reports:", error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "אין";
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const exportReport = async () => {
    const headers = [
      "שם המתאמן",
      "תוכנית אימונים",
      "סטטוס",
      "אימונים (סה\"כ)",
      "אימונים (שבוע)",
      "אימונים (חודש)",
      "התאמה (%)",
      "משקל ממוצע (ק\"ג)",
      "שינוי משקל (ק\"ג)",
      "אימון אחרון"
    ];

    const columnWidths = [20, 25, 12, 15, 15, 15, 12, 18, 18, 15];

    const rows = reports.map(r => [
      r.name,
      r.planName,
      r.status === 'active' ? 'פעיל' : 'לא פעיל',
      String(r.totalWorkouts),
      String(r.workoutsThisWeek),
      String(r.workoutsThisMonth),
      String(r.compliance),
      r.averageWeight ? String(r.averageWeight.toFixed(1)) : "אין",
      r.weightChange !== null ? `${r.weightChange > 0 ? '+' : ''}${r.weightChange.toFixed(1)}` : "אין",
      formatDate(r.lastWorkout)
    ]);

    const summaryRows = [
      { label: 'מתאמנים פעילים:', value: String(stats.activeTrainees) },
      { label: 'אימונים היום:', value: `${stats.workoutsToday.completed} מתוך ${stats.workoutsToday.total}` },
      { label: 'התאמה ממוצעת:', value: `${stats.averageCompliance}%` },
      { label: 'התראות:', value: String(stats.alerts) },
      { label: 'תקופה:', value: timeFilter === 'week' ? 'שבוע אחרון' : timeFilter === 'month' ? 'חודש אחרון' : 'כל הזמנים' }
    ];

    const filename = `דוח_כללי_${new Date().toISOString().split('T')[0]}.xlsx`;

    try {
      const { createExcelFromRows } = await import("@/lib/excel-export");

      createExcelFromRows(headers, rows, filename, {
        columnWidths,
        sheetName: 'דוח כללי',
        rtl: true,
        title: 'דוח כללי - מתאמנים',
        subtitle: `תאריך: ${new Date().toLocaleDateString('he-IL')}`,
        summaryRows
      });
      showToast("✅ הדוח יוצא בהצלחה", "success");
    } catch (error: any) {
      console.error("Error exporting report:", error);
      showToast("❌ שגיאה בייצוא הדוח", "error");
    }
  };

  const exportReportToGoogleDrive = async () => {
    try {
      setUploadingToDrive(true);
      const { createExcelBuffer, uploadToGoogleDrive } = await import("@/lib/google-drive-export");

      const headers = [
        "שם המתאמן",
        "תוכנית אימונים",
        "סטטוס",
        "אימונים (סה\"כ)",
        "אימונים (שבוע)",
        "אימונים (חודש)",
        "התאמה (%)",
        "משקל ממוצע (ק\"ג)",
        "שינוי משקל (ק\"ג)",
        "אימון אחרון"
      ];

      const columnWidths = [20, 25, 12, 15, 15, 15, 12, 18, 18, 15];

      const rows = reports.map(r => [
        r.name,
        r.planName,
        r.status === 'active' ? 'פעיל' : 'לא פעיל',
        String(r.totalWorkouts),
        String(r.workoutsThisWeek),
        String(r.workoutsThisMonth),
        String(r.compliance),
        r.averageWeight ? String(r.averageWeight.toFixed(1)) : "אין",
        r.weightChange !== null ? `${r.weightChange > 0 ? '+' : ''}${r.weightChange.toFixed(1)}` : "אין",
        formatDate(r.lastWorkout)
      ]);

      const summaryRows = [
        { label: 'מתאמנים פעילים:', value: String(stats.activeTrainees) },
        { label: 'אימונים היום:', value: `${stats.workoutsToday.completed} מתוך ${stats.workoutsToday.total}` },
        { label: 'התאמה ממוצעת:', value: `${stats.averageCompliance}%` },
        { label: 'התראות:', value: String(stats.alerts) },
        { label: 'תקופה:', value: timeFilter === 'week' ? 'שבוע אחרון' : timeFilter === 'month' ? 'חודש אחרון' : 'כל הזמנים' }
      ];

      const filename = `דוח_כללי_${new Date().toISOString().split('T')[0]}.xlsx`;

      const buffer = createExcelBuffer([{
        name: 'דוח כללי',
        title: 'דוח כללי - מתאמנים',
        subtitle: `תאריך: ${new Date().toLocaleDateString('he-IL')}`,
        summaryRows,
        headers,
        rows,
        columnWidths
      }], true);

      const result = await uploadToGoogleDrive(buffer, filename);

      if (result.success) {
        showToast("✅ הדוח הועלה ל-Google Drive!", "success");
      } else {
        if (result.error?.includes('setupRequired') || result.error?.includes('לא מוגדרים')) {
          showToast("⚠️ נדרשת הגדרת Google Drive", "warning");
        } else {
          showToast("❌ שגיאה בהעלאת הדוח", "error");
        }
      }
    } catch (error: any) {
      console.error("Error exporting to Google Drive:", error);
      showToast("❌ שגיאה בייצוא", "error");
    } finally {
      setUploadingToDrive(false);
    }
  };

  const exportTraineeReport = async (report: TraineeReport) => {
    try {
      const now = new Date();
      let startDate: string | undefined;
      let periodLabel = '';

      if (timeFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
        periodLabel = 'שבוע אחרון';
      } else if (timeFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString().split('T')[0];
        periodLabel = 'חודש אחרון';
      } else {
        periodLabel = 'כל הזמנים';
      }

      const [logs, weightHistory] = await Promise.all([
        getWorkoutLogs(report.id, undefined, startDate),
        getBodyWeightHistory(report.id),
      ]);

      const { createExcelWithSheets } = await import("@/lib/excel-export");

      const completedLogs = logs.filter(log => log.completed);

      const sheets: Array<{
        name: string;
        title?: string;
        subtitle?: string;
        summaryRows?: Array<{ label: string; value: string }>;
        headers: string[];
        rows: (string | number | null | undefined)[][];
        columnWidths?: number[];
      }> = [];

      if (completedLogs.length > 0) {
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);

        const exerciseStats = new Map<string, {
          name: string;
          workoutCount: number;
          totalSets: number;
          maxWeight: number;
          minWeight: number;
          lastMonthMaxWeight: number;
          previousMonthMaxWeight: number;
          lastWorkoutDate: string;
        }>();

        completedLogs.forEach(log => {
          const logDate = log.date || '';
          const logDateObj = new Date(logDate);

          if (log.set_logs && log.set_logs.length > 0) {
            const exercisesInWorkout = new Set<string>();
            
            log.set_logs.forEach((setLog) => {
              const exerciseName = setLog.exercise?.name || 'תרגיל לא ידוע';
              const exerciseId = setLog.exercise_id || exerciseName;
              
              if (!exerciseStats.has(exerciseId)) {
                exerciseStats.set(exerciseId, {
                  name: exerciseName,
                  workoutCount: 0,
                  totalSets: 0,
                  maxWeight: 0,
                  minWeight: Infinity,
                  lastMonthMaxWeight: 0,
                  previousMonthMaxWeight: 0,
                  lastWorkoutDate: ''
                });
              }

              const stats = exerciseStats.get(exerciseId)!;
              
              if (!exercisesInWorkout.has(exerciseId)) {
                exercisesInWorkout.add(exerciseId);
                stats.workoutCount++;
              }

              stats.totalSets++;
              const weight = setLog.weight_kg || 0;
              
              if (weight > 0) {
                if (weight > stats.maxWeight) {
                  stats.maxWeight = weight;
                }
                if (weight < stats.minWeight) {
                  stats.minWeight = weight;
                }

                if (logDateObj >= lastMonthStart && logDateObj <= lastMonthEnd) {
                  if (weight > stats.lastMonthMaxWeight) {
                    stats.lastMonthMaxWeight = weight;
                  }
                }

                if (logDateObj >= previousMonthStart && logDateObj <= previousMonthEnd) {
                  if (weight > stats.previousMonthMaxWeight) {
                    stats.previousMonthMaxWeight = weight;
                  }
                }
              }

              if (!stats.lastWorkoutDate || logDate > stats.lastWorkoutDate) {
                stats.lastWorkoutDate = logDate;
              }
            });
          }
        });

        const workoutHeaders = [
          "תרגיל",
          "מספר אימונים",
          "סטים ליום",
          "משקל מינימלי (ק\"ג)",
          "משקל מקסימלי (ק\"ג)",
          "שיפור החודש (ק\"ג)",
          "אימון אחרון"
        ];
        
        const workoutColumnWidths = [30, 15, 12, 18, 18, 18, 15];
        
        const workoutRows: (string | number | null | undefined)[][] = [];
        
        const sortedExercises = Array.from(exerciseStats.entries())
          .sort((a, b) => {
            const dateA = a[1].lastWorkoutDate;
            const dateB = b[1].lastWorkoutDate;
            return dateB.localeCompare(dateA);
          });

        sortedExercises.forEach(([exerciseId, stats]) => {
          const avgSetsPerDay = stats.workoutCount > 0
            ? (stats.totalSets / stats.workoutCount).toFixed(1)
            : '0';

          let monthlyImprovement = '';
          if (stats.lastMonthMaxWeight > 0 && stats.previousMonthMaxWeight > 0) {
            const improvement = stats.lastMonthMaxWeight - stats.previousMonthMaxWeight;
            monthlyImprovement = improvement > 0 
              ? `+${improvement.toFixed(1)}`
              : improvement.toFixed(1);
          } else if (stats.lastMonthMaxWeight > 0) {
            monthlyImprovement = `+${stats.lastMonthMaxWeight.toFixed(1)}`;
          } else {
            monthlyImprovement = 'אין נתונים';
          }

          const lastWorkoutFormatted = stats.lastWorkoutDate
            ? new Date(stats.lastWorkoutDate).toLocaleDateString('he-IL')
            : 'אין';

          const minWeightDisplay = (stats.minWeight !== Infinity && stats.minWeight > 0) 
            ? stats.minWeight.toFixed(1) 
            : 'אין';

          workoutRows.push([
            stats.name,
            String(stats.workoutCount),
            avgSetsPerDay,
            minWeightDisplay,
            stats.maxWeight > 0 ? stats.maxWeight.toFixed(1) : 'אין',
            monthlyImprovement,
            lastWorkoutFormatted
          ]);
        });

        if (sortedExercises.length > 0) {
          let totalExercises = sortedExercises.length;
          let totalWorkouts = 0;
          let totalSets = 0;
          let overallMaxWeight = 0;
          let overallMinWeight = Infinity;
          let totalMonthlyImprovement = 0;
          let exercisesWithImprovement = 0;

          sortedExercises.forEach(([exerciseId, stats]) => {
            totalWorkouts += stats.workoutCount;
            totalSets += stats.totalSets;
            
            if (stats.maxWeight > overallMaxWeight) {
              overallMaxWeight = stats.maxWeight;
            }
            
            if (stats.minWeight !== Infinity && stats.minWeight < overallMinWeight) {
              overallMinWeight = stats.minWeight;
            }

            if (stats.lastMonthMaxWeight > 0 && stats.previousMonthMaxWeight > 0) {
              const improvement = stats.lastMonthMaxWeight - stats.previousMonthMaxWeight;
              totalMonthlyImprovement += improvement;
              exercisesWithImprovement++;
            } else if (stats.lastMonthMaxWeight > 0) {
              totalMonthlyImprovement += stats.lastMonthMaxWeight;
              exercisesWithImprovement++;
            }
          });

          const avgSetsPerDayOverall = totalWorkouts > 0 
            ? (totalSets / totalWorkouts).toFixed(1)
            : '0';

          const avgMonthlyImprovement = exercisesWithImprovement > 0
            ? (totalMonthlyImprovement / exercisesWithImprovement).toFixed(1)
            : '0';

          const overallMinWeightDisplay = overallMinWeight !== Infinity && overallMinWeight > 0
            ? overallMinWeight.toFixed(1)
            : 'אין';

          workoutRows.push([]);
          
          workoutRows.push([
            'סיכום',
            String(totalExercises),
            avgSetsPerDayOverall,
            overallMinWeightDisplay,
            overallMaxWeight > 0 ? overallMaxWeight.toFixed(1) : 'אין',
            avgMonthlyImprovement !== '0' 
              ? (parseFloat(avgMonthlyImprovement) > 0 ? `+${avgMonthlyImprovement}` : avgMonthlyImprovement)
              : 'אין נתונים',
            '-'
          ]);
        }

        const workoutSummaryRows = [
          { label: 'שם המתאמן:', value: report.name },
          { label: 'תוכנית אימונים:', value: report.planName },
          { label: 'סטטוס:', value: report.status === 'active' ? 'פעיל' : 'לא פעיל' },
          { label: 'אימונים סה"כ:', value: String(report.totalWorkouts) },
          { label: 'אימונים השבוע:', value: String(report.workoutsThisWeek) },
          { label: 'אימונים החודש:', value: String(report.workoutsThisMonth) },
          { label: 'התאמה לתוכנית:', value: `${report.compliance}%` },
          { label: 'תקופה:', value: periodLabel }
        ];

        sheets.push({
          name: 'תרגילים',
          title: `דוח מפורט - ${report.name}`,
          subtitle: `תאריך: ${new Date().toLocaleDateString('he-IL')}`,
          summaryRows: workoutSummaryRows,
          headers: workoutHeaders,
          rows: workoutRows,
          columnWidths: workoutColumnWidths
        });
      }

      if (weightHistory.length > 0) {
        const weightHeaders = ["תאריך", "משקל (ק\"ג)", "שינוי (ק\"ג)"];
        const weightColumnWidths = [15, 18, 15];
        
        const weightRows: (string | number | null | undefined)[][] = [];
        weightHistory.forEach((w, index) => {
          const change = index > 0 ? (weightHistory[index - 1].weight - w.weight).toFixed(1) : '';
          weightRows.push([w.date, w.weight.toFixed(1), change]);
        });

        const weightSummaryRows = [
          { label: 'משקל ממוצע:', value: report.averageWeight ? `${report.averageWeight.toFixed(1)} ק"ג` : 'אין נתונים' },
          { label: 'שינוי משקל:', value: report.weightChange !== null 
            ? `${report.weightChange > 0 ? '+' : ''}${report.weightChange.toFixed(1)} ק"ג` 
            : 'אין נתונים' },
          { label: 'מספר שקילות:', value: String(weightHistory.length) }
        ];

        sheets.push({
          name: 'משקל',
          title: `היסטוריית משקל - ${report.name}`,
          subtitle: `תאריך: ${new Date().toLocaleDateString('he-IL')}`,
          summaryRows: weightSummaryRows,
          headers: weightHeaders,
          rows: weightRows,
          columnWidths: weightColumnWidths
        });
      }

      const safeName = report.name.replace(/[^a-zA-Z0-9א-ת]/g, '_');
      const filename = `דוח_מפורט_${safeName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      if (sheets.length > 0) {
        createExcelWithSheets(sheets, filename, true);
        showToast("✅ הדוח יוצא בהצלחה", "success");
      } else {
        showToast("⚠️ אין נתונים לייצוא", "warning");
      }
    } catch (error: any) {
      console.error("Error exporting trainee report:", error);
      showToast("❌ שגיאה בייצוא הדוח", "error");
    }
  };

  const exportTraineeReportToGoogleDrive = async (report: TraineeReport) => {
    try {
      setUploadingToDrive(true);
      // Same logic as exportTraineeReport but upload to Google Drive
      showToast("🚀 Coming soon - Google Drive export for individual reports", "info");
    } catch (error: any) {
      console.error("Error:", error);
      showToast("❌ שגיאה", "error");
    } finally {
      setUploadingToDrive(false);
    }
  };

  const quickStats = useMemo(() => {
    const workoutsThisWeek = reports.reduce((sum, r) => sum + r.workoutsThisWeek, 0);
    const prsThisWeek = reports.reduce((sum, r) => sum + (r.prsThisWeek || 0), 0);
    
    return {
      activeTrainees: stats.activeTrainees,
      workoutsToday: stats.workoutsToday,
      averageCompliance: stats.averageCompliance,
      alerts: stats.alerts,
      workoutsThisWeek,
      prsThisWeek,
    };
  }, [reports, stats]);

  const filteredAndSortedReports = useMemo(() => {
    let filtered = [...reports];
    
    if (traineeFilter !== 'all') {
      filtered = filtered.filter(r => r.id === traineeFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    if (complianceFilter !== 'all') {
      filtered = filtered.filter(r => {
        if (complianceFilter === 'high') return r.compliance >= 80;
        if (complianceFilter === 'medium') return r.compliance >= 50 && r.compliance < 80;
        if (complianceFilter === 'low') return r.compliance < 50;
        return true;
      });
    }
    
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'he');
          break;
        case 'workouts':
          comparison = b.totalWorkouts - a.totalWorkouts;
          break;
        case 'compliance':
          comparison = b.compliance - a.compliance;
          break;
        case 'weight':
          const weightA = a.averageWeight || 0;
          const weightB = b.averageWeight || 0;
          comparison = weightB - weightA;
          break;
        case 'lastWorkout':
          const dateA = a.lastWorkout ? new Date(a.lastWorkout).getTime() : 0;
          const dateB = b.lastWorkout ? new Date(b.lastWorkout).getTime() : 0;
          comparison = dateB - dateA;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [reports, traineeFilter, statusFilter, complianceFilter, sortBy, sortOrder]);

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

      <div className="space-y-6 pb-32 bg-[#1A1D2E] bg-texture min-h-screen" dir="rtl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#3D4058] slide-up">
          <div>
            <h1 className="text-3xl font-outfit font-bold text-white">דוחות וסטטיסטיקות</h1>
            <p className="text-base text-[#9CA3AF] mt-1 font-outfit">סקירה כללית של ביצועי המתאמנים</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex gap-2 bg-[#2D3142] p-1 rounded-xl border-2 border-[#3D4058]">
              <button
                onClick={() => setTimeFilter("week")}
                className={cn(
                  "px-4 py-2 rounded-lg font-outfit font-semibold text-sm transition-all",
                  timeFilter === "week"
                    ? "bg-[#5B7FFF] text-white shadow-lg shadow-[#5B7FFF]/30"
                    : "text-[#9CA3AF] hover:text-white"
                )}
              >
                שבוע
              </button>
              <button
                onClick={() => setTimeFilter("month")}
                className={cn(
                  "px-4 py-2 rounded-lg font-outfit font-semibold text-sm transition-all",
                  timeFilter === "month"
                    ? "bg-[#5B7FFF] text-white shadow-lg shadow-[#5B7FFF]/30"
                    : "text-[#9CA3AF] hover:text-white"
                )}
              >
                חודש
              </button>
              <button
                onClick={() => setTimeFilter("all")}
                className={cn(
                  "px-4 py-2 rounded-lg font-outfit font-semibold text-sm transition-all",
                  timeFilter === "all"
                    ? "bg-[#5B7FFF] text-white shadow-lg shadow-[#5B7FFF]/30"
                    : "text-[#9CA3AF] hover:text-white"
                )}
              >
                הכל
              </button>
            </div>
            <button
              onClick={exportReport}
              className="bg-[#5B7FFF] hover:bg-[#6B8EFF] text-white px-4 py-2.5 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center justify-center gap-2 hover:scale-105"
              style={{ boxShadow: '0 8px 32px rgba(91, 127, 255, 0.4)' }}
            >
              <Download className="h-4 w-4" />
              ייצא ל-Excel
            </button>
            <button
              onClick={exportReportToGoogleDrive}
              disabled={uploadingToDrive}
              className="bg-[#4CAF50] hover:bg-[#45A049] text-white px-4 py-2.5 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center justify-center gap-2 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 8px 32px rgba(76, 175, 80, 0.4)' }}
            >
              {uploadingToDrive ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  מעלה...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Google Drive
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div 
          className="flex flex-wrap items-center gap-2 slide-up"
          style={{ animationDelay: '100ms' }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="bg-[#2D3142] hover:bg-[#3D4058] text-white px-4 py-2 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center gap-2 border-2 border-[#3D4058]">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">פילטר מתאמן</span>
                <span className="sm:hidden">מתאמן</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#2D3142] border-2 border-[#3D4058] w-48 rounded-xl">
              <DropdownMenuItem onClick={() => setTraineeFilter('all')} className="text-white font-outfit hover:bg-[#3D4058]">
                כל המתאמנים
              </DropdownMenuItem>
              {reports.map(report => (
                <DropdownMenuItem key={report.id} onClick={() => setTraineeFilter(report.id)} className="text-white font-outfit hover:bg-[#3D4058]">
                  {report.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="bg-[#2D3142] hover:bg-[#3D4058] text-white px-4 py-2 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center gap-2 border-2 border-[#3D4058]">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">פילטר סטטוס</span>
                <span className="sm:hidden">סטטוס</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#2D3142] border-2 border-[#3D4058] w-48 rounded-xl">
              <DropdownMenuItem onClick={() => setStatusFilter('all')} className="text-white font-outfit hover:bg-[#3D4058]">
                כל הסטטוסים
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('active')} className="text-white font-outfit hover:bg-[#3D4058]">
                פעיל בלבד
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('inactive')} className="text-white font-outfit hover:bg-[#3D4058]">
                לא פעיל בלבד
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="bg-[#2D3142] hover:bg-[#3D4058] text-white px-4 py-2 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center gap-2 border-2 border-[#3D4058]">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">פילטר התאמה</span>
                <span className="sm:hidden">התאמה</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#2D3142] border-2 border-[#3D4058] w-44 rounded-xl">
              <DropdownMenuItem onClick={() => setComplianceFilter('all')} className="text-white font-outfit hover:bg-[#3D4058]">
                כל ההתאמות
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setComplianceFilter('high')} className="text-white font-outfit hover:bg-[#3D4058]">
                גבוהה (≥80%)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setComplianceFilter('medium')} className="text-white font-outfit hover:bg-[#3D4058]">
                בינונית (50-79%)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setComplianceFilter('low')} className="text-white font-outfit hover:bg-[#3D4058]">
                נמוכה (&lt;50%)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="bg-[#2D3142] hover:bg-[#3D4058] text-white px-4 py-2 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center gap-2 border-2 border-[#3D4058]">
                <ArrowUpDown className="h-4 w-4" />
                מיון
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#2D3142] border-2 border-[#3D4058] w-48 rounded-xl">
              <DropdownMenuItem onClick={() => { setSortBy('name'); setSortOrder(sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc'); }} className="text-white font-outfit hover:bg-[#3D4058]">
                לפי שם {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy('workouts'); setSortOrder(sortBy === 'workouts' && sortOrder === 'desc' ? 'asc' : 'desc'); }} className="text-white font-outfit hover:bg-[#3D4058]">
                לפי אימונים {sortBy === 'workouts' && (sortOrder === 'desc' ? '↓' : '↑')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy('compliance'); setSortOrder(sortBy === 'compliance' && sortOrder === 'desc' ? 'asc' : 'desc'); }} className="text-white font-outfit hover:bg-[#3D4058]">
                לפי התאמה {sortBy === 'compliance' && (sortOrder === 'desc' ? '↓' : '↑')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy('weight'); setSortOrder(sortBy === 'weight' && sortOrder === 'desc' ? 'asc' : 'desc'); }} className="text-white font-outfit hover:bg-[#3D4058]">
                לפי משקל {sortBy === 'weight' && (sortOrder === 'desc' ? '↓' : '↑')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy('lastWorkout'); setSortOrder(sortBy === 'lastWorkout' && sortOrder === 'desc' ? 'asc' : 'desc'); }} className="text-white font-outfit hover:bg-[#3D4058]">
                לפי אימון אחרון {sortBy === 'lastWorkout' && (sortOrder === 'desc' ? '↓' : '↑')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {isLoading ? (
            <>
              {[...Array(6)].map((_, i) => (
                <SkeletonStatCard key={i} />
              ))}
            </>
          ) : (
            <>
              <StatCard
                title="מתאמנים פעילים"
                value={quickStats.activeTrainees}
                icon={Users}
                colorTheme="blue"
                index={0}
              />
              <StatCard
                title="אימונים היום"
                value={quickStats.workoutsToday.completed}
                subValue={`/${quickStats.workoutsToday.total}`}
                icon={Activity}
                colorTheme="indigo"
                index={1}
              />
              <StatCard
                title="אימונים השבוע"
                value={quickStats.workoutsThisWeek}
                icon={Calendar}
                colorTheme="green"
                index={2}
              />
              <StatCard
                title="PRs השבוע"
                value={quickStats.prsThisWeek}
                icon={Award}
                colorTheme="orange"
                index={3}
              />
              <StatCard
                title="התאמה ממוצעת"
                value={quickStats.averageCompliance}
                subValue="%"
                icon={Target}
                colorTheme="purple"
                index={4}
              />
              <StatCard
                title="התראות"
                value={quickStats.alerts}
                icon={AlertTriangle}
                colorTheme="red"
                index={5}
              />
            </>
          )}
        </div>

        {/* Reports Table */}
        <div 
          className="bg-[#2D3142] rounded-2xl overflow-hidden slide-up"
          style={{ 
            animationDelay: '200ms',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div className="p-6 border-b border-[#3D4058]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#5B7FFF]" />
                <h2 className="text-xl font-outfit font-bold text-white">דוחות מתאמנים</h2>
              </div>
              {reports.length > 0 && (
                <div className="bg-[#5B7FFF]/20 px-3 py-1.5 rounded-lg border border-[#5B7FFF]/30">
                  <span className="text-[#5B7FFF] font-outfit font-black text-sm">
                    <AnimatedCounter value={reports.length} />
                  </span>
                  <span className="text-[#9CA3AF] text-xs mr-1 font-outfit">מתאמנים</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3 p-4">
            {isLoading ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <SkeletonReportCard key={i} />
                ))}
              </>
            ) : filteredAndSortedReports.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-8 rounded-full bg-[#1A1D2E] border-2 border-[#3D4058] inline-block mb-4">
                  <FileText className="h-16 w-16 text-[#9CA3AF]" />
                </div>
                <p className="text-white font-outfit font-bold text-xl mb-2">אין נתונים להצגה</p>
                <p className="text-[#9CA3AF] font-outfit">לא נמצאו דוחות לתקופה הנבחרת</p>
              </div>
            ) : (
              filteredAndSortedReports.map((report, index) => (
                <div 
                  key={report.id} 
                  className="bg-[#1A1D2E] rounded-xl p-4 space-y-3 border-2 border-[#3D4058] hover:border-[#5B7FFF] transition-all slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-outfit font-bold text-white truncate flex-1">{report.name}</h3>
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-xs font-outfit font-bold",
                      report.status === 'active' 
                        ? 'bg-[#4CAF50]/20 text-[#4CAF50] border border-[#4CAF50]/30'
                        : 'bg-[#3D4058]/20 text-[#9CA3AF] border border-[#3D4058]/30'
                    )}>
                      {report.status === 'active' ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </div>
                  <div className="text-sm text-[#9CA3AF] font-outfit truncate">{report.planName}</div>
                  <div className="grid grid-cols-2 gap-3 text-sm font-outfit">
                    <div>
                      <span className="text-[#9CA3AF]">אימונים: </span>
                      <span className="font-bold text-white"><AnimatedCounter value={report.totalWorkouts} /></span>
                    </div>
                    <div>
                      <span className="text-[#9CA3AF]">התאמה: </span>
                      <span className="font-bold text-white"><AnimatedCounter value={report.compliance} suffix="%" /></span>
                    </div>
                  </div>
                  <button
                    onClick={() => exportTraineeReport(report)}
                    className="w-full bg-[#2D3142] hover:bg-[#3D4058] text-white px-4 py-2 rounded-lg font-outfit font-semibold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    ייצא דוח
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#3D4058] bg-[#1A1D2E]">
                  <th className="text-right p-4 text-sm font-outfit font-bold text-white uppercase">שם</th>
                  <th className="text-right p-4 text-sm font-outfit font-bold text-white uppercase">תוכנית</th>
                  <th className="text-right p-4 text-sm font-outfit font-bold text-white uppercase">סטטוס</th>
                  <th className="text-right p-4 text-sm font-outfit font-bold text-white uppercase">אימונים</th>
                  <th className="text-right p-4 text-sm font-outfit font-bold text-white uppercase">התאמה</th>
                  <th className="text-right p-4 text-sm font-outfit font-bold text-white uppercase">משקל</th>
                  <th className="text-right p-4 text-sm font-outfit font-bold text-white uppercase">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-[#3D4058]">
                        <td colSpan={7} className="p-4">
                          <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full bg-[#3D4058]" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-32 bg-[#3D4058]" />
                              <Skeleton className="h-3 w-24 bg-[#3D4058]" />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ) : filteredAndSortedReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <div className="p-8 rounded-full bg-[#1A1D2E] border-2 border-[#3D4058] inline-block mb-4">
                        <FileText className="h-16 w-16 text-[#9CA3AF]" />
                      </div>
                      <p className="text-white font-outfit font-bold text-xl mb-2">אין נתונים להצגה</p>
                      <p className="text-[#9CA3AF] font-outfit">לא נמצאו דוחות לתקופה הנבחרת</p>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedReports.map((report, index) => (
                    <tr 
                      key={report.id} 
                      className="border-b border-[#3D4058] hover:bg-[#3D4058]/30 transition-all slide-up"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="p-4 text-white font-outfit font-bold">{report.name}</td>
                      <td className="p-4 text-[#9CA3AF] font-outfit">{report.planName}</td>
                      <td className="p-4">
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-xs font-outfit font-bold",
                          report.status === 'active' 
                            ? 'bg-[#4CAF50]/20 text-[#4CAF50] border border-[#4CAF50]/30'
                            : 'bg-[#3D4058]/20 text-[#9CA3AF] border border-[#3D4058]/30'
                        )}>
                          {report.status === 'active' ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </td>
                      <td className="p-4 text-white font-outfit font-bold">
                        <AnimatedCounter value={report.totalWorkouts} />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-[#1A1D2E] rounded-full h-2 max-w-[70px]">
                            <div 
                              className={cn(
                                "h-2 rounded-full transition-all",
                                report.compliance >= 80 ? 'bg-[#4CAF50]' :
                                report.compliance >= 50 ? 'bg-[#FF8A00]' :
                                'bg-[#EF4444]'
                              )}
                              style={{ width: `${Math.min(100, report.compliance)}%` }}
                            />
                          </div>
                          <span className="text-white text-sm font-outfit font-bold">
                            <AnimatedCounter value={report.compliance} suffix="%" />
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-[#9CA3AF] font-outfit">
                        {report.averageWeight ? `${report.averageWeight.toFixed(1)} ק"ג` : "אין"}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => exportTraineeReport(report)}
                          className="bg-[#1A1D2E] hover:bg-[#3D4058] text-white px-4 py-2 rounded-lg font-outfit font-semibold text-sm transition-all flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          ייצא
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}

export default function ReportsPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <ReportsContent />
    </ProtectedRoute>
  );
}