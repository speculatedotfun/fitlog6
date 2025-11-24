"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, FileText,
  Users, Calendar, TrendingUp, AlertTriangle,
  BarChart3, ChevronRight
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
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">טוען משתמש...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">נדרש התחברות</h1>
          <p className="text-muted-foreground mb-4">יש להתחבר כדי לגשת לדף זה</p>
          <Link href="/auth/login" className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 font-semibold">
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
    <main className="p-4 lg:p-6 space-y-6 pb-24 lg:pb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-foreground">דשבורד מאמן</h2>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">מתאמנים פעילים</p>
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats.activeTrainees}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">אימונים היום</p>
                    <Calendar className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.workoutsToday.completed}/{stats.workoutsToday.total}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">ציות ממוצע</p>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats.averageCompliance}%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">התראות</p>
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <p className="text-3xl font-bold text-destructive">{stats.alerts}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Command Center */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border shadow-sm flex flex-col">
              <CardHeader>
                <CardTitle className="text-foreground">פעילות אחרונה</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : traineesWithStatus.length > 0 ? (
                  <div className="space-y-3">
                    {traineesWithStatus.slice(0, 3).map((trainee) => (
                      <Link 
                        href={`/trainer/trainee/${trainee.id}`} 
                        key={trainee.id}
                        className="block bg-accent/30 rounded-lg p-4 border border-border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                              {trainee.name.charAt(0)}
                            </div>
                            <p className="font-semibold text-foreground">{trainee.name}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-sm text-muted-foreground">{trainee.planName}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              אימון אחרון: {formatDate(trainee.lastWorkout)}
                            </p>
                          </div>
                          <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                            trainee.compliance >= 90 
                              ? 'bg-green-500/20 text-green-500' 
                              : trainee.compliance >= 70
                              ? 'bg-yellow-500/20 text-yellow-500'
                              : 'bg-destructive/20 text-destructive'
                          }`}>
                            {trainee.compliance}% ציות
                          </div>
                        </div>
                      </Link>
                    ))}
                    <Link href="/trainer/trainees" className="block text-center text-sm text-primary hover:underline pt-2">
                      צפה בכל המתאמנים
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <p className="text-muted-foreground mb-4">אין מתאמנים פעילים</p>
                    <Link href="/trainer/trainees">
                      <Button variant="outline">הוסף מתאמן חדש</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">דוחות מהירים</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={exportWeeklyReport}
                  className="w-full bg-accent/30 hover:bg-accent text-foreground border border-border justify-start h-auto py-4 group"
                >
                  <div className="bg-primary/10 p-2 rounded-md ml-3 group-hover:bg-primary/20 transition-colors">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-right flex-1">
                    <p className="font-semibold">דו"ח שבועי</p>
                    <p className="text-xs text-muted-foreground">ייצא דוח שבועי של כל המתאמנים</p>
                  </div>
                </Button>
                <Button 
                  onClick={exportPerformanceReport}
                  className="w-full bg-accent/30 hover:bg-accent text-foreground border border-border justify-start h-auto py-4 group"
                >
                  <div className="bg-blue-500/10 p-2 rounded-md ml-3 group-hover:bg-blue-500/20 transition-colors">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="text-right flex-1">
                    <p className="font-semibold">ביצועים</p>
                    <p className="text-xs text-muted-foreground">ייצא דוח ביצועים מפורט</p>
                  </div>
                </Button>
                <Link href="/trainer/reports" className="block">
                  <Button className="w-full bg-accent/30 hover:bg-accent text-foreground border border-border justify-start h-auto py-4 group">
                    <div className="bg-purple-500/10 p-2 rounded-md ml-3 group-hover:bg-purple-500/20 transition-colors">
                      <FileText className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="text-right flex-1">
                      <p className="font-semibold">דוחות מפורטים</p>
                      <p className="text-xs text-muted-foreground">עבור לדף הדוחות המלא</p>
                    </div>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Workout Status Table - Only visible on larger screens */}
          <Card className="bg-card border-border shadow-sm hidden lg:block">
            <CardHeader>
              <CardTitle className="text-foreground">סטטוס אימונים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">שם</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">תוכנית</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">סטטוס</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">אימון אחרון</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">ציות</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        </td>
                      </tr>
                    ) : traineesWithStatus.length > 0 ? (
                      traineesWithStatus.map((trainee) => (
                        <tr key={trainee.id} className="border-b border-border hover:bg-accent/30 transition-colors group">
                          <td className="py-3 px-4 font-medium text-foreground">{trainee.name}</td>
                          <td className="py-3 px-4 text-muted-foreground">{trainee.planName}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              trainee.status === 'active' 
                                ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                : 'bg-destructive/10 text-destructive border border-destructive/20'
                            }`}>
                              {trainee.status === 'active' ? 'פעיל' : 'לא פעיל'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{formatDate(trainee.lastWorkout)}</td>
                          <td className="py-3 px-4">
                            <div className="w-full bg-secondary rounded-full h-2 max-w-[100px]">
                              <div 
                                className={`h-2 rounded-full ${
                                  trainee.compliance >= 90 ? 'bg-green-500' : 
                                  trainee.compliance >= 70 ? 'bg-yellow-500' : 'bg-destructive'
                                }`} 
                                style={{ width: `${trainee.compliance}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground mt-1 block">{trainee.compliance}%</span>
                          </td>
                          <td className="py-3 px-4">
                            <Link href={`/trainer/trainee/${trainee.id}`}>
                              <Button size="sm" variant="ghost" className="h-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                פרטים
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          אין נתונים
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
