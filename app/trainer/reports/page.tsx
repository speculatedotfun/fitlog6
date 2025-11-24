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
import { getTrainerTrainees, getTrainerStats, getTraineesWithStatus, getWorkoutLogs, getBodyWeightHistory } from "@/lib/db";
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
    try {
      setLoading(true);

      // Load trainer stats
      const trainerStats = await getTrainerStats(trainerId);
      setStats(trainerStats);

      // Load all trainees
      const trainees = await getTrainerTrainees(trainerId);
      
      // Calculate reports for each trainee
      const reportsData: TraineeReport[] = [];

      for (const trainee of trainees) {
        const logs = await getWorkoutLogs(trainee.id);
        const weightHistory = await getBodyWeightHistory(trainee.id);

        // Filter logs by time period
        const now = new Date();
        let filteredLogs = logs;
        
        if (timeFilter === "week") {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredLogs = logs.filter(log => new Date(log.date) >= weekAgo);
        } else if (timeFilter === "month") {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filteredLogs = logs.filter(log => new Date(log.date) >= monthAgo);
        }

        // Calculate statistics
        const completedLogs = filteredLogs.filter(log => log.completed);
        const totalWorkouts = completedLogs.length;
        
        const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const workoutsThisWeek = completedLogs.filter(log => 
          new Date(log.date) >= thisWeek
        ).length;

        const thisMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const workoutsThisMonth = completedLogs.filter(log => 
          new Date(log.date) >= thisMonth
        ).length;

        // Calculate total volume
        let totalVolume = 0;
        completedLogs.forEach(log => {
          log.set_logs?.forEach(setLog => {
            if (setLog.weight_kg && setLog.reps) {
              totalVolume += setLog.weight_kg * setLog.reps;
            }
          });
        });

        // Calculate weight statistics
        let averageWeight: number | null = null;
        let weightChange: number | null = null;
        
        if (weightHistory.length > 0) {
          const recentWeights = weightHistory.slice(0, 7); // Last 7 measurements
          const sum = recentWeights.reduce((acc, w) => acc + w.weight, 0);
          averageWeight = sum / recentWeights.length;

          if (weightHistory.length >= 2) {
            const latest = weightHistory[0].weight;
            const previous = weightHistory[weightHistory.length - 1].weight;
            weightChange = latest - previous;
          }
        }

        // Get plan info
        const traineesWithStatus = await getTraineesWithStatus(trainerId);
        const traineeStatus = traineesWithStatus.find(t => t.id === trainee.id);

        reportsData.push({
          id: trainee.id,
          name: trainee.name,
          planName: traineeStatus?.planName || "אין תוכנית",
          status: traineeStatus?.status || 'inactive',
          lastWorkout: traineeStatus?.lastWorkout || null,
          compliance: traineeStatus?.compliance || 0,
          totalWorkouts,
          workoutsThisWeek,
          workoutsThisMonth,
          averageWeight,
          weightChange,
          totalVolume,
        });
      }

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
    // Create CSV content
    const headers = ["שם", "תוכנית", "סטטוס", "אימונים (סה\"כ)", "אימונים (שבוע)", "אימונים (חודש)", "התאמה", "משקל ממוצע", "שינוי משקל", "נפח כולל"];
    const rows = reports.map(r => [
      r.name,
      r.planName,
      r.status === 'active' ? 'פעיל' : 'לא פעיל',
      r.totalWorkouts.toString(),
      r.workoutsThisWeek.toString(),
      r.workoutsThisMonth.toString(),
      `${r.compliance}%`,
      r.averageWeight ? `${r.averageWeight.toFixed(1)} ק\"ג` : "אין",
      r.weightChange ? `${r.weightChange > 0 ? '+' : ''}${r.weightChange.toFixed(1)} ק\"ג` : "אין",
      `${r.totalVolume.toFixed(0)} ק\"ג`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Add BOM for Hebrew support
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `דוחות_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportTraineeReport = async (report: TraineeReport) => {
    try {
      // Load detailed data for this trainee
      const logs = await getWorkoutLogs(report.id);
      const weightHistory = await getBodyWeightHistory(report.id);

      // Filter logs by time period
      const now = new Date();
      let filteredLogs = logs;
      
      if (timeFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredLogs = logs.filter(log => new Date(log.date) >= weekAgo);
      } else if (timeFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredLogs = logs.filter(log => new Date(log.date) >= monthAgo);
      }

      const completedLogs = filteredLogs.filter(log => log.completed);

      // Create detailed CSV
      const headers = [
        "תאריך", "רוטינה", "תרגיל", "סט", "משקל (ק\"ג)", "חזרות", "RIR", "נפח (ק\"ג)", "הערות"
      ];

      const rows: string[][] = [];

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
              (setLog.set_number || index + 1).toString(),
              (setLog.weight_kg || 0).toString(),
              (setLog.reps || 0).toString(),
              (setLog.rir_actual !== null && setLog.rir_actual !== undefined ? setLog.rir_actual.toString() : ''),
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

      const csvContent = rows.map(row => row.join(",")).join("\n");

      // Add BOM for Hebrew support
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      const safeName = report.name.replace(/[^a-zA-Z0-9]/g, '_');
      link.setAttribute("download", `דוח_${safeName}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

