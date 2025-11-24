"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, FileText, Download, Calendar, TrendingUp, TrendingDown,
  Users, BarChart3, Target, Activity, Award, AlertTriangle
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
  getBodyWeightHistory
} from "@/lib/db";
import { calculateTraineeStats } from "@/lib/trainee-stats";
import { createCsvContent, downloadCsv, createCsvRow } from "@/lib/csv-export";
import type { User } from "@/lib/types";

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
}

function ReportsContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<TraineeReport[]>([]);
  const [stats, setStats] = useState({
    activeTrainees: 0,
    workoutsToday: { completed: 0, total: 0 },
    averageCompliance: 0,
    alerts: 0,
  });
  const [timeFilter, setTimeFilter] = useState<"week" | "month" | "all">("month");

  const trainerId = user?.id || "";

  useEffect(() => {
    if (trainerId) {
      loadReports();
    }
  }, [trainerId, timeFilter]);

  const loadReports = async () => {
    if (!trainerId) return;

    try {
      setLoading(true);

      // 1. Load trainer stats and trainees in parallel
      const [trainerStats, trainees] = await Promise.all([
        getTrainerStats(trainerId),
        getTrainerTrainees(trainerId),
      ]);

      setStats(trainerStats);

      if (trainees.length === 0) {
        setReports([]);
        setLoading(false);
        return;
      }

      const traineeIds = trainees.map(t => t.id);

      // 2. Calculate start date for filtering (server-side optimization)
      const now = new Date();
      let startDate: string | undefined;
      
      if (timeFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
      } else if (timeFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString().split('T')[0];
      }

      // 3. Load all data in parallel (optimized queries)
      const [logsMap, weightsMap, statusData] = await Promise.all([
        getWorkoutLogsForUsers(traineeIds, startDate),
        getBodyWeightHistoryForUsers(traineeIds),
        getTraineesWithStatus(trainerId),
      ]);

      // 4. Process data in memory (much faster than network requests)
      const reportsData: TraineeReport[] = trainees.map(trainee => {
        const logs = logsMap.get(trainee.id) || [];
        const weightHistory = weightsMap.get(trainee.id) || [];
        const traineeStatus = statusData.find(s => s.id === trainee.id);

        // Use shared calculation function
        const stats = calculateTraineeStats(logs, weightHistory, timeFilter);

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
        };
      });

      setReports(reportsData);
    } catch (error: any) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
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

  const exportReport = () => {
    const headers = [
      "שם",
      "תוכנית",
      "סטטוס",
      "אימונים (סה\"כ)",
      "אימונים (שבוע)",
      "אימונים (חודש)",
      "התאמה",
      "משקל ממוצע",
      "שינוי משקל",
      "נפח כולל"
    ];

    const rows = reports.map(r => [
      r.name,
      r.planName,
      r.status === 'active' ? 'פעיל' : 'לא פעיל',
      r.totalWorkouts,
      r.workoutsThisWeek,
      r.workoutsThisMonth,
      `${r.compliance}%`,
      r.averageWeight ? `${r.averageWeight.toFixed(1)} ק\"ג` : "אין",
      r.weightChange ? `${r.weightChange > 0 ? '+' : ''}${r.weightChange.toFixed(1)} ק\"ג` : "אין",
      `${r.totalVolume.toFixed(0)} ק\"ג`
    ]);

    const csvContent = createCsvContent(headers, rows);
    const filename = `דוחות_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCsv(csvContent, filename);
  };

  const exportTraineeReport = async (report: TraineeReport) => {
    try {
      // Calculate start date for filtering
      const now = new Date();
      let startDate: string | undefined;
      
      if (timeFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
      } else if (timeFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString().split('T')[0];
      }

      // Load detailed data for this trainee (with server-side filtering)
      const [logs, weightHistory] = await Promise.all([
        getWorkoutLogs(report.id, undefined, startDate),
        getBodyWeightHistory(report.id),
      ]);

      const completedLogs = logs.filter(log => log.completed);

      // Create detailed CSV with safe escaping
      const headers = [
        "תאריך", "רוטינה", "תרגיל", "סט", "משקל (ק\"ג)", "חזרות", "RIR", "נפח (ק\"ג)", "הערות"
      ];

      const rows: (string | number | null | undefined)[][] = [];

      // Add summary section
      rows.push(["דוח מפורט - " + report.name]);
      rows.push(["תוכנית: " + report.planName]);
      rows.push(["סטטוס: " + (report.status === 'active' ? 'פעיל' : 'לא פעיל')]);
      rows.push(["אימונים (סה\"כ): " + report.totalWorkouts]);
      rows.push(["אימונים (שבוע): " + report.workoutsThisWeek]);
      rows.push(["אימונים (חודש): " + report.workoutsThisMonth]);
      rows.push(["התאמה: " + report.compliance + "%"]);
      rows.push(["משקל ממוצע: " + (report.averageWeight ? `${report.averageWeight.toFixed(1)} ק\"ג` : "אין")]);
      rows.push(["שינוי משקל: " + (report.weightChange ? `${report.weightChange > 0 ? '+' : ''}${report.weightChange.toFixed(1)} ק\"ג` : "אין")]);
      rows.push(["נפח כולל: " + `${report.totalVolume.toFixed(0)} ק\"ג`]);
      rows.push(["אימון אחרון: " + formatDate(report.lastWorkout)]);
      rows.push([]);
      rows.push(["פירוט אימונים:"]);
      rows.push(headers);

      // Add workout details
      completedLogs.forEach(log => {
        const routineName = log.routine ? `${log.routine.letter} - ${log.routine.name}` : 'ללא רוטינה';
        
        if (log.set_logs && log.set_logs.length > 0) {
          log.set_logs.forEach((setLog, index) => {
            const exerciseName = setLog.exercise?.name || 'תרגיל לא ידוע';
            const volume = (setLog.weight_kg || 0) * (setLog.reps || 0);
            
            rows.push([
              log.date,
              routineName,
              exerciseName,
              setLog.set_number || index + 1,
              setLog.weight_kg || 0,
              setLog.reps || 0,
              setLog.rir_actual !== null && setLog.rir_actual !== undefined ? setLog.rir_actual : '',
              volume.toFixed(1),
              setLog.notes || ''
            ]);
          });
        } else {
          // Log without sets
          rows.push([
            log.date,
            routineName,
            '',
            '',
            '',
            '',
            '',
            '',
            ''
          ]);
        }
      });

      // Add weight history section
      if (weightHistory.length > 0) {
        rows.push([]);
        rows.push(["היסטוריית משקל:"]);
        rows.push(["תאריך", "משקל (ק\"ג)"]);
        weightHistory.forEach(w => {
          rows.push([w.date, w.weight.toFixed(1)]);
        });
      }

      // Use safe CSV export
      const csvContent = rows.map(row => createCsvRow(row)).join("\n");
      const safeName = report.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `דוח_${safeName}_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCsv(csvContent, filename);
    } catch (error: any) {
      console.error("Error exporting trainee report:", error);
      alert("שגיאה בייצוא הדוח: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-[#00ff88]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] p-4 lg:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">דוחות</h1>
            <p className="text-gray-400">סקירה כללית של ביצועי המתאמנים</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2 bg-[#1a2332] p-1 rounded-lg border border-gray-800">
              <Button
                size="sm"
                variant={timeFilter === "week" ? "default" : "ghost"}
                onClick={() => setTimeFilter("week")}
                className={timeFilter === "week" ? "bg-[#00ff88] text-black" : "text-gray-400"}
              >
                שבוע
              </Button>
              <Button
                size="sm"
                variant={timeFilter === "month" ? "default" : "ghost"}
                onClick={() => setTimeFilter("month")}
                className={timeFilter === "month" ? "bg-[#00ff88] text-black" : "text-gray-400"}
              >
                חודש
              </Button>
              <Button
                size="sm"
                variant={timeFilter === "all" ? "default" : "ghost"}
                onClick={() => setTimeFilter("all")}
                className={timeFilter === "all" ? "bg-[#00ff88] text-black" : "text-gray-400"}
              >
                הכל
              </Button>
            </div>
            <Button
              onClick={exportReport}
              className="bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
            >
              <Download className="h-4 w-4 ml-2" />
              ייצא ל-CSV
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#1a2332] border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">מתאמנים פעילים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-white">{stats.activeTrainees}</div>
                <Users className="h-8 w-8 text-[#00ff88]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a2332] border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">אימונים היום</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white">{stats.workoutsToday.completed}</div>
                  <div className="text-sm text-gray-400">מתוך {stats.workoutsToday.total}</div>
                </div>
                <Activity className="h-8 w-8 text-[#00ff88]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a2332] border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">התאמה ממוצעת</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-white">{stats.averageCompliance}%</div>
                <Target className="h-8 w-8 text-[#00ff88]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a2332] border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">התראות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-white">{stats.alerts}</div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Table */}
        <Card className="bg-[#1a2332] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">דוחות מתאמנים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-right p-4 text-sm font-semibold text-gray-400">שם</th>
                    <th className="text-right p-4 text-sm font-semibold text-gray-400">תוכנית</th>
                    <th className="text-right p-4 text-sm font-semibold text-gray-400">סטטוס</th>
                    <th className="text-right p-4 text-sm font-semibold text-gray-400">אימונים (סה"כ)</th>
                    <th className="text-right p-4 text-sm font-semibold text-gray-400">אימונים (שבוע)</th>
                    <th className="text-right p-4 text-sm font-semibold text-gray-400">אימונים (חודש)</th>
                    <th className="text-right p-4 text-sm font-semibold text-gray-400">התאמה</th>
                    <th className="text-right p-4 text-sm font-semibold text-gray-400">משקל ממוצע</th>
                    <th className="text-right p-4 text-sm font-semibold text-gray-400">שינוי משקל</th>
                    <th className="text-right p-4 text-sm font-semibold text-gray-400">נפח כולל</th>
                    <th className="text-right p-4 text-sm font-semibold text-gray-400">אימון אחרון</th>
                    <th className="text-right p-4 text-sm font-semibold text-gray-400">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center p-8 text-gray-400">
                        אין נתונים להצגה
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id} className="border-b border-gray-800 hover:bg-[#0f1a2a] transition-colors">
                        <td className="p-4 text-white font-semibold">{report.name}</td>
                        <td className="p-4 text-gray-300">{report.planName}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            report.status === 'active' 
                              ? 'bg-green-900/30 text-green-400' 
                              : 'bg-gray-800 text-gray-400'
                          }`}>
                            {report.status === 'active' ? 'פעיל' : 'לא פעיל'}
                          </span>
                        </td>
                        <td className="p-4 text-white">{report.totalWorkouts}</td>
                        <td className="p-4 text-white">{report.workoutsThisWeek}</td>
                        <td className="p-4 text-white">{report.workoutsThisMonth}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-800 rounded-full h-2 max-w-[60px]">
                              <div 
                                className={`h-2 rounded-full ${
                                  report.compliance >= 80 ? 'bg-[#00ff88]' :
                                  report.compliance >= 50 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(100, report.compliance)}%` }}
                              />
                            </div>
                            <span className="text-white text-sm">{report.compliance}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-300">
                          {report.averageWeight ? `${report.averageWeight.toFixed(1)} ק"ג` : "אין"}
                        </td>
                        <td className="p-4">
                          {report.weightChange !== null ? (
                            <div className="flex items-center gap-1">
                              {report.weightChange > 0 ? (
                                <TrendingUp className="h-4 w-4 text-red-400" />
                              ) : report.weightChange < 0 ? (
                                <TrendingDown className="h-4 w-4 text-green-400" />
                              ) : null}
                              <span className={report.weightChange > 0 ? 'text-red-400' : 'text-green-400'}>
                                {report.weightChange > 0 ? '+' : ''}{report.weightChange.toFixed(1)} ק"ג
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">אין</span>
                          )}
                        </td>
                        <td className="p-4 text-gray-300">
                          {report.totalVolume > 0 ? `${report.totalVolume.toFixed(0)} ק"ג` : "אין"}
                        </td>
                        <td className="p-4 text-gray-300">{formatDate(report.lastWorkout)}</td>
                        <td className="p-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportTraineeReport(report)}
                            className="border-gray-700 text-gray-300 hover:bg-gray-800"
                          >
                            <Download className="h-4 w-4 ml-2" />
                            ייצא דוח
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <ReportsContent />
    </ProtectedRoute>
  );
}

