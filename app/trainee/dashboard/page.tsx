"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, TrendingUp, Apple, User, Loader2, LogOut } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { getActiveWorkoutPlan, getBodyWeightHistory, getNutritionMenu, saveBodyWeight } from "@/lib/db";
import type { WorkoutPlan, NutritionMenu } from "@/lib/types";

function TraineeDashboardContent() {
  const { user, signOut } = useAuth();
  const [bodyWeight, setBodyWeight] = useState<string>("");
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [weightHistory, setWeightHistory] = useState<Array<{ date: string; weight: number }>>([]);
  const [nutritionMenu, setNutritionMenu] = useState<NutritionMenu | null>(null);

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

  const handleWeightSubmit = async () => {
    if (!user?.id || !bodyWeight) return;

    try {
      const weight = parseFloat(bodyWeight);
      if (isNaN(weight) || weight <= 0) {
        alert('אנא הזן משקל תקין');
        return;
      }

      await saveBodyWeight(user.id, weight);
      
      // Close the input and reload data
      setShowWeightInput(false);
      setBodyWeight("");
      await loadDashboardData();
    } catch (error: any) {
      console.error('Error saving weight:', error);
      alert('שגיאה בשמירת המשקל: ' + (error.message || 'שגיאה לא ידועה'));
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
        <div className="max-w-2xl mx-auto pt-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="mt-2 text-muted-foreground">טוען נתונים...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-4 pb-2">
          <h1 className="text-3xl font-bold text-gray-900">היום שלי</h1>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 ml-2" />
            התנתק
          </Button>
        </div>

        {/* Today's Workout Card */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-6 w-6" />
              <CardTitle className="text-white">האימון של היום</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {workoutPlan ? (
              <>
                <div className="text-center py-4 mb-4">
                  <div className="text-4xl font-bold mb-2">אימון חדש!</div>
                  <div className="text-lg">התוכנית שלך פעילה</div>
                </div>
                <Link href="/trainee/workout">
                  <Button className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold" size="lg">
                    התחל אימון
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <div className="text-center py-4 mb-4">
                  <div className="text-4xl font-bold mb-2">אין תוכנית</div>
                  <div className="text-lg">המאמן שלך עדיין לא יצר תוכנית אימונים</div>
                </div>
                <Button className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold opacity-50 cursor-not-allowed" size="lg" disabled>
                  המתן לתוכנית מהמאמן
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Body Weight Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gray-600" />
                <CardTitle className="text-xl">משקל גוף</CardTitle>
              </div>
              {!showWeightInput && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWeightInput(true)}
                >
                  עדכן
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!showWeightInput ? (
              <div className="text-center py-4">
                {currentWeight ? (
                  <>
                    <div className="text-4xl font-bold text-gray-900">{currentWeight} ק"ג</div>
                    <CardDescription className="mt-2">
                      נמדד לאחרונה: {new Date(weightHistory[0].date).toLocaleDateString("he-IL")}
                    </CardDescription>
                  </>
                ) : (
                  <>
                    <div className="text-4xl font-bold text-gray-400">אין נתונים</div>
                    <CardDescription className="mt-2">עדיין לא רשמת משקל</CardDescription>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="number"
                  step="0.1"
                  value={bodyWeight}
                  onChange={(e) => setBodyWeight(e.target.value)}
                  placeholder="הזן משקל (ק״ג)"
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleWeightSubmit}
                    className="flex-1"
                    disabled={!bodyWeight}
                  >
                    שמור
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowWeightInput(false);
                      setBodyWeight("");
                    }}
                    className="flex-1"
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nutrition Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Apple className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-xl">תזונה היום</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {nutritionMenu?.meals && nutritionMenu.meals.length > 0 ? (
              <>
                {/* Daily Menu from Trainer */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-semibold text-green-900 mb-2">🍽️ התפריט של היום:</p>
                  {nutritionMenu.meals.map((meal, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-semibold text-green-900">{meal.mealName}:</span>{" "}
                      <span className="text-green-800">
                        {meal.foods.map(f => `${f.foodName} ${f.amount}ג`).join(" + ")}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Placeholder for nutrition progress - will be implemented later */}
                <div className="text-center py-4 text-muted-foreground">
                  מעקב תזונה יתווסף בהמשך
                </div>
              </>
            ) : (
              <>
                {/* No menu yet */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-semibold text-yellow-900 mb-2">🍽️ אין תפריט עדיין</p>
                  <p className="text-sm text-yellow-800">
                    המאמן שלך עדיין לא יצר תפריט תזונה. תוכל להשתמש במחשבון המרות בינתיים.
                  </p>
                </div>

                {/* Placeholder for nutrition progress */}
                <div className="text-center py-4 text-muted-foreground">
                  מעקב תזונה יתווסף כשיהיה תפריט
                </div>
              </>
            )}

            <Link href="/trainee/nutrition">
              <Button variant="outline" className="w-full">
                מחשבון המרות תזונה
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">פעולות מהירות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/trainee/history">
              <Button variant="outline" className="w-full justify-start">
                צפה בהיסטוריית אימונים וגרפי התקדמות
              </Button>
            </Link>
          </CardContent>
        </Card>
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
