"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, Loader2, X, Settings
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { getTrainerTrainees, getActiveWorkoutPlan, getWorkoutLogs } from "@/lib/db";
import { createTraineeAccount } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function TraineesManagementContent() {
  const { user } = useAuth();
  const [showAddTraineeForm, setShowAddTraineeForm] = useState(false);
  const [newTraineeName, setNewTraineeName] = useState("");
  const [newTraineeEmail, setNewTraineeEmail] = useState("");
  const [newTraineePassword, setNewTraineePassword] = useState("");
  const [trainees, setTrainees] = useState<Array<{
    id: string;
    name: string;
    email: string;
    created_at: string;
    planActive: boolean;
    planName: string | null;
    lastWorkout: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trainerId = user?.id || "";

  useEffect(() => {
    if (trainerId) {
      loadTrainees();
    }
  }, [trainerId]);

  const loadTrainees = async () => {
    if (!trainerId) return;

    try {
      setLoading(true);
      setError(null);

      const traineesList = await getTrainerTrainees(trainerId);

      // Map trainees with full details
      const traineesWithDetails = await Promise.all(
        traineesList.map(async (t) => {
          try {
            const [plan, logs] = await Promise.all([
              getActiveWorkoutPlan(t.id).catch(() => null),
              getWorkoutLogs(t.id, 1).catch(() => []),
            ]);
            const lastWorkout = logs.length > 0 ? logs[0].date : null;
            
            return {
              id: t.id,
              name: t.name,
              email: t.email,
              created_at: t.created_at,
              planActive: !!plan,
              planName: plan?.name || null,
              lastWorkout,
            };
          } catch (err) {
            // If error loading individual trainee data, return basic info
            return {
              id: t.id,
              name: t.name,
              email: t.email,
              created_at: t.created_at,
              planActive: false,
              planName: null,
              lastWorkout: null,
            };
          }
        })
      );

      setTrainees(traineesWithDetails);
    } catch (err: any) {
      console.error("Error loading trainees:", err);
      setError(err.message || "שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  };

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
      await loadTrainees();
    } catch (err: any) {
      console.error("Error adding trainee:", err);
      setError(err.message || "שגיאה בהוספת מתאמן");
    } finally {
      setAdding(false);
    }
  };

  const formatJoinDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <main className="p-4 lg:p-6 space-y-6">
      <h2 className="text-3xl font-bold text-white">ניהול מתאמנים</h2>

      {/* Trainees Management Section */}
      <Card className="bg-[#1a2332] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-2xl">ניהול מתאמנים</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#00ff88]" />
            </div>
          ) : trainees.length > 0 ? (
            <div className="space-y-4">
              {trainees.map((trainee) => (
                <Card key={trainee.id} className="bg-[#0f1a2a] border-gray-800 hover:border-[#00ff88]/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-16 h-16 rounded-full bg-[#00ff88] flex items-center justify-center text-black font-bold text-xl">
                          {trainee.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">{trainee.name}</h3>
                          <div className="space-y-1 text-sm text-gray-400">
                            <p>{trainee.email}</p>
                            <p>הצטרף: {formatJoinDate(trainee.created_at)}</p>
                            <p className={trainee.planActive ? "text-green-400" : "text-gray-500"}>
                              תוכנית פעילה: {trainee.planName || "אין תוכנית"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {trainee.planActive && (
                          <Link href={`/trainer/workout-plans/${trainee.id}/edit`}>
                            <Button className="bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold whitespace-nowrap">
                              צפה בתוכנית
                            </Button>
                          </Link>
                        )}
                        <Link href={`/trainer/trainee/${trainee.id}`}>
                          <Button className="bg-[#1a2332] border border-gray-700 text-gray-300 hover:bg-gray-800 font-semibold whitespace-nowrap">
                            <Settings className="ml-2 h-4 w-4" />
                            ניהול מתאמן
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">אין מתאמנים עדיין</p>
              <Button 
                onClick={() => setShowAddTraineeForm(true)}
                className="bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
              >
                <Plus className="ml-2 h-4 w-4" />
                הוסף מתאמן חדש
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Trainee Section */}
      {showAddTraineeForm && (
        <Card className="bg-[#1a2332] border-2 border-[#00ff88]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">הוסף מתאמן חדש</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowAddTraineeForm(false);
                  setNewTraineeName("");
                  setNewTraineeEmail("");
                  setNewTraineePassword("");
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800 rounded-md text-red-300 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-300">שם המתאמן</label>
              <Input
                type="text"
                placeholder="הזן שם"
                value={newTraineeName}
                onChange={(e) => setNewTraineeName(e.target.value)}
                className="bg-[#0f1a2a] border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-300">אימייל (שם משתמש)</label>
              <Input
                type="email"
                placeholder="example@email.com"
                value={newTraineeEmail}
                onChange={(e) => setNewTraineeEmail(e.target.value)}
                className="bg-[#0f1a2a] border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-300">סיסמה</label>
              <Input
                type="password"
                placeholder="לפחות 6 תווים"
                value={newTraineePassword}
                onChange={(e) => setNewTraineePassword(e.target.value)}
                className="bg-[#0f1a2a] border-gray-700 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddTrainee}
                disabled={!newTraineeName || !newTraineeEmail || !newTraineePassword || adding}
                className="flex-1 bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
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
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                ביטול
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Trainee Button (when form is not shown) */}
      {!showAddTraineeForm && (
        <Card className="bg-[#1a2332] border-gray-800 border-dashed">
          <CardContent className="pt-6">
            <Button 
              variant="outline" 
              className="w-full h-20 text-lg border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={() => setShowAddTraineeForm(true)}
            >
              <Plus className="ml-2 h-5 w-5" />
              הוסף מתאמן חדש
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

export default function TraineesManagementPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <TraineesManagementContent />
    </ProtectedRoute>
  );
}

