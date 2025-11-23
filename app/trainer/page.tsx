"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Plus, Settings, X, Loader2, LogOut } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { getTrainerTrainees, getActiveWorkoutPlan, getWorkoutLogs } from "@/lib/db";
import { createTraineeAccount } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { User as UserType } from "@/lib/types";

function TrainerDashboardContent() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [showAddTraineeForm, setShowAddTraineeForm] = useState(false);
  const [newTraineeName, setNewTraineeName] = useState("");
  const [newTraineeEmail, setNewTraineeEmail] = useState("");
  const [newTraineePassword, setNewTraineePassword] = useState("");
  const [trainees, setTrainees] = useState<Array<{
    id: string;
    name: string;
    planActive: boolean;
    lastWorkout: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trainerId = user?.id || "";

  // Reduce logging to improve performance
  // console.log('TrainerDashboard render:', { user, authLoading, trainerId, loading });

  useEffect(() => {
    console.log('Trainer useEffect triggered:', { trainerId, authLoading, user: !!user });
    if (trainerId && !authLoading) {
      console.log('Calling loadTrainees...');
      loadTrainees();
    } else if (!authLoading && !trainerId) {
      console.log('No trainerId, setting loading to false');
      setLoading(false);
    } else {
      console.log('Waiting for auth or trainerId...');
    }
  }, [trainerId, authLoading]);

  const loadTrainees = async () => {
    if (!trainerId) return;

    try {
      setLoading(true);
      setError(null);

      // Ensure Supabase client is ready
      console.log('Checking Supabase session...');
      const { data: session } = await supabase.auth.getSession();
      console.log('Session status:', !!session?.session);

      // Get all trainees in a single query
      console.log('Fetching trainees...');
      const traineesList = await getTrainerTrainees(trainerId);
      console.log('Trainees fetched:', traineesList.length);

      if (traineesList.length === 0) {
        setTrainees([]);
        setLoading(false);
        return;
      }

      // Get all active workout plans for trainees in a single query
      const traineeIds = traineesList.map(t => t.id);
      console.log('Fetching plans and logs for trainees:', traineeIds);

      // Use Promise.allSettled to handle potential errors gracefully
      const [plansResult, logsResult] = await Promise.allSettled([
        // Temporarily remove is_active filter to debug 406 error
        supabase
          .from('workout_plans')
          .select('trainee_id, is_active')
          .in('trainee_id', traineeIds),
        supabase
          .from('workout_logs')
          .select('user_id, date')
          .in('user_id', traineeIds)
          .order('date', { ascending: false })
          .limit(traineeIds.length) // One log per trainee
      ]);

      console.log('Query results:', {
        plansSuccess: plansResult.status === 'fulfilled',
        plansError: plansResult.status === 'rejected' ? plansResult.reason : null,
        logsSuccess: logsResult.status === 'fulfilled',
        logsError: logsResult.status === 'rejected' ? logsResult.reason : null
      });

      // Create maps for quick lookup
      const plansMap = new Map();
      const logsMap = new Map();

      if (plansResult.status === 'fulfilled' && plansResult.value.data) {
        // Filter for active plans in JavaScript
        plansResult.value.data
          .filter(plan => plan.is_active === true)
          .forEach(plan => plansMap.set(plan.trainee_id, true));
      }

      if (logsResult.status === 'fulfilled' && logsResult.value.data) {
        // Group logs by user and take the most recent one
        const userLogs = new Map();
        logsResult.value.data.forEach(log => {
          if (!userLogs.has(log.user_id)) {
            userLogs.set(log.user_id, log.date);
          }
        });
        userLogs.forEach((date, userId) => logsMap.set(userId, date));
      }

      // Build the final trainees list
      const traineesWithStatus = traineesList.map(trainee => ({
        id: trainee.id,
        name: trainee.name,
        planActive: plansMap.has(trainee.id),
        lastWorkout: logsMap.get(trainee.id) || null,
      }));

      setTrainees(traineesWithStatus);
    } catch (err: any) {
      console.error("Error loading trainees:", err);
      setError(err.message || "שגיאה בטעינת המתאמנים");
    } finally {
      setLoading(false);
    }
  };

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-muted-foreground">טוען משתמש...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">נדרש התחברות</h1>
          <p className="text-gray-600 mb-4">יש להתחבר כדי לגשת לדף זה</p>
          <Link href="/auth/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            התחברות
          </Link>
        </div>
      </div>
    );
  }

  const handleAddTrainee = async () => {
    if (!newTraineeName || !newTraineeEmail || !newTraineePassword) {
      setError("אנא מלא את כל השדות");
      return;
    }
    
    if (newTraineePassword.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }
    
    try {
      setAdding(true);
      setError(null);
      
      // Create trainee account with username/password
      await createTraineeAccount(
        newTraineeEmail,
        newTraineePassword,
        newTraineeName,
        trainerId
      );
      
      setNewTraineeName("");
      setNewTraineeEmail("");
      setNewTraineePassword("");
      setShowAddTraineeForm(false);
      await loadTrainees(); // Reload the list
    } catch (err: any) {
      console.error("Error adding trainee:", err);
      setError(err.message || "שגיאה בהוספת מתאמן");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto pt-8 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl text-center">דשבורד מאמן</CardTitle>
                <CardDescription className="text-center">
                  שלום {user?.name}! בנה תוכניות אימונים וצפה בהתקדמות המתאמנים
                </CardDescription>
              </div>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="h-4 w-4 ml-2" />
                התנתק
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Add New Trainee */}
        {!showAddTraineeForm ? (
          <Card className="border-dashed border-2">
            <CardContent className="pt-6">
              <Button 
                variant="outline" 
                className="w-full h-20 text-lg"
                onClick={() => setShowAddTraineeForm(true)}
              >
                <Plus className="ml-2 h-5 w-5" />
                הוסף מתאמן חדש
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>הוסף מתאמן חדש</CardTitle>
                  <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowAddTraineeForm(false);
                    setNewTraineeName("");
                    setNewTraineeEmail("");
                    setNewTraineePassword("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-2 block">שם המתאמן</label>
                <Input
                  type="text"
                  placeholder="הזן שם"
                  value={newTraineeName}
                  onChange={(e) => setNewTraineeName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">אימייל (שם משתמש)</label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={newTraineeEmail}
                  onChange={(e) => setNewTraineeEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">סיסמה</label>
                <Input
                  type="password"
                  placeholder="לפחות 6 תווים"
                  value={newTraineePassword}
                  onChange={(e) => setNewTraineePassword(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAddTrainee}
                  disabled={!newTraineeName || !newTraineeEmail || !newTraineePassword || adding}
                  className="flex-1"
                >
                  {adding ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      מוסיף...
                    </>
                  ) : (
                    "הוסף מתאמן"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddTraineeForm(false);
                    setNewTraineeName("");
                    setNewTraineeEmail("");
                    setNewTraineePassword("");
                  }}
                  className="flex-1"
                >
                  ביטול
                </Button>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Trainees List */}
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="mt-2 text-muted-foreground">טוען מתאמנים...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trainees.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">אין מתאמנים עדיין. הוסף מתאמן חדש כדי להתחיל.</p>
                </CardContent>
              </Card>
            ) : (
              trainees.map((trainee) => (
            <Card key={trainee.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-xl">{trainee.name}</CardTitle>
                  </div>
                  {trainee.planActive && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      פעיל
                    </span>
                  )}
                </div>
                {trainee.lastWorkout && (
                  <CardDescription>
                    אימון אחרון: {new Date(trainee.lastWorkout).toLocaleDateString("he-IL")}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Link href={`/trainer/trainee/${trainee.id}`}>
                  <Button className="w-full" size="lg">
                    <Settings className="ml-2 h-4 w-4" />
                    ניהול מתאמן
                  </Button>
                </Link>
              </CardContent>
            </Card>
              ))
            )}
          </div>
        )}

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">💡 איך זה עובד?</h3>
              <p className="text-sm text-muted-foreground">
                המאמן בונה תוכניות אימונים ומעדכן משקלים שבועיים. המתאמן רושם את האימונים בעצמו.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Temporarily remove ProtectedRoute to debug loading issue
export default function TrainerDashboard() {
  return <TrainerDashboardContent />;
}
