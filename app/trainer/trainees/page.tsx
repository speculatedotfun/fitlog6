"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import { getTrainerTraineesWithDetails } from "@/lib/db";
import { createTraineeAccount } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TraineeCard } from "@/components/trainer/TraineeCard";
import { AddTraineeForm, CredentialsDisplay } from "@/components/trainer/AddTraineeForm";

function TraineesManagementContent() {
  const { user } = useAuth();
  const [showAddTraineeForm, setShowAddTraineeForm] = useState(false);
  const [trainees, setTrainees] = useState<Array<{
    id: string;
    name: string;
    email: string;
    created_at: string;
    planActive: boolean;
    planName: string | null;
    lastWorkout: string | null;
  }>>([]);
  const [newTraineeCredentials, setNewTraineeCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
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

      // Use optimized function that fetches all data in parallel queries
      const traineesWithDetails = await getTrainerTraineesWithDetails(trainerId);
      setTrainees(traineesWithDetails);
    } catch (err: any) {
      console.error("Error loading trainees:", err);
      setError(err.message || "שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrainee = async (email: string, password: string, name: string) => {
    if (!name || !email || !password) {
      setError("אנא מלא את כל השדות");
      return;
    }
    
    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }
    
    try {
      setAdding(true);
      setError(null);
      
      // trainerId is no longer needed - it's taken from the authenticated session
      await createTraineeAccount(email, password, name);
      
      // Store credentials for display/sending
      setNewTraineeCredentials({
        email,
        password,
      });
      
      setShowAddTraineeForm(false);
      await loadTrainees();
    } catch (err: any) {
      console.error("Error adding trainee:", err);
      setError(err.message || "שגיאה בהוספת מתאמן");
    } finally {
      setAdding(false);
    }
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
                <TraineeCard key={trainee.id} trainee={trainee} />
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
        <AddTraineeForm
          onAdd={handleAddTrainee}
          onCancel={() => {
            setShowAddTraineeForm(false);
            setError(null);
          }}
          adding={adding}
          error={error}
        />
      )}

      {/* Credentials Display */}
      {newTraineeCredentials && (
        <CredentialsDisplay
          email={newTraineeCredentials.email}
          password={newTraineeCredentials.password}
          onClose={() => setNewTraineeCredentials(null)}
        />
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

