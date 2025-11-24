"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, FileText,
  Users, Calendar, TrendingUp, AlertTriangle,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { getTrainerTrainees, getTrainerStats, getTraineesWithStatus, getWorkoutLogs, getBodyWeightHistory } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { User as UserType } from "@/lib/types";

function TrainerDashboardContent() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [trainees, setTrainees] = useState<Array<{
    id: string;
    name: string;
    planActive: boolean;
    lastWorkout: string | null;
  }>>([]);
  const [stats, setStats] = useState({
    activeTrainees: 0,
    workoutsToday: { completed: 0, total: 0 },
    averageCompliance: 0,
    alerts: 0,
  });
  const [traineesWithStatus, setTraineesWithStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const trainerId = user?.id || "";

  useEffect(() => {
    if (trainerId && !authLoading) {
      loadDashboardData();
    } else if (!authLoading && !trainerId) {
      setLoading(false);
    }
  }, [trainerId, authLoading]);

  const loadDashboardData = async () => {
    if (!trainerId) return;

    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [traineesList, statsData, statusData] = await Promise.all([
        getTrainerTrainees(trainerId),
        getTrainerStats(trainerId),
        getTraineesWithStatus(trainerId),
      ]);

      setTrainees(traineesList.map(t => ({
        id: t.id,
        name: t.name,
        planActive: false,
        lastWorkout: null,
      })));
      setStats(statsData);
      setTraineesWithStatus(statusData);
    } catch (err: any) {
      console.error("Error loading dashboard data:", err);
      setError(err.message || "שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  };

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#00ff88]" />
          <p className="mt-2 text-gray-400">טוען משתמש...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">נדרש התחברות</h1>
          <p className="text-gray-400 mb-4">יש להתחבר כדי לגשת לדף זה</p>
          <Link href="/auth/login" className="bg-[#00ff88] text-black px-4 py-2 rounded hover:bg-[#00e677] font-semibold">
            התחברות
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "אין";
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `היום, ${date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `אתמול, ${date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`;
    }
    return date.toLocaleDateString("he-IL");
  };

  const exportWeeklyReport = async () => {
    try {
      if (!trainerId) return;

      const trainees = await getTrainerTrainees(trainerId);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const headers = ["שם", "תוכנית", "אימונים השבוע", "התאמה", "משקל ממוצע", "שינוי משקל", "נפח כולל", "אימון אחרון"];
      const rows: string[][] = [];

      for (const trainee of trainees) {
        const logs = await getWorkoutLogs(trainee.id);
        const weekLogs = logs.filter(log => 
          new Date(log.date) >= weekAgo && log.completed
        );

        const weightHistory = await getBodyWeightHistory(trainee.id);
        let averageWeight: number | null = null;
        let weightChange: number | null = null;
        
        if (weightHistory.length > 0) {
          const recentWeights = weightHistory.slice(0, 7);
          const sum = recentWeights.reduce((acc, w) => acc + w.weight, 0);
          averageWeight = sum / recentWeights.length;

          if (weightHistory.length >= 2) {
            const latest = weightHistory[0].weight;
            const previous = weightHistory[weightHistory.length - 1].weight;
            weightChange = latest - previous;
          }
        }

        let totalVolume = 0;
        weekLogs.forEach(log => {
          log.set_logs?.forEach(setLog => {
            if (setLog.weight_kg && setLog.reps) {
              totalVolume += setLog.weight_kg * setLog.reps;
            }
          });
        });

        const traineesWithStatus = await getTraineesWithStatus(trainerId);
        const traineeStatus = traineesWithStatus.find(t => t.id === trainee.id);

        rows.push([
          trainee.name,
          traineeStatus?.planName || "אין תוכנית",
          weekLogs.length.toString(),
          `${traineeStatus?.compliance || 0}%`,
          averageWeight ? `${averageWeight.toFixed(1)} ק"ג` : "אין",
          weightChange ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} ק"ג` : "אין",
          `${totalVolume.toFixed(0)} ק"ג`,
          traineeStatus?.lastWorkout ? new Date(traineeStatus.lastWorkout).toLocaleDateString("he-IL") : "אין"
        ]);
      }

      const csvContent = [
        "דוח שבועי - " + new Date().toLocaleDateString("he-IL"),
        "",
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `דוח_שבועי_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error("Error exporting weekly report:", error);
      alert("שגיאה בייצוא הדוח: " + error.message);
    }
  };

  const exportPerformanceReport = async () => {
    try {
      if (!trainerId) return;

      const trainees = await getTrainerTrainees(trainerId);
      const stats = await getTrainerStats(trainerId);

      const headers = ["שם", "סטטוס", "אימונים (סה\"כ)", "אימונים (שבוע)", "אימונים (חודש)", "התאמה", "משקל ממוצע", "נפח כולל"];
      const rows: string[][] = [];

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      for (const trainee of trainees) {
        const logs = await getWorkoutLogs(trainee.id);
        const completedLogs = logs.filter(log => log.completed);
        const weekLogs = completedLogs.filter(log => new Date(log.date) >= weekAgo);
        const monthLogs = completedLogs.filter(log => new Date(log.date) >= monthAgo);

        const weightHistory = await getBodyWeightHistory(trainee.id);
        let averageWeight: number | null = null;
        
        if (weightHistory.length > 0) {
          const recentWeights = weightHistory.slice(0, 7);
          const sum = recentWeights.reduce((acc, w) => acc + w.weight, 0);
          averageWeight = sum / recentWeights.length;
        }

        let totalVolume = 0;
        completedLogs.forEach(log => {
          log.set_logs?.forEach(setLog => {
            if (setLog.weight_kg && setLog.reps) {
              totalVolume += setLog.weight_kg * setLog.reps;
            }
          });
        });

        const traineesWithStatus = await getTraineesWithStatus(trainerId);
        const traineeStatus = traineesWithStatus.find(t => t.id === trainee.id);

        rows.push([
          trainee.name,
          traineeStatus?.status === 'active' ? 'פעיל' : 'לא פעיל',
          completedLogs.length.toString(),
          weekLogs.length.toString(),
          monthLogs.length.toString(),
          `${traineeStatus?.compliance || 0}%`,
          averageWeight ? `${averageWeight.toFixed(1)} ק"ג` : "אין",
          `${totalVolume.toFixed(0)} ק"ג`
        ]);
      }

      const csvContent = [
        "דוח ביצועים - " + new Date().toLocaleDateString("he-IL"),
        `מתאמנים פעילים: ${stats.activeTrainees}`,
        `אימונים היום: ${stats.workoutsToday.completed}/${stats.workoutsToday.total}`,
        `התאמה ממוצעת: ${stats.averageCompliance}%`,
        "",
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `דוח_ביצועים_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error("Error exporting performance report:", error);
      alert("שגיאה בייצוא הדוח: " + error.message);
    }
  };


  return (
    <main className="p-4 lg:p-6 space-y-6">
          <h2 className="text-3xl font-bold text-white">דשבורד מאמן</h2>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-[#1a2332] border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">מתאמנים פעילים</p>
                    <p className="text-3xl font-bold text-white">{stats.activeTrainees}</p>
                  </div>
                  <Users className="h-10 w-10 text-[#00ff88]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2332] border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">אימונים היום</p>
                    <p className="text-3xl font-bold text-white">
                      {stats.workoutsToday.completed}/{stats.workoutsToday.total}
                    </p>
                  </div>
                  <Calendar className="h-10 w-10 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2332] border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">ציות ממוצע</p>
                    <p className="text-3xl font-bold text-white">{stats.averageCompliance}%</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2332] border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">התראות</p>
                    <p className="text-3xl font-bold text-red-400">{stats.alerts}</p>
                  </div>
                  <AlertTriangle className="h-10 w-10 text-red-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Command Center */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#1a2332] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">מרכז פיקוד</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">שם מאמן</h3>
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  ) : traineesWithStatus.length > 0 ? (
                    <div className="space-y-3">
                      {traineesWithStatus.slice(0, 2).map((trainee) => (
                        <div key={trainee.id} className="bg-[#0f1a2a] rounded-lg p-4 border border-gray-800">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-white">{trainee.name}</p>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              trainee.status === 'active' 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {trainee.status === 'active' ? 'פעיל' : 'לא פעיל'}
                            </div>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{trainee.planName}</p>
                          <p className="text-xs text-gray-500">{formatDate(trainee.lastWorkout)}</p>
                          <div className="mt-3 flex items-center gap-2">
                            <div className={`px-3 py-1 rounded text-xs font-medium ${
                              trainee.compliance >= 90 
                                ? 'bg-green-500/20 text-green-400' 
                                : trainee.compliance >= 70
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              ציות: {trainee.compliance}%
                            </div>
                            <Link href={`/trainer/workout-plans/${trainee.id}/edit`} className="mr-auto">
                              <Button size="sm" className="bg-[#1a2332] border border-gray-700 text-gray-300 hover:bg-gray-800 text-xs">
                                ערוך תוכנית
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">אין מתאמנים</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2332] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">דוחות מהירים</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={exportWeeklyReport}
                  className="w-full bg-[#0f1a2a] hover:bg-[#1a2332] text-white border border-gray-800 justify-start h-auto py-4"
                >
                  <FileText className="h-5 w-5 ml-3" />
                  <div className="text-right flex-1">
                    <p className="font-semibold">דו"ח שבועי</p>
                    <p className="text-xs text-gray-400">ייצא דוח שבועי של כל המתאמנים</p>
                  </div>
                </Button>
                <Button 
                  onClick={exportPerformanceReport}
                  className="w-full bg-[#0f1a2a] hover:bg-[#1a2332] text-white border border-gray-800 justify-start h-auto py-4"
                >
                  <BarChart3 className="h-5 w-5 ml-3" />
                  <div className="text-right flex-1">
                    <p className="font-semibold">ביצועים</p>
                    <p className="text-xs text-gray-400">ייצא דוח ביצועים מפורט</p>
                  </div>
                </Button>
                <Link href="/trainer/reports" className="block">
                  <Button className="w-full bg-[#0f1a2a] hover:bg-[#1a2332] text-white border border-gray-800 justify-start h-auto py-4">
                    <FileText className="h-5 w-5 ml-3" />
                    <div className="text-right flex-1">
                      <p className="font-semibold">דוחות מפורטים</p>
                      <p className="text-xs text-gray-400">עבור לדף הדוחות המלא</p>
                    </div>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Workout Status Table */}
          <Card className="bg-[#1a2332] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">סטטוס אימונים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">תוכנית</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">סטטוס</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">אימון אחרון</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">ציות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                        </td>
                      </tr>
                    ) : traineesWithStatus.length > 0 ? (
                      traineesWithStatus.map((trainee) => (
                        <tr key={trainee.id} className="border-b border-gray-800 hover:bg-[#0f1a2a] transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-white">{trainee.planName}</span>
                              <Link href={`/trainer/workout-plans/${trainee.id}/edit`}>
                                <Button size="sm" variant="outline" className="h-7 text-xs border-gray-700 text-gray-300 hover:bg-gray-800">
                                  ערוך
                                </Button>
                              </Link>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              trainee.status === 'active' 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {trainee.status === 'active' ? 'פעיל' : 'לא פעיל'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-400">{formatDate(trainee.lastWorkout)}</td>
                          <td className="py-3 px-4 text-white font-semibold">{trainee.compliance}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-400">
                          אין נתונים
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Progress Graph - Placeholder */}
          <Card className="bg-[#1a2332] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">התקדמות לקוחות חודשית</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-[#0f1a2a] rounded-lg border border-gray-800">
                <p className="text-gray-400">גרף התקדמות יתווסף בהמשך</p>
              </div>
            </CardContent>
          </Card>

    </main>
  );
}

export default function TrainerDashboard() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <TrainerDashboardContent />
    </ProtectedRoute>
  );
}
