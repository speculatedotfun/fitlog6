"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  User, Loader2, LogOut, Bell, Globe, HelpCircle, 
  Edit, Save, X, Lock, Mail, AlertCircle, CheckCircle2
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

function TrainerSettingsContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || "");
  const [editedEmail, setEditedEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Settings state - load from localStorage
  const [generalSettings, setGeneralSettings] = useState({
    notifications: true,
    emailNotifications: true,
    language: "עברית",
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedGeneralSettings = localStorage.getItem('trainerGeneralSettings');
    if (savedGeneralSettings) {
      setGeneralSettings(JSON.parse(savedGeneralSettings));
    }
  }, []);

  // Update local state when user changes
  useEffect(() => {
    if (user) {
      setEditedName(user.name || "");
      setEditedEmail(user.email || "");
    }
  }, [user]);

  // Save settings to localStorage
  const saveGeneralSettings = (newSettings: typeof generalSettings) => {
    setGeneralSettings(newSettings);
    localStorage.setItem('trainerGeneralSettings', JSON.stringify(newSettings));
  };

  const handleLogout = async () => {
    if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
      setLoading(true);
      try {
        await signOut();
        router.push('/auth/login');
      } catch (error) {
        console.error('Error signing out:', error);
        setError('שגיאה בהתנתקות');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditProfile = async () => {
    if (!user?.id) return;
    
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Update user in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          name: editedName,
          email: editedEmail,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update email in auth if changed
      if (editedEmail !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: editedEmail
        });
        if (emailError) {
          console.error('Error updating email in auth:', emailError);
          // Don't fail the whole operation if email update fails
        }
      }

      setSuccess('הפרופיל עודכן בהצלחה');
      
      // Update local state immediately for better UX
      // The auth state change listener will update the global user state
      setEditedName(editedName);
      setEditedEmail(editedEmail);
      setShowEditProfile(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'שגיאה בעדכון הפרופיל');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('אנא מלא את כל השדות');
      return;
    }

    if (newPassword.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (passwordError) throw passwordError;

      setSuccess('הסיסמה עודכנה בהצלחה');
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.message || 'שגיאה בשינוי הסיסמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 lg:p-6 space-y-6" dir="rtl">
      <h2 className="text-3xl font-bold text-white">הגדרות מאמן</h2>

      {/* Success/Error Messages */}
      {success && (
        <Card className="bg-green-900/30 border-green-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span>{success}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="bg-red-900/30 border-red-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Section */}
      <Card className="bg-[#1a2332] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">פרופיל</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#0f1a2a] border-2 border-gray-700 flex items-center justify-center">
              <User className="h-8 w-8 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-xl font-semibold text-white">{user?.name || "מאמן"}</p>
              <p className="text-sm text-gray-400">{user?.email || ""}</p>
            </div>
            <Button
              onClick={() => {
                setShowEditProfile(true);
                setError(null);
                setSuccess(null);
              }}
              className="bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
            >
              <Edit className="h-4 w-4 ml-2" />
              ערוך פרופיל
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card className="bg-[#1a2332] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">הגדרות חשבון</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => {
              setShowChangePassword(true);
              setError(null);
              setSuccess(null);
            }}
            variant="outline"
            className="w-full justify-start bg-[#0f1a2a] hover:bg-[#1a2332] text-white border-gray-700 h-auto py-3"
          >
            <Lock className="h-5 w-5 ml-3" />
            <div className="text-right">
              <p className="font-semibold">שינוי סיסמה</p>
              <p className="text-xs text-gray-400">עדכן את סיסמת החשבון שלך</p>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card className="bg-[#1a2332] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">הגדרות כלליות</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-500" />
              <span className="text-white text-sm">התראות</span>
            </div>
            <ToggleSwitch
              checked={generalSettings.notifications}
              onChange={(checked) => saveGeneralSettings({ ...generalSettings, notifications: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <span className="text-white text-sm">התראות אימייל</span>
            </div>
            <ToggleSwitch
              checked={generalSettings.emailNotifications}
              onChange={(checked) => saveGeneralSettings({ ...generalSettings, emailNotifications: checked })}
            />
          </div>
          <button
            onClick={() => {
              alert('שינוי שפה יושם בקרוב');
            }}
            className="w-full flex items-center justify-between text-white hover:bg-gray-800 rounded-lg p-3 -mx-3"
          >
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-gray-500" />
              <span className="text-sm">שפה ({generalSettings.language})</span>
            </div>
          </button>
          <button
            onClick={() => {
              alert('עזרה ותמיכה יושם בקרוב');
            }}
            className="w-full flex items-center justify-between text-white hover:bg-gray-800 rounded-lg p-3 -mx-3"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-gray-500" />
              <span className="text-sm">עזרה ותמיכה</span>
            </div>
          </button>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Card className="bg-[#1a2332] border-gray-800">
        <CardContent className="pt-6">
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
        </CardContent>
      </Card>

      {/* Version */}
      <div className="text-center text-gray-500 text-sm py-2">
        גרסה 1.2.0
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <Card className="bg-[#1a2332] border-gray-800 w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">ערוך פרופיל</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowEditProfile(false);
                    setEditedName(user?.name || "");
                    setEditedEmail(user?.email || "");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
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
                <label className="text-sm text-gray-400 mb-2 block">שם</label>
                <Input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="bg-[#0f1a2a] border-gray-700 text-white"
                  placeholder="הזן שם"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">אימייל</label>
                <Input
                  type="email"
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  className="bg-[#0f1a2a] border-gray-700 text-white"
                  placeholder="הזן אימייל"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleEditProfile}
                  disabled={loading || !editedName || !editedEmail}
                  className="flex-1 bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      שומר...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 ml-2" />
                      שמור
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditProfile(false);
                    setEditedName(user?.name || "");
                    setEditedEmail(user?.email || "");
                    setError(null);
                    setSuccess(null);
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

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <Card className="bg-[#1a2332] border-gray-800 w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">שינוי סיסמה</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowChangePassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
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
                <label className="text-sm text-gray-400 mb-2 block">סיסמה חדשה</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-[#0f1a2a] border-gray-700 text-white"
                  placeholder="הזן סיסמה חדשה (לפחות 6 תווים)"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">אישור סיסמה</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-[#0f1a2a] border-gray-700 text-white"
                  placeholder="הזן שוב את הסיסמה החדשה"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={loading || !newPassword || !confirmPassword}
                  className="flex-1 bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      מעדכן...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 ml-2" />
                      עדכן סיסמה
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowChangePassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setError(null);
                    setSuccess(null);
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
  );
}

export default function TrainerSettingsPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <TrainerSettingsContent />
    </ProtectedRoute>
  );
}

