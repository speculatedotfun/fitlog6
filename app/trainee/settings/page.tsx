"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  User, Loader2, LogOut, Bell, Globe, HelpCircle, 
  Edit, Settings as SettingsIcon, Dumbbell, Apple,
  Camera, Trophy, Award, Clock, ChevronRight, Target,
  Flame, Star, TrendingUp, Zap, Shield, Lock
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getWorkoutLogs } from "@/lib/db";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

// ============================================
// ANIMATED COUNTER COMPONENT
// ============================================
const AnimatedCounter = ({ 
  value, 
  suffix = "",
  duration = 1000,
  delay = 0 
}: { 
  value: number; 
  suffix?: string;
  duration?: number;
  delay?: number;
}) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    const steps = 30;
    const stepDuration = duration / steps;
    const increment = value / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [value, duration, started]);

  return <>{count}{suffix}</>;
};

// ============================================
// CIRCULAR PROGRESS COMPONENT
// ============================================
const CircularProgress = ({ 
  progress, 
  size = 140,
  strokeWidth = 12,
  color = "#5B7FFF"
}: { 
  progress: number; 
  size?: number;
  strokeWidth?: number;
  color?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg 
        className="transform -rotate-90 transition-all duration-1000 ease-out"
        width={size} 
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#3D4058"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
      </svg>
    </div>
  );
};

// ============================================
// SKELETON LOADER COMPONENT
// ============================================
const SkeletonCard = ({ delay = 0 }: { delay?: number }) => (
  <div 
    className="flex flex-col items-center gap-3 animate-pulse"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="w-14 h-14 bg-[#3D4058] rounded-xl" />
    <div className="h-6 w-12 bg-[#3D4058] rounded" />
    <div className="h-4 w-16 bg-[#3D4058] rounded" />
  </div>
);

// ============================================
// STATS CARD COMPONENT
// ============================================
const StatsCard = ({
  icon: Icon,
  value,
  label,
  color,
  suffix = "",
  delay = 0,
  loading = false
}: {
  icon: any;
  value: number;
  label: string;
  color: string;
  suffix?: string;
  delay?: number;
  loading?: boolean;
}) => {
  if (loading) return <SkeletonCard delay={delay} />;

  return (
    <div 
      className="flex flex-col items-center gap-3 slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div 
        className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center hover-lift transition-all`}
        style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)' }}
      >
        <Icon className="w-7 h-7 text-white" />
      </div>
      <div className="text-2xl font-outfit font-bold text-white">
        <AnimatedCounter value={value} suffix={suffix} delay={delay} />
      </div>
      <div className="text-xs font-outfit font-medium text-[#9CA3AF] text-center leading-tight">
        {label}
      </div>
    </div>
  );
};

// ============================================
// ACHIEVEMENT CARD COMPONENT
// ============================================
const AchievementCard = ({
  achievement,
  index = 0
}: {
  achievement: any;
  index?: number;
}) => (
  <div
    className="flex-shrink-0 bg-[#2D3142] rounded-2xl p-4 flex flex-col items-center gap-3 w-[130px] hover-lift transition-all slide-up"
    style={{ 
      animationDelay: `${index * 80}ms`,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
    }}
  >
    <div 
      className="w-20 h-20 rounded-full bg-cover bg-center border-4 border-[#1A1D2E] relative overflow-hidden group"
      style={{ backgroundImage: `url(${achievement.image})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Trophy className="w-6 h-6 text-white" />
      </div>
    </div>
    <div className="text-sm font-outfit font-bold text-white text-center line-clamp-2">
      {achievement.title}
    </div>
    <div className="text-xs font-outfit font-normal text-[#9CA3AF] text-center">
      {achievement.date}
    </div>
  </div>
);

// ============================================
// MENU ITEM COMPONENT
// ============================================
const MenuItem = ({
  icon: Icon,
  label,
  onClick,
  iconColor = "bg-[#5B7FFF]",
  showChevron = true
}: {
  icon: any;
  label: string;
  onClick?: () => void;
  iconColor?: string;
  showChevron?: boolean;
}) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 hover:bg-[#3D4058] transition-all group"
  >
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 ${iconColor} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}
        style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' }}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-base font-outfit font-medium text-white">
        {label}
      </span>
    </div>
    {showChevron && (
      <ChevronRight className="w-5 h-5 text-[#9CA3AF] group-hover:translate-x-1 transition-transform" />
    )}
  </button>
);

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
      {label && <span className="text-white text-sm font-medium">{label}</span>}
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
// MAIN COMPONENT
// ============================================
function SettingsPageContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Settings state
  const [workoutSettings, setWorkoutSettings] = useState({
    useKg: true,
    defaultTimer: true,
  });

  const [nutritionSettings, setNutritionSettings] = useState({
    dailyCalorieTarget: 2500,
  });

  const [generalSettings, setGeneralSettings] = useState({
    notifications: true,
    language: "English",
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(user?.profile_image_url || null);

  // Load settings from localStorage
  useEffect(() => {
    const savedWorkout = localStorage.getItem("workoutSettings");
    const savedNutrition = localStorage.getItem("nutritionSettings");
    const savedGeneral = localStorage.getItem("generalSettings");

    if (savedWorkout) setWorkoutSettings(JSON.parse(savedWorkout));
    if (savedNutrition) setNutritionSettings(JSON.parse(savedNutrition));
    if (savedGeneral) setGeneralSettings(JSON.parse(savedGeneral));
  }, []);

  // Update image preview when user changes
  useEffect(() => {
    if (user?.profile_image_url) {
      setImagePreview(user.profile_image_url);
    } else {
      setImagePreview(null);
    }
  }, [user?.profile_image_url]);

  // Load workout logs for stats
  useEffect(() => {
    if (!user?.id) return;

    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const logs = await getWorkoutLogs(user.id, 365);
        setWorkoutLogs(logs || []);
      } catch (err) {
        console.error("Error loading workout stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [user?.id]);

  const handleLogout = async () => {
    setLoading(true);
    await signOut();
    router.push("/auth/login");
  };

  const handleSaveProfile = () => {
    setShowEditProfile(false);
    showToast('✅ Profile updated!', "success", 2000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('❌ הקובץ חייב להיות תמונה', "error", 3000);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('❌ גודל הקובץ חייב להיות קטן מ-5MB', "error", 3000);
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);

      const response = await fetch('/api/upload/profile-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Check for bucket not found error
        if (data.errorCode === 'BUCKET_NOT_FOUND') {
          showToast(
            '❌ ה-bucket לא קיים. אנא צור את ה-bucket "avatars" ב-Supabase Storage. ראה PROFILE_IMAGE_SETUP.md להוראות.',
            "error",
            5000
          );
          return;
        }
        throw new Error(data.error || 'Failed to upload image');
      }

      // Update preview immediately
      setImagePreview(data.url);
      
      // Refresh user data
      window.location.reload();
      
      showToast('✅ התמונה הועלתה בהצלחה!', "success", 2000);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      showToast(`❌ שגיאה בהעלאת התמונה: ${error.message}`, "error", 3000);
    } finally {
      setUploadingImage(false);
      // Reset input
      e.target.value = '';
    }
  };

  // Calculate stats
  const calculateStats = () => {
    const completedLogs = workoutLogs.filter(log => log.completed);
    
    const totalMinutes = completedLogs.reduce((total, log: any) => {
      if (log.duration_seconds) {
        return total + (log.duration_seconds / 60);
      } else if (log.start_time && log.end_time) {
        const start = new Date(log.start_time).getTime();
        const end = new Date(log.end_time).getTime();
        return total + ((end - start) / (1000 * 60));
      }
      return total + 45;
    }, 0);
    const totalTimeHours = Math.round(totalMinutes / 60);

    const completedWorkouts = completedLogs.length;
    const personalGoals = { completed: completedWorkouts, total: 208, percentage: Math.min(Math.round((completedWorkouts / 208) * 100), 100) };

    const milestones = [1, 10, 25, 50, 100, 200];
    const collectedBadges = milestones.filter(m => completedWorkouts >= m).length;
    const badgesCollected = { collected: collectedBadges, total: milestones.length };

    const recentAchievements = completedLogs
      .slice(0, 3)
      .map((log: any, idx) => {
        const date = new Date(log.date || log.start_time);
        const achievementImages = [
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop",
          "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=100&h=100&fit=crop",
          "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=100&h=100&fit=crop",
        ];
        return {
          id: log.id,
          title: log.routine?.name || `אימון ${log.routine?.letter || ''}` || `אימון ${idx + 1}`,
          date: date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' }),
          image: achievementImages[idx % achievementImages.length],
        };
      });

    return { totalTimeHours, personalGoals, badgesCollected, achievements: recentAchievements };
  };

  const stats = calculateStats();
  const { totalTimeHours, personalGoals, badgesCollected, achievements } = stats;

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
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .bg-texture {
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(91, 127, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(91, 127, 255, 0.02) 0%, transparent 50%);
        }
      `}</style>

      <div className="relative bg-[#1A1D2E] w-full min-h-screen bg-texture">
        <div className="w-full overflow-y-auto pb-24">
          <div className="w-full max-w-[393px] mx-auto px-5 pt-12">
            <div className="flex flex-col items-start w-full gap-6">
              
              {/* Header */}
              <div className="w-full flex items-center justify-between animate-fade-in">
                <h1 className="text-[32px] font-outfit font-bold text-white">פרופיל</h1>
                <button 
                  onClick={handleLogout} 
                  disabled={loading} 
                  className="w-12 h-12 bg-[#2D3142] rounded-full flex items-center justify-center hover:bg-[#3D4058] transition-all hover:scale-110"
                  style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)' }}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <LogOut className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
              
              {/* Profile Card */}
              <div className="w-full bg-gradient-to-br from-[#5B7FFF] to-[#4A5FCC] rounded-2xl p-6 slide-up relative overflow-hidden"
                style={{ 
                  animationDelay: '100ms',
                  boxShadow: '0 12px 48px rgba(91, 127, 255, 0.4)'
                }}
              >
                <div className="absolute inset-0 bg-white/5" />
                <div className="relative z-10 flex flex-col items-center gap-4">
                  {/* Profile Picture */}
                  <div className="relative group">
                    <Avatar className="w-28 h-28 border-4 border-white/20 ring-4 ring-white/10 transition-transform group-hover:scale-105">
                      <AvatarImage src={imagePreview || undefined} />
                      <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-4xl font-outfit font-bold">
                        {user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <label 
                      className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full flex items-center justify-center border-4 border-[#5B7FFF] hover:scale-110 transition-transform cursor-pointer"
                      style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                      {uploadingImage ? (
                        <Loader2 className="w-5 h-5 text-[#5B7FFF] animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5 text-[#5B7FFF]" />
                      )}
                    </label>
                  </div>
                  
                  {/* Name and Email */}
                  <div className="flex flex-col items-center gap-1">
                    <h2 className="text-2xl font-outfit font-bold text-white">
                      {user?.name || "John Doe"}
                    </h2>
                    <p className="text-base font-outfit font-normal text-white/70">
                      {user?.email || "john.doe@email.com"}
                    </p>
                  </div>
                  
                  {/* Edit Button */}
                  <button
                    onClick={() => setShowEditProfile(true)}
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-2.5 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center gap-2 hover:scale-105"
                  >
                    <Edit className="w-4 h-4" />
                    ערוך פרופיל
                  </button>
                </div>
              </div>

              {/* Statistics */}
              <div className="w-full bg-[#2D3142] rounded-2xl p-5 slide-up"
                style={{ 
                  animationDelay: '200ms',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                }}
              >
                <div className="grid grid-cols-3 gap-4">
                  <StatsCard
                    icon={Clock}
                    value={totalTimeHours}
                    label="זמן כולל"
                    color="bg-[#EF4444]"
                    suffix="h"
                    delay={300}
                    loading={statsLoading}
                  />
                  
                  <StatsCard
                    icon={Trophy}
                    value={personalGoals.completed}
                    label="אימונים"
                    color="bg-[#4CAF50]"
                    delay={350}
                    loading={statsLoading}
                  />
                  
                  <StatsCard
                    icon={Award}
                    value={badgesCollected.collected}
                    label="תגים"
                    color="bg-[#FF8A00]"
                    delay={400}
                    loading={statsLoading}
                  />
                </div>
                
                {/* Progress Ring */}
                {!statsLoading && personalGoals.completed > 0 && (
                  <div className="mt-6 pt-6 border-t border-[#3D4058] flex items-center justify-center">
                    <div className="relative">
                      <CircularProgress 
                        progress={personalGoals.percentage} 
                        size={140}
                        strokeWidth={12}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-outfit font-bold text-white">
                          {personalGoals.percentage}%
                        </span>
                        <span className="text-xs text-[#9CA3AF] font-outfit">
                          יעד שנתי
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Achievements */}
              <div className="w-full flex flex-col gap-4 slide-up" style={{ animationDelay: '450ms' }}>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-outfit font-bold text-white">הישגים</h2>
                  <Link 
                    href="/trainee/achievements" 
                    className="text-sm font-outfit font-semibold text-[#5B7FFF] hover:text-[#6B8EFF] transition-colors flex items-center gap-1 hover:gap-2"
                  >
                    צפה בהכל
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                
                <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-5 px-5">
                  {achievements.length > 0 ? (
                    achievements.map((achievement, index) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        index={index}
                      />
                    ))
                  ) : (
                    <div className="flex-1 min-w-full bg-[#2D3142] rounded-2xl p-8 flex flex-col items-center justify-center gap-3"
                      style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)' }}
                    >
                      <div className="w-16 h-16 bg-[#3D4058] rounded-full flex items-center justify-center">
                        <Trophy className="w-8 h-8 text-[#9CA3AF]" />
                      </div>
                      <p className="text-[#9CA3AF] text-sm text-center font-outfit">
                        אין הישגים עדיין
                      </p>
                      <p className="text-[#9CA3AF] text-xs text-center font-outfit">
                        התחל להתאמן כדי לפתוח הישגים!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="w-full grid grid-cols-2 gap-3 slide-up" style={{ animationDelay: '500ms' }}>
                <Link
                  href="/trainee/workouts"
                  className="bg-gradient-to-br from-[#5B7FFF] to-[#4A5FCC] rounded-xl p-4 flex flex-col items-center gap-3 hover-lift transition-all"
                  style={{ boxShadow: '0 4px 20px rgba(91, 127, 255, 0.3)' }}
                >
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Dumbbell className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white font-outfit font-semibold text-sm">
                    אימונים
                  </span>
                </Link>
                
                <Link
                  href="/trainee/history"
                  className="bg-gradient-to-br from-[#FF8A00] to-[#FF6B00] rounded-xl p-4 flex flex-col items-center gap-3 hover-lift transition-all"
                  style={{ boxShadow: '0 4px 20px rgba(255, 138, 0, 0.3)' }}
                >
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white font-outfit font-semibold text-sm">
                    התקדמות
                  </span>
                </Link>
              </div>

              {/* Account Section */}
              <div className="w-full flex flex-col gap-4 slide-up" style={{ animationDelay: '550ms' }}>
                <h2 className="text-xl font-outfit font-bold text-white">חשבון</h2>
                <div className="w-full bg-[#2D3142] rounded-2xl overflow-hidden"
                  style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)' }}
                >
                  <MenuItem
                    icon={User}
                    label="ערוך פרופיל"
                    onClick={() => setShowEditProfile(true)}
                  />
                  <div className="w-full h-px bg-[#3D4058]" />
                  <MenuItem
                    icon={Lock}
                    label="שנה סיסמה"
                    onClick={() => showToast('🔒 Coming soon!', "info", 2000)}
                  />
                  <div className="w-full h-px bg-[#3D4058]" />
                  <MenuItem
                    icon={Shield}
                    label="פרטיות ואבטחה"
                    onClick={() => showToast('🛡️ Coming soon!', "info", 2000)}
                  />
                </div>
              </div>

              {/* General Section */}
              <div className="w-full flex flex-col gap-4 slide-up" style={{ animationDelay: '600ms' }}>
                <h2 className="text-xl font-outfit font-bold text-white">כללי</h2>
                <div className="w-full bg-[#2D3142] rounded-2xl overflow-hidden"
                  style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)' }}
                >
                  <MenuItem
                    icon={Bell}
                    label="התראות"
                    onClick={() => showToast('🔔 Coming soon!', "info", 2000)}
                  />
                  <div className="w-full h-px bg-[#3D4058]" />
                  <MenuItem
                    icon={Globe}
                    label="שפה"
                    onClick={() => showToast('🌐 Coming soon!', "info", 2000)}
                  />
                  <div className="w-full h-px bg-[#3D4058]" />
                  <MenuItem
                    icon={HelpCircle}
                    label="עזרה ותמיכה"
                    onClick={() => showToast('❓ Coming soon!', "info", 2000)}
                  />
                </div>
              </div>

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
              <div className="p-6 border-b border-[#3D4058] bg-gradient-to-r from-[#5B7FFF] to-[#4A5FCC]">
                <h3 className="text-white text-2xl font-outfit font-bold">ערוך פרופיל</h3>
              </div>
              <div className="space-y-5 p-6">
                {/* Profile Image Upload */}
                <div className="flex flex-col items-center gap-4 pb-4 border-b border-[#3D4058]">
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-[#5B7FFF]">
                      <AvatarImage src={imagePreview || undefined} />
                      <AvatarFallback className="bg-[#5B7FFF] text-white text-3xl font-outfit font-bold">
                        {user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <label 
                      className="absolute bottom-0 right-0 w-8 h-8 bg-[#5B7FFF] rounded-full flex items-center justify-center border-2 border-[#2D3142] hover:scale-110 transition-transform cursor-pointer"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                      {uploadingImage ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4 text-white" />
                      )}
                    </label>
                  </div>
                  <p className="text-xs text-[#9CA3AF] text-center font-outfit">
                    לחץ על האייקון כדי להעלות תמונת פרופיל
                  </p>
                </div>
                <div>
                  <label className="text-sm text-[#9CA3AF] mb-2 block font-outfit font-semibold">
                    שם מלא
                  </label>
                  <Input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="bg-[#1A1D2E] border-2 border-[#3D4058] text-white rounded-xl h-12 font-outfit font-normal focus:border-[#5B7FFF] transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#9CA3AF] mb-2 block font-outfit font-semibold">
                    אימייל
                  </label>
                  <Input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="bg-[#1A1D2E] border-2 border-[#3D4058] text-white rounded-xl h-12 font-outfit font-normal focus:border-[#5B7FFF] transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSaveProfile}
                    className="flex-1 h-12 bg-[#5B7FFF] hover:bg-[#6B8EFF] text-white font-outfit font-bold rounded-xl hover:scale-105 transition-all"
                    style={{ boxShadow: '0 4px 16px rgba(91, 127, 255, 0.4)' }}
                  >
                    שמור
                  </Button>
                  <Button
                    onClick={() => setShowEditProfile(false)}
                    className="flex-1 h-12 bg-[#1A1D2E] border-2 border-[#3D4058] text-white hover:bg-[#3D4058] font-outfit font-bold rounded-xl transition-all"
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredRole="trainee">
      <SettingsPageContent />
    </ProtectedRoute>
  );
}