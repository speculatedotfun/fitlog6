"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, User, Loader2, LogOut, Bell, Globe, HelpCircle, 
  ChevronLeft, Edit, Home, BarChart3, Users, Target, Settings, Apple, Dumbbell
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// Toggle Switch Component
const ToggleSwitch = ({ 
  checked, 
  onChange, 
  label 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void;
  label?: string;
}) => {
  return (
    <div className="flex items-center justify-between">
      {label && <span className="text-white text-sm">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${checked ? 'bg-[#00ff88]' : 'bg-gray-700'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
};

function SettingsContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || "");

  // Settings state - load from localStorage
  const [workoutSettings, setWorkoutSettings] = useState({
    useKg: true, // יחידות מידה (ק"ג)
    defaultTimer: false, // טיימר ברירת מחדל
    defaultTimerSeconds: 60,
  });

  const [nutritionSettings, setNutritionSettings] = useState({
    dailyCalorieTarget: 2500,
  });

  const [generalSettings, setGeneralSettings] = useState({
    notifications: true,
    language: "עברית",
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedWorkoutSettings = localStorage.getItem('workoutSettings');
    const savedNutritionSettings = localStorage.getItem('nutritionSettings');
    const savedGeneralSettings = localStorage.getItem('generalSettings');

    if (savedWorkoutSettings) {
      setWorkoutSettings(JSON.parse(savedWorkoutSettings));
    }
    if (savedNutritionSettings) {
      setNutritionSettings(JSON.parse(savedNutritionSettings));
    }
    if (savedGeneralSettings) {
      setGeneralSettings(JSON.parse(savedGeneralSettings));
    }
  }, []);

  // Save settings to localStorage
  const saveWorkoutSettings = (newSettings: typeof workoutSettings) => {
    setWorkoutSettings(newSettings);
    localStorage.setItem('workoutSettings', JSON.stringify(newSettings));
  };

  const saveNutritionSettings = (newSettings: typeof nutritionSettings) => {
    setNutritionSettings(newSettings);
    localStorage.setItem('nutritionSettings', JSON.stringify(newSettings));
  };

  const saveGeneralSettings = (newSettings: typeof generalSettings) => {
    setGeneralSettings(newSettings);
    localStorage.setItem('generalSettings', JSON.stringify(newSettings));
  };

  const handleLogout = async () => {
    if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
      setLoading(true);
      try {
        await signOut();
        router.push('/auth/login');
      } catch (error) {
        console.error('Error signing out:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditProfile = async () => {
    // TODO: Implement profile update in Supabase
    // For now, just close the modal
    setShowEditProfile(false);
    alert('עדכון פרופיל יושם בקרוב');
  };

  return (
    <div className="min-h-screen bg-[#0f1a2a] pb-20" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0f1a2a] border-b border-gray-800 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/trainee/dashboard">
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-white flex-1">פרופיל והגדרות</h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Profile Section */}
        <div className="flex flex-col items-center py-6">
          <div className="w-24 h-24 rounded-full bg-[#1a2332] border-2 border-gray-700 flex items-center justify-center mb-4">
            <User className="h-12 w-12 text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-3">{user?.name || "מתאמן"}</h2>
          <Button
            onClick={() => setShowEditProfile(true)}
            className="bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
          >
            <Edit className="h-4 w-4 ml-2" />
            ערוך פרופיל
          </Button>
        </div>

        {/* Workout Settings */}
        <Card className="bg-[#1a2332] border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">הגדרות אימון</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">יחידות מידה (ק"ג)</span>
              <ToggleSwitch
                checked={workoutSettings.useKg}
                onChange={(checked) => saveWorkoutSettings({ ...workoutSettings, useKg: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">טיימר ברירת מחדל (60ש)</span>
              <ToggleSwitch
                checked={workoutSettings.defaultTimer}
                onChange={(checked) => saveWorkoutSettings({ ...workoutSettings, defaultTimer: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Nutrition Settings */}
        <Card className="bg-[#1a2332] border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">הגדרות תזונה</CardTitle>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => {
                const newTarget = prompt('הזן יעד קלורי יומי:', nutritionSettings.dailyCalorieTarget.toString());
                if (newTarget && !isNaN(Number(newTarget))) {
                  saveNutritionSettings({ ...nutritionSettings, dailyCalorieTarget: Number(newTarget) });
                }
              }}
              className="w-full flex items-center justify-between text-white hover:bg-gray-800 rounded-lg p-2 -mx-2"
            >
              <span className="text-sm">יעד קלורי יומי ({nutritionSettings.dailyCalorieTarget})</span>
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            </button>
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card className="bg-[#1a2332] border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">כללי</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              onClick={() => {
                saveGeneralSettings({ ...generalSettings, notifications: !generalSettings.notifications });
              }}
              className="w-full flex items-center justify-between text-white hover:bg-gray-800 rounded-lg p-2 -mx-2"
            >
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-gray-500" />
                <span className="text-sm">התראות</span>
              </div>
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            </button>
            <button
              onClick={() => {
                alert('שינוי שפה יושם בקרוב');
              }}
              className="w-full flex items-center justify-between text-white hover:bg-gray-800 rounded-lg p-2 -mx-2"
            >
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-gray-500" />
                <span className="text-sm">שפה ({generalSettings.language})</span>
              </div>
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            </button>
            <button
              onClick={() => {
                alert('עזרה ותמיכה יושם בקרוב');
              }}
              className="w-full flex items-center justify-between text-white hover:bg-gray-800 rounded-lg p-2 -mx-2"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-gray-500" />
                <span className="text-sm">עזרה ותמיכה</span>
              </div>
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            </button>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              מתנתק...
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4 ml-2" />
              התנתק
            </>
          )}
        </Button>

        {/* Version */}
        <div className="text-center text-gray-500 text-sm py-2">
          גרסה 1.2.0
        </div>

        {/* Edit Profile Modal */}
        {showEditProfile && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <Card className="bg-[#1a2332] border-gray-800 w-full max-w-sm">
              <CardHeader>
                <CardTitle className="text-white">ערוך פרופיל</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">שם</label>
                  <Input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="bg-[#0f1a2a] border-gray-700 text-white"
                    placeholder="הזן שם"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleEditProfile}
                    className="flex-1 bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
                  >
                    שמור
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditProfile(false);
                      setEditedName(user?.name || "");
                    }}
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
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
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a2332] border-t border-gray-800 px-4 py-2 pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <Link href="/trainee/dashboard" className="flex flex-col items-center gap-1 py-2 px-4">
            <Home className={`h-5 w-5 ${pathname === '/trainee/dashboard' ? 'text-[#00ff88]' : 'text-gray-500'}`} />
            <span className={`text-xs ${pathname === '/trainee/dashboard' ? 'text-[#00ff88]' : 'text-gray-500'}`}>בית</span>
          </Link>
          <Link href="/trainee/history" className="flex flex-col items-center gap-1 py-2 px-4">
            <BarChart3 className={`h-5 w-5 ${pathname === '/trainee/history' ? 'text-[#00ff88]' : 'text-gray-500'}`} />
            <span className={`text-xs ${pathname === '/trainee/history' ? 'text-[#00ff88]' : 'text-gray-500'}`}>התקדמות</span>
          </Link>
          <Link href="/trainee/nutrition" className="flex flex-col items-center gap-1 py-2 px-4">
            <Apple className={`h-5 w-5 ${pathname === '/trainee/nutrition' ? 'text-[#00ff88]' : 'text-gray-500'}`} />
            <span className={`text-xs ${pathname === '/trainee/nutrition' ? 'text-[#00ff88]' : 'text-gray-500'}`}>תזונה</span>
          </Link>
          <Link href="/trainee/workout" className="flex flex-col items-center gap-1 py-2 px-4">
            <Dumbbell className={`h-5 w-5 ${pathname?.startsWith('/trainee/workout') ? 'text-[#00ff88]' : 'text-gray-500'}`} />
            <span className={`text-xs ${pathname?.startsWith('/trainee/workout') ? 'text-[#00ff88]' : 'text-gray-500'}`}>אימון</span>
          </Link>
          <Link href="/trainee/settings" className="flex flex-col items-center gap-1 py-2 px-4">
            <Settings className={`h-5 w-5 ${pathname === '/trainee/settings' ? 'text-[#00ff88]' : 'text-gray-500'}`} />
            <span className={`text-xs ${pathname === '/trainee/settings' ? 'text-[#00ff88]' : 'text-gray-500'}`}>הגדרות</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredRole="trainee">
      <SettingsContent />
    </ProtectedRoute>
  );
}

