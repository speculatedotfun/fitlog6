"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Dumbbell, TrendingUp, Apple, User, Loader2, LogOut, Calendar, Target, Award, Activity, 
  Plus, X, CheckCircle2, AlertCircle, Clock, Trophy, Medal, Home, BarChart3, Users, Target as TargetIcon, Settings
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { getActiveWorkoutPlan, getBodyWeightHistory, getNutritionMenu, saveBodyWeight, getRoutinesWithExercises } from "@/lib/db";
import type { WorkoutPlan, NutritionMenu, RoutineWithExercises } from "@/lib/types";

function TraineeDashboardContent() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [bodyWeight, setBodyWeight] = useState<string>("");
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [currentRoutine, setCurrentRoutine] = useState<RoutineWithExercises | null>(null);
  const [weightHistory, setWeightHistory] = useState<Array<{ date: string; weight: number }>>([]);
  const [nutritionMenu, setNutritionMenu] = useState<NutritionMenu | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);
  const [savingWeight, setSavingWeight] = useState(false);

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

      // Load workout plan
      const plan = await getActiveWorkoutPlan(user.id);
      setWorkoutPlan(plan);

      // Load current routine
      if (plan) {
        const routines = await getRoutinesWithExercises(plan.id);
        if (routines.length > 0) {
          // Get today's routine (simplified - just take first routine for now)
          setCurrentRoutine(routines[0]);
        }
      }

      // Load weight history
      const weights = await getBodyWeightHistory(user.id);
      setWeightHistory(weights);

      // Load nutrition menu
      const menu = await getNutritionMenu(user.id);
      setNutritionMenu(menu);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get current weight (latest entry)
  const currentWeight = weightHistory.length > 0 ? weightHistory[0].weight : null;
  const morningWeight = currentWeight; // For display

  const handleWeightSubmit = async () => {
    if (!user?.id || !bodyWeight) return;

    setWeightError(null);
    setSavingWeight(true);

    try {
      const weight = parseFloat(bodyWeight);
      if (isNaN(weight) || weight <= 0) {
        setWeightError('אנא הזן משקל תקין (מספר חיובי)');
        setSavingWeight(false);
        return;
      }

      if (weight > 500) {
        setWeightError('המשקל שהוזן לא סביר. אנא בדוק את הערך.');
        setSavingWeight(false);
        return;
      }

      await saveBodyWeight(user.id, weight);
      
      setShowWeightInput(false);
      setBodyWeight("");
      setWeightError(null);
      await loadDashboardData();
    } catch (error: any) {
      console.error('Error saving weight:', error);
      setWeightError('שגיאה בשמירת המשקל: ' + (error.message || 'שגיאה לא ידועה'));
    } finally {
      setSavingWeight(false);
    }
  };

  // Calculate nutrition data for donut chart
  const nutritionData = {
    fluids: 2000, // ml
    protein: 150, // grams
    fat: 60, // grams
    carbs: 200, // grams
  };

  const totalCalories = 2150; // Example
  const targetCalories = 3000;
  const remainingCalories = targetCalories - totalCalories;

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
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">האימון של היום:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {workoutPlan && currentRoutine ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{workoutPlan.name} {currentRoutine.letter}</p>
                    <p className="text-sm text-muted-foreground mt-1">{currentRoutine.name}</p>
                  </div>
                  <div className="flex items-center gap-2 text-primary">
                    <Clock className="h-5 w-5" />
                    <span className="text-lg font-semibold">08:30</span>
                  </div>
                </div>
                <Link href="/trainee/workout">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 text-lg shadow-sm">
                    התחל אימון
                  </Button>
                </Link>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">אין תוכנית אימונים פעילה</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nutrition Log Section */}
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">יומן תזונה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {/* Donut Chart */}
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      className="stroke-muted"
                      strokeWidth="12"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      className="stroke-primary"
                      strokeWidth="12"
                      strokeDasharray={`${(nutritionData.fluids / 3000) * 352} 352`}
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      className="stroke-blue-500"
                      strokeWidth="12"
                      strokeDasharray={`${(nutritionData.protein / 200) * 352} 352`}
                      strokeDashoffset={`-${(nutritionData.fluids / 3000) * 352}`}
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      className="stroke-red-500"
                      strokeWidth="12"
                      strokeDasharray={`${(nutritionData.fat / 100) * 352} 352`}
                      strokeDashoffset={`-${((nutritionData.fluids / 3000) + (nutritionData.protein / 200)) * 352}`}
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      className="stroke-orange-500"
                      strokeWidth="12"
                      strokeDasharray={`${(nutritionData.carbs / 300) * 352} 352`}
                      strokeDashoffset={`-${((nutritionData.fluids / 3000) + (nutritionData.protein / 200) + (nutritionData.fat / 100)) * 352}`}
                    />
                  </svg>
                </div>
                <div className="mr-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-muted-foreground">נוזלים</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-muted-foreground">חלבון</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-muted-foreground">שומן</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-muted-foreground">פחמימות</span>
                  </div>
                </div>
              </div>

              {/* Calorie Gauge */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      className="stroke-muted"
                      strokeWidth="12"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      className="stroke-primary"
                      strokeWidth="12"
                      strokeDasharray={`${(totalCalories / targetCalories) * 352} 352`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">{remainingCalories}</span>
                    <span className="text-xs text-muted-foreground">קק"ל חסר</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Body Data Section */}
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">נתוני גוף</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {/* Weight Graph */}
              <div className="flex items-center justify-center">
                <div className="w-24 h-16 relative">
                  <svg className="w-full h-full">
                    <polyline
                      points="0,40 10,35 20,30 30,25 40,20 50,18 60,15 70,12 80,10 90,8"
                      fill="none"
                      className="stroke-primary"
                      strokeWidth="2"
                    />
                    <polygon
                      points="0,40 10,35 20,30 30,25 40,20 50,18 60,15 70,12 80,10 90,8 90,40 0,40"
                      className="fill-primary/20"
                    />
                  </svg>
                </div>
              </div>

              {/* Morning Weight */}
              <div className="flex flex-col justify-center">
                {morningWeight ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-1">משקל הבוקר:</p>
                    <p className="text-2xl font-bold text-foreground">{morningWeight} ק"ג</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-1">משקל הבוקר:</p>
                    <p className="text-lg text-muted-foreground">אין נתונים</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowWeightInput(true)}
                      className="mt-2 border-input text-muted-foreground hover:bg-accent"
                    >
                      <Plus className="h-4 w-4 ml-1" />
                      הוסף משקל
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

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
        {showWeightInput && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <Card className="bg-card border-border w-full max-w-md shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground">הוסף משקל</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowWeightInput(false);
                      setBodyWeight("");
                      setWeightError(null);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {weightError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive-foreground text-sm">
                    {weightError}
                  </div>
                )}
                <Input
                  type="number"
                  step="0.1"
                  value={bodyWeight}
                  onChange={(e) => {
                    setBodyWeight(e.target.value);
                    setWeightError(null);
                  }}
                  placeholder="הזן משקל (ק״ג)"
                  className="w-full px-4 py-8 text-3xl font-bold bg-secondary/50 border-input text-foreground text-center"
                  autoFocus
                  disabled={savingWeight}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleWeightSubmit}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12"
                    disabled={!bodyWeight || savingWeight}
                  >
                    {savingWeight ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        שומר...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 ml-2" />
                        שמור
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowWeightInput(false);
                      setBodyWeight("");
                      setWeightError(null);
                    }}
                    className="flex-1 border-input text-muted-foreground hover:bg-accent h-12"
                    disabled={savingWeight}
                  >
                    ביטול
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
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
