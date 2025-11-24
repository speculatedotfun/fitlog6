"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dumbbell, Apple, Loader2, Trophy, Medal, Home, BarChart3, Settings
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { getActiveWorkoutPlan, getBodyWeightHistory, getNutritionMenu, saveBodyWeight, getRoutinesWithExercises, getDailyNutritionLog } from "@/lib/db";
import { getNutritionTargets } from "@/lib/nutrition-config";
import { WeightInputModal } from "@/components/trainee/WeightInputModal";
import { BodyDataCard } from "@/components/trainee/BodyDataCard";
import { DailyWorkoutCard } from "@/components/trainee/DailyWorkoutCard";
import { NutritionSummary } from "@/components/trainee/NutritionSummary";
import type { WorkoutPlan, NutritionMenu, RoutineWithExercises, DailyNutritionLog } from "@/lib/types";

function TraineeDashboardContent() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [currentRoutine, setCurrentRoutine] = useState<RoutineWithExercises | null>(null);
  const [weightHistory, setWeightHistory] = useState<Array<{ date: string; weight: number }>>([]);
  const [nutritionMenu, setNutritionMenu] = useState<NutritionMenu | null>(null);
  const [nutritionLog, setNutritionLog] = useState<DailyNutritionLog | null>(null);

  // Load data from Supabase
  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Load independent data in parallel
      const [plan, weights, menu, log] = await Promise.all([
        getActiveWorkoutPlan(user.id),
        getBodyWeightHistory(user.id),
        getNutritionMenu(user.id),
        getDailyNutritionLog(user.id),
      ]);

      setWorkoutPlan(plan);
      setWeightHistory(weights);
      setNutritionMenu(menu);
      setNutritionLog(log);

      // Load routines only if plan exists (dependent on plan)
      if (plan) {
        const routines = await getRoutinesWithExercises(plan.id);
        if (routines.length > 0) {
          // Get today's routine (simplified - just take first routine for now)
          setCurrentRoutine(routines[0]);
        }
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightSave = async (weight: number) => {
    if (!user?.id) return;
    await saveBodyWeight(user.id, weight);
    await loadDashboardData();
  };

  // Get nutrition targets from configuration
  const nutritionTargets = getNutritionTargets(user?.id);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground font-medium">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24" dir="rtl">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-20 pt-safe">
        <div className="px-4 py-4 flex items-center justify-center">
          <h1 className="text-lg font-bold">
            <span className="text-foreground">Universal </span>
            <span className="text-primary">FitLog</span>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-6">
        <h2 className="text-2xl font-bold text-foreground">דשבורד מתאמן</h2>

        {/* Today's Workout Section */}
        <DailyWorkoutCard 
          workoutPlan={workoutPlan}
          currentRoutine={currentRoutine}
        />

        {/* Nutrition Log Section */}
        <NutritionSummary 
          nutritionLog={nutritionLog}
          targets={nutritionTargets}
        />

        {/* Body Data Section */}
        <BodyDataCard
          weightHistory={weightHistory}
          onAddWeight={() => setShowWeightInput(true)}
        />

        {/* New Achievements Section */}
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">הישגים חדשים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Medal className="h-8 w-8 text-white" />
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">בנץ' פרס</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">סקוואט</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weight Input Modal */}
        <WeightInputModal
          isOpen={showWeightInput}
          onClose={() => setShowWeightInput(false)}
          onSave={handleWeightSave}
        />
      </main>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe z-30">
        <div className="flex items-center justify-around">
          <Link href="/trainee/dashboard" className="flex flex-col items-center gap-1 py-3 px-2 flex-1 hover:bg-accent/50 transition-colors">
            <Home className={`h-6 w-6 ${pathname === '/trainee/dashboard' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-medium ${pathname === '/trainee/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}>בית</span>
          </Link>
          <Link href="/trainee/history" className="flex flex-col items-center gap-1 py-3 px-2 flex-1 hover:bg-accent/50 transition-colors">
            <BarChart3 className={`h-6 w-6 ${pathname === '/trainee/history' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-medium ${pathname === '/trainee/history' ? 'text-primary' : 'text-muted-foreground'}`}>התקדמות</span>
          </Link>
          <Link href="/trainee/nutrition" className="flex flex-col items-center gap-1 py-3 px-2 flex-1 hover:bg-accent/50 transition-colors">
            <Apple className={`h-6 w-6 ${pathname === '/trainee/nutrition' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-medium ${pathname === '/trainee/nutrition' ? 'text-primary' : 'text-muted-foreground'}`}>תזונה</span>
          </Link>
          <Link href="/trainee/workout" className="flex flex-col items-center gap-1 py-3 px-2 flex-1 hover:bg-accent/50 transition-colors">
            <Dumbbell className={`h-6 w-6 ${pathname?.startsWith('/trainee/workout') ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-medium ${pathname?.startsWith('/trainee/workout') ? 'text-primary' : 'text-muted-foreground'}`}>אימון</span>
          </Link>
          <Link href="/trainee/settings" className="flex flex-col items-center gap-1 py-3 px-2 flex-1 hover:bg-accent/50 transition-colors">
            <Settings className={`h-6 w-6 ${pathname === '/trainee/settings' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-medium ${pathname === '/trainee/settings' ? 'text-primary' : 'text-muted-foreground'}`}>הגדרות</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TraineeDashboard() {
  return (
    <ProtectedRoute requiredRole="trainee">
      <TraineeDashboardContent />
    </ProtectedRoute>
  );
}
