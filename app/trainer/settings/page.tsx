"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  User, Loader2, LogOut, Bell, Globe, HelpCircle, 
  Edit, Save, X, Lock, Mail, AlertCircle, CheckCircle2,
  Shield, Settings, ChevronRight, Camera, Award, Clock,
  Zap
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// ============================================
// TOGGLE SWITCH COMPONENT
// ============================================
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
      {label && <span className="text-white text-sm font-outfit font-medium">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300",
          checked ? 'bg-[#5B7FFF] shadow-lg shadow-[#5B7FFF]/30' : 'bg-[#3D4058]'
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300",
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
};

// ============================================
// MENU ITEM COMPONENT
// ============================================
const MenuItem = ({
  icon: Icon,
  label,
  sublabel,
  onClick,
  iconColor = "bg-[#5B7FFF]/20",
  iconTextColor = "text-[#5B7FFF]",
  showChevron = true
}: {
  icon: any;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  iconColor?: string;
  iconTextColor?: string;
  showChevron?: boolean;
}) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 hover:bg-[#3D4058] transition-all group rounded-xl"
  >
    <div className="flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", iconColor)}
        style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' }}
      >
        <Icon className={cn("w-5 h-5", iconTextColor)} />
      </div>
      <div className="text-right">
        <p className="font-outfit font-bold text-sm text-white">{label}</p>
        {sublabel && (
          <p className="text-xs text-[#9CA3AF] font-outfit">{sublabel}</p>
        )}
      </div>
    </div>
    {showChevron && (
      <ChevronRight className="w-5 h-5 text-[#9CA3AF] group-hover:translate-x-1 transition-transform" />
    )}
  </button>
);

// ============================================
// MAIN COMPONENT
// ============================================
function TrainerSettingsContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
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

  const [generalSettings, setGeneralSettings] = useState({
    notifications: true,
    emailNotifications: true,
    language: "עברית",
  });

  useEffect(() => {
    const savedGeneralSettings = localStorage.getItem('trainerGeneralSettings');
    if (savedGeneralSettings) {
      setGeneralSettings(JSON.parse(savedGeneralSettings));
    }
  }, []);

  useEffect(() => {
    if (user) {
      setEditedName(user.name || "");
      setEditedEmail(user.email || "");
    }
  }, [user]);

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
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          name: editedName,
          email: editedEmail,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      if (editedEmail !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: editedEmail
        });
        if (emailError) {
          console.error('Error updating email in auth:', emailError);
        }
      }

      setSuccess('✅ הפרופיל עודכן בהצלחה');
      setEditedName(editedName);
      setEditedEmail(editedEmail);
      setShowEditProfile(false);
      
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

      setSuccess('✅ הסיסמה עודכנה בהצלחה');
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.message || 'שגיאה בשינוי הסיסמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .slide-up {
          animation: slideUp 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4) !important;
        }
        
        .bg-texture {
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(91, 127, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(91, 127, 255, 0.02) 0%, transparent 50%);
        }
      `}</style>

      <div className="space-y-6 pb-32 bg-[#1A1D2E] min-h-screen bg-texture">
        
        {/* Header */}
        <div className="pb-4 animate-fade-in">
          <h1 className="text-3xl font-outfit font-bold text-white mb-1">הגדרות</h1>
          <p className="text-sm text-[#9CA3AF] font-outfit">נהל את החשבון וההעדפות שלך</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-[#4CAF50]/20 border-2 border-[#4CAF50] rounded-xl p-4 flex items-center gap-3 slide-up"
            style={{ boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)' }}
          >
            <CheckCircle2 className="h-5 w-5 text-[#4CAF50] flex-shrink-0" />
            <span className="font-outfit font-bold text-sm text-white">{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-[#EF4444]/20 border-2 border-[#EF4444] rounded-xl p-4 flex items-center gap-3 slide-up"
            style={{ boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)' }}
          >
            <AlertCircle className="h-5 w-5 text-[#EF4444] flex-shrink-0" />
            <span className="font-outfit font-bold text-sm text-white">{error}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-gradient-to-br from-[#5B7FFF] to-[#4A5FCC] rounded-2xl p-6 slide-up relative overflow-hidden"
          style={{ 
            animationDelay: '100ms',
            boxShadow: '0 12px 48px rgba(91, 127, 255, 0.4)'
          }}
        >
          <div className="absolute inset-0 bg-white/5" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="relative group">
              <Avatar className="w-28 h-28 border-4 border-white/20 ring-4 ring-white/10 transition-transform group-hover:scale-105">
                <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-4xl font-outfit font-bold">
                  {user?.name?.charAt(0) || 'M'}
                </AvatarFallback>
              </Avatar>
              <button 
                className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full flex items-center justify-center border-4 border-[#5B7FFF] hover:scale-110 transition-transform"
                style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }}
              >
                <Camera className="w-5 h-5 text-[#5B7FFF]" />
              </button>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <h2 className="text-2xl font-outfit font-bold text-white">
                {user?.name || "מאמן"}
              </h2>
              <p className="text-base font-outfit font-normal text-white/70">
                {user?.email || ""}
              </p>
            </div>
            
            <button
              onClick={() => {
                setShowEditProfile(true);
                setError(null);
                setSuccess(null);
              }}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-2.5 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center gap-2 hover:scale-105"
            >
              <Edit className="w-4 h-4" />
              ערוך פרופיל
            </button>
          </div>
        </div>

        {/* Account Section */}
        <div className="bg-[#2D3142] rounded-2xl overflow-hidden slide-up"
          style={{ 
            animationDelay: '200ms',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div className="p-5 border-b border-[#3D4058]">
            <h2 className="text-xl font-outfit font-bold text-white">חשבון</h2>
          </div>
          <div className="divide-y divide-[#3D4058]">
            <MenuItem
              icon={Lock}
              label="שינוי סיסמה"
              sublabel="עדכן את סיסמת החשבון שלך"
              onClick={() => {
                setShowChangePassword(true);
                setError(null);
                setSuccess(null);
              }}
            />
            <MenuItem
              icon={Shield}
              label="פרטיות ואבטחה"
              sublabel="הגדרות אבטחה ופרטיות"
              onClick={() => showToast('🛡️ Coming soon!', "info", 2000)}
            />
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-[#2D3142] rounded-2xl overflow-hidden slide-up"
          style={{ 
            animationDelay: '250ms',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div className="p-5 border-b border-[#3D4058]">
            <h2 className="text-xl font-outfit font-bold text-white">כללי</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between bg-[#1A1D2E] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#5B7FFF]/20 rounded-xl flex items-center justify-center">
                  <Bell className="h-5 w-5 text-[#5B7FFF]" />
                </div>
                <span className="text-white text-sm font-outfit font-bold">התראות</span>
              </div>
              <ToggleSwitch
                checked={generalSettings.notifications}
                onChange={(checked) => saveGeneralSettings({ ...generalSettings, notifications: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between bg-[#1A1D2E] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FF8A00]/20 rounded-xl flex items-center justify-center">
                  <Mail className="h-5 w-5 text-[#FF8A00]" />
                </div>
                <span className="text-white text-sm font-outfit font-bold">התראות אימייל</span>
              </div>
              <ToggleSwitch
                checked={generalSettings.emailNotifications}
                onChange={(checked) => saveGeneralSettings({ ...generalSettings, emailNotifications: checked })}
              />
            </div>
          </div>
          
          <div className="divide-y divide-[#3D4058]">
            <MenuItem
              icon={Globe}
              label="שפה"
              sublabel={generalSettings.language}
              iconColor="bg-[#9C27B0]/20"
              iconTextColor="text-[#9C27B0]"
              onClick={() => showToast('🌐 Coming soon!', "info", 2000)}
            />
            <MenuItem
              icon={HelpCircle}
              label="עזרה ותמיכה"
              sublabel="קבל עזרה ופתרונות לבעיות"
              iconColor="bg-[#4CAF50]/20"
              iconTextColor="text-[#4CAF50]"
              onClick={() => showToast('❓ Coming soon!', "info", 2000)}
            />
          </div>
        </div>

        {/* Logout Section */}
        <div className="bg-[#2D3142] rounded-2xl p-5 slide-up"
          style={{ 
            animationDelay: '300ms',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}
        >
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#B91C1C] text-white font-outfit font-bold rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: '0 8px 32px rgba(239, 68, 68, 0.4)' }}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                מתנתק...
              </>
            ) : (
              <>
                <LogOut className="h-5 w-5" />
                התנתק מהמערכת
              </>
            )}
          </button>
        </div>

        {/* Version */}
        <div className="text-center slide-up" style={{ animationDelay: '350ms' }}>
          <div className="inline-block bg-[#2D3142] px-4 py-2 rounded-xl border border-[#3D4058]">
            <p className="text-[#9CA3AF] text-xs font-outfit font-bold">FitLog Trainer v1.2.0</p>
          </div>
        </div>

      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="bg-[#2D3142] w-full max-w-md rounded-2xl overflow-hidden slide-up"
            style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' }}
          >
            <div className="p-6 border-b border-[#3D4058] bg-gradient-to-r from-[#5B7FFF] to-[#4A5FCC] flex items-center justify-between">
              <h3 className="text-white text-2xl font-outfit font-bold">ערוך פרופיל</h3>
              <button
                onClick={() => {
                  setShowEditProfile(false);
                  setEditedName(user?.name || "");
                  setEditedEmail(user?.email || "");
                  setError(null);
                  setSuccess(null);
                }}
                className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            <div className="space-y-5 p-6">
              {error && (
                <div className="p-4 bg-[#EF4444]/20 border border-[#EF4444] rounded-xl text-white text-sm font-outfit font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div>
                <label className="text-sm text-[#9CA3AF] mb-2 block font-outfit font-semibold">שם מלא</label>
                <Input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="bg-[#1A1D2E] border-2 border-[#3D4058] text-white rounded-xl h-12 font-outfit font-normal focus:border-[#5B7FFF] transition-all"
                  placeholder="הזן שם"
                />
              </div>
              <div>
                <label className="text-sm text-[#9CA3AF] mb-2 block font-outfit font-semibold">אימייל</label>
                <Input
                  type="email"
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  className="bg-[#1A1D2E] border-2 border-[#3D4058] text-white rounded-xl h-12 font-outfit font-normal focus:border-[#5B7FFF] transition-all"
                  placeholder="הזן אימייל"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleEditProfile}
                  disabled={loading || !editedName || !editedEmail}
                  className="flex-1 h-12 bg-[#5B7FFF] hover:bg-[#6B8EFF] text-white font-outfit font-bold rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ boxShadow: '0 4px 16px rgba(91, 127, 255, 0.4)' }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      שומר...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      שמור
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowEditProfile(false);
                    setEditedName(user?.name || "");
                    setEditedEmail(user?.email || "");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="flex-1 h-12 bg-[#1A1D2E] border-2 border-[#3D4058] text-white hover:bg-[#3D4058] font-outfit font-bold rounded-xl transition-all"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="bg-[#2D3142] w-full max-w-md rounded-2xl overflow-hidden slide-up"
            style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' }}
          >
            <div className="p-6 border-b border-[#3D4058] bg-gradient-to-r from-[#5B7FFF] to-[#4A5FCC] flex items-center justify-between">
              <h3 className="text-white text-2xl font-outfit font-bold">שינוי סיסמה</h3>
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setError(null);
                  setSuccess(null);
                }}
                className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            <div className="space-y-5 p-6">
              {error && (
                <div className="p-4 bg-[#EF4444]/20 border border-[#EF4444] rounded-xl text-white text-sm font-outfit font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div>
                <label className="text-sm text-[#9CA3AF] mb-2 block font-outfit font-semibold">סיסמה חדשה</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-[#1A1D2E] border-2 border-[#3D4058] text-white rounded-xl h-12 font-outfit font-normal focus:border-[#5B7FFF] transition-all"
                  placeholder="לפחות 6 תווים"
                />
              </div>
              <div>
                <label className="text-sm text-[#9CA3AF] mb-2 block font-outfit font-semibold">אישור סיסמה</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-[#1A1D2E] border-2 border-[#3D4058] text-white rounded-xl h-12 font-outfit font-normal focus:border-[#5B7FFF] transition-all"
                  placeholder="הזן שוב"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleChangePassword}
                  disabled={loading || !newPassword || !confirmPassword}
                  className="flex-1 h-12 bg-[#5B7FFF] hover:bg-[#6B8EFF] text-white font-outfit font-bold rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ boxShadow: '0 4px 16px rgba(91, 127, 255, 0.4)' }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      מעדכן...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      עדכן
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowChangePassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="flex-1 h-12 bg-[#1A1D2E] border-2 border-[#3D4058] text-white hover:bg-[#3D4058] font-outfit font-bold rounded-xl transition-all"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function TrainerSettingsPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <TrainerSettingsContent />
    </ProtectedRoute>
  );
}