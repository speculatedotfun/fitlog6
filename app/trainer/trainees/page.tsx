"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, Loader2, Search, MoreHorizontal, Edit, Trash2, UserPlus,
  Users, Activity, TrendingUp, AlertCircle, Trophy, Filter, ArrowUpDown,
  Eye, Calendar, Mail, Dumbbell, X, Target, Zap
} from "lucide-react";
import { getTrainerTraineesWithDetails, getTraineesWithStatus, getWorkoutLogsForUsers, getTrainerTrainees } from "@/lib/db";
import { createTraineeAccount } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddTraineeForm, CredentialsDisplay } from "@/components/trainer/AddTraineeForm";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ============================================
// ANIMATED COUNTER COMPONENT
// ============================================
const AnimatedCounter = ({ 
  value, 
  duration = 1000,
  delay = 0,
  suffix = ""
}: { 
  value: number; 
  duration?: number;
  delay?: number;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0;
      const end = value;
      const increment = end / 30;
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, duration / 30);
      return () => clearInterval(timer);
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [value, duration, delay]);

  return <>{count}{suffix}</>;
};

// ============================================
// STAT CARD COMPONENT
// ============================================
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  subValue,
  colorTheme = "blue",
  index = 0
}: any) {
  const themes = {
    blue: { 
      gradient: "from-[#5B7FFF] to-[#4A5FCC]",
      shadow: "shadow-[0_8px_32px_rgba(91,127,255,0.4)]",
    },
    green: { 
      gradient: "from-[#4CAF50] to-[#45A049]",
      shadow: "shadow-[0_8px_32px_rgba(76,175,80,0.4)]",
    },
    orange: { 
      gradient: "from-[#FF8A00] to-[#E67A00]",
      shadow: "shadow-[0_8px_32px_rgba(255,138,0,0.4)]",
    },
    red: { 
      gradient: "from-[#EF4444] to-[#DC2626]",
      shadow: "shadow-[0_8px_32px_rgba(239,68,68,0.4)]",
    },
    purple: {
      gradient: "from-[#9C27B0] to-[#7B1FA2]",
      shadow: "shadow-[0_8px_32px_rgba(156,39,176,0.4)]",
    },
  };
  
  const theme = themes[colorTheme as keyof typeof themes] || themes.blue;

  return (
    <div 
      className={cn(
        "bg-gradient-to-br rounded-xl p-4 relative overflow-hidden group hover:scale-105 transition-all duration-300 slide-up",
        theme.gradient,
        theme.shadow
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="absolute inset-0 bg-white/5" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xs font-outfit font-semibold text-white/80">{title}</h3>
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
        
        <div className="mt-auto">
          <div className="text-2xl font-outfit font-black text-white flex items-baseline gap-1">
            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
            {subValue && <span className="text-xs font-outfit font-semibold text-white/70">{subValue}</span>}
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 bg-white/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

// ============================================
// SKELETON COMPONENTS
// ============================================
function SkeletonStatCard() {
  return (
    <div className="bg-[#2D3142] rounded-xl p-4 animate-pulse" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>
      <div className="flex justify-between items-start mb-3">
        <Skeleton className="h-3 w-16 bg-[#3D4058]" />
        <Skeleton className="h-8 w-8 rounded-lg bg-[#3D4058]" />
      </div>
      <Skeleton className="h-6 w-12 bg-[#3D4058]" />
    </div>
  );
}

function SkeletonTraineeCard() {
  return (
    <div className="bg-[#2D3142] rounded-xl p-5 animate-pulse border border-[#3D4058]" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>
      <div className="flex items-start gap-4 mb-4">
        <Skeleton className="h-16 w-16 rounded-xl bg-[#3D4058]" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32 bg-[#3D4058]" />
          <Skeleton className="h-4 w-24 bg-[#3D4058]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Skeleton className="h-16 bg-[#3D4058] rounded-lg" />
        <Skeleton className="h-16 bg-[#3D4058] rounded-lg" />
      </div>
      <div className="flex gap-2 pt-4 border-t border-[#3D4058]">
        <Skeleton className="h-8 flex-1 bg-[#3D4058]" />
        <Skeleton className="h-8 flex-1 bg-[#3D4058]" />
      </div>
    </div>
  );
}

type PlanFilter = 'all' | 'active' | 'inactive';
type ComplianceFilter = 'all' | 'high' | 'medium' | 'low';
type SortBy = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc' | 'compliance-desc' | 'compliance-asc' | 'workouts-desc' | 'workouts-asc' | 'lastWorkout-desc' | 'lastWorkout-asc';

// ============================================
// MAIN COMPONENT
// ============================================
function TraineesManagementContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [trainees, setTrainees] = useState<Array<{
    id: string;
    name: string;
    email: string;
    created_at: string;
    planActive: boolean;
    planName: string | null;
    lastWorkout: string | null;
  }>>([]);
  const [traineesWithStatus, setTraineesWithStatus] = useState<any[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [newTraineeCredentials, setNewTraineeCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');
  const [complianceFilter, setComplianceFilter] = useState<ComplianceFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name-asc');

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
      
      const [traineesWithDetails, statusData, traineesList] = await Promise.all([
        getTrainerTraineesWithDetails(trainerId),
        getTraineesWithStatus(trainerId),
        getTrainerTrainees(trainerId),
      ]);
      
      setTrainees(traineesWithDetails);
      setTraineesWithStatus(statusData);
      
      const traineeIds = traineesList.map(t => t.id);
      if (traineeIds.length > 0) {
        const logsData = await getWorkoutLogsForUsers(traineeIds, undefined);
        const logsArray = logsData instanceof Map 
          ? Array.from(logsData.values()).flat()
          : Array.isArray(logsData) ? logsData : [];
        setWorkoutLogs(logsArray);
      }
    } catch (err: any) {
      console.error("Error loading trainees:", err);
      setError(err.message || "שגיאה בטעינת הנתונים");
      showToast('שגיאה בטעינת הנתונים', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrainee = async (email: string, password: string, name: string) => {
    if (!name || !email || !password) {
      setError("אנא מלא את כל השדות");
      showToast('אנא מלא את כל השדות', 'error');
      return;
    }
    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      showToast('הסיסמה חייבת להכיל לפחות 6 תווים', 'error');
      return;
    }
    try {
      setAdding(true);
      setError(null);
      await createTraineeAccount(email, password, name);
      setNewTraineeCredentials({ email, password });
      setIsAddDialogOpen(false);
      showToast('✅ מתאמן נוסף בהצלחה!', 'success');
      await loadTrainees();
    } catch (err: any) {
      console.error("Error adding trainee:", err);
      setError(err.message || "שגיאה בהוספת מתאמן");
      showToast(err.message || 'שגיאה בהוספת מתאמן', 'error');
    } finally {
      setAdding(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("he-IL", { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const quickStats = useMemo(() => {
    const total = trainees.length;
    const active = trainees.filter(t => t.planActive).length;
    const avgCompliance = traineesWithStatus.length > 0
      ? Math.round(traineesWithStatus.reduce((sum, t) => sum + t.compliance, 0) / traineesWithStatus.length)
      : 0;
    
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const workoutsThisWeek = workoutLogs.filter((log: any) => {
      const logDate = new Date(log.date);
      return logDate >= weekStart && log.completed;
    }).length;
    
    const prsThisWeek = 0;
    
    const needsAttention = traineesWithStatus.filter(t => 
      t.compliance < 50 || !t.lastWorkout
    ).length;
    
    return {
      total,
      active,
      avgCompliance,
      workoutsThisWeek,
      prsThisWeek,
      needsAttention,
    };
  }, [trainees, traineesWithStatus, workoutLogs]);

  const traineesWithStats = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    return trainees.map(trainee => {
      const status = traineesWithStatus.find(ts => ts.id === trainee.id);
      const workoutsThisWeek = workoutLogs.filter((log: any) => {
        if (log.user_id !== trainee.id || !log.completed) return false;
        const logDate = new Date(log.date);
        return logDate >= weekStart;
      }).length;
      
      const prsThisWeek = 0;
      
      return {
        ...trainee,
        compliance: status?.compliance || 0,
        workoutsThisWeek,
        prsThisWeek,
      };
    });
  }, [trainees, traineesWithStatus, workoutLogs]);

  const filteredAndSortedTrainees = useMemo(() => {
    let filtered = traineesWithStats.filter(trainee => {
      const matchesSearch = searchQuery === '' || 
        trainee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trainee.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPlan = planFilter === 'all' ||
        (planFilter === 'active' && trainee.planActive) ||
        (planFilter === 'inactive' && !trainee.planActive);
      
      const matchesCompliance = complianceFilter === 'all' ||
        (complianceFilter === 'high' && trainee.compliance >= 80) ||
        (complianceFilter === 'medium' && trainee.compliance >= 50 && trainee.compliance < 80) ||
        (complianceFilter === 'low' && trainee.compliance < 50);
      
      return matchesSearch && matchesPlan && matchesCompliance;
    });
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'compliance-desc':
          return (b.compliance || 0) - (a.compliance || 0);
        case 'compliance-asc':
          return (a.compliance || 0) - (b.compliance || 0);
        case 'workouts-desc':
          return b.workoutsThisWeek - a.workoutsThisWeek;
        case 'workouts-asc':
          return a.workoutsThisWeek - b.workoutsThisWeek;
        case 'lastWorkout-desc':
          if (!a.lastWorkout && !b.lastWorkout) return 0;
          if (!a.lastWorkout) return 1;
          if (!b.lastWorkout) return -1;
          return new Date(b.lastWorkout).getTime() - new Date(a.lastWorkout).getTime();
        case 'lastWorkout-asc':
          if (!a.lastWorkout && !b.lastWorkout) return 0;
          if (!a.lastWorkout) return 1;
          if (!b.lastWorkout) return -1;
          return new Date(a.lastWorkout).getTime() - new Date(b.lastWorkout).getTime();
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [traineesWithStats, searchQuery, planFilter, complianceFilter, sortBy]);

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
        
        .bg-texture {
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(91, 127, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(91, 127, 255, 0.02) 0%, transparent 50%);
        }
      `}</style>

      <div className="space-y-6 pb-32 bg-[#1A1D2E] bg-texture min-h-screen" dir="rtl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#3D4058] slide-up">
          <div>
            <h1 className="text-3xl font-outfit font-bold text-white">ניהול מתאמנים</h1>
            <p className="text-base text-[#9CA3AF] mt-1 font-outfit">צפייה, עריכה והוספה של מתאמנים</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input 
                placeholder="חיפוש מתאמן..." 
                className="pr-10 bg-[#2D3142] border-2 border-[#3D4058] text-white placeholder:text-[#9CA3AF] rounded-xl h-11 font-outfit focus:border-[#5B7FFF] transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <button className="bg-[#5B7FFF] hover:bg-[#6B8EFF] text-white px-4 h-11 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center gap-2 hover:scale-105"
                  style={{ boxShadow: '0 8px 32px rgba(91, 127, 255, 0.4)' }}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">הוסף מתאמן</span>
                  <span className="sm:hidden">הוסף</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-[#2D3142] border-2 border-[#3D4058] rounded-2xl" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="text-white font-outfit text-xl">הוספת מתאמן חדש</DialogTitle>
                  <DialogDescription className="text-[#9CA3AF] font-outfit">
                    מלא את הפרטים ליצירת חשבון למתאמן.
                  </DialogDescription>
                </DialogHeader>
                <AddTraineeForm
                  onAdd={handleAddTrainee}
                  onCancel={() => {
                    setIsAddDialogOpen(false);
                    setError(null);
                  }}
                  adding={adding}
                  error={error}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Stats */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard
              title="סה״כ מתאמנים"
              value={quickStats.total}
              icon={Users}
              colorTheme="blue"
              index={0}
            />
            <StatCard
              title="פעילים"
              value={quickStats.active}
              subValue={`/${quickStats.total}`}
              icon={Activity}
              colorTheme="green"
              index={1}
            />
            <StatCard
              title="התאמה ממוצעת"
              value={quickStats.avgCompliance}
              subValue="%"
              icon={TrendingUp}
              colorTheme="purple"
              index={2}
            />
            <StatCard
              title="אימונים השבוע"
              value={quickStats.workoutsThisWeek}
              icon={Dumbbell}
              colorTheme="blue"
              index={3}
            />
            <StatCard
              title="PRs השבוע"
              value={quickStats.prsThisWeek}
              icon={Trophy}
              colorTheme="orange"
              index={4}
            />
            <StatCard
              title="צריכים תשומת לב"
              value={quickStats.needsAttention}
              icon={AlertCircle}
              colorTheme="red"
              index={5}
            />
          </div>
        )}

        {/* Filters */}
        <div 
          className="flex flex-wrap items-center gap-2 slide-up"
          style={{ animationDelay: '300ms' }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="bg-[#2D3142] hover:bg-[#3D4058] text-white px-4 py-2 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center gap-2 border-2 border-[#3D4058]">
                <Filter className="h-4 w-4" />
                {planFilter === 'all' ? 'תוכנית' : planFilter === 'active' ? 'עם תוכנית' : 'ללא תוכנית'}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#2D3142] border-2 border-[#3D4058] w-40 rounded-xl">
              <DropdownMenuItem onClick={() => setPlanFilter('all')} className="text-white font-outfit hover:bg-[#3D4058]">כל המתאמנים</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPlanFilter('active')} className="text-white font-outfit hover:bg-[#3D4058]">עם תוכנית</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPlanFilter('inactive')} className="text-white font-outfit hover:bg-[#3D4058]">ללא תוכנית</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="bg-[#2D3142] hover:bg-[#3D4058] text-white px-4 py-2 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center gap-2 border-2 border-[#3D4058]">
                <Filter className="h-4 w-4" />
                {complianceFilter === 'all' ? 'התאמה' : complianceFilter === 'high' ? 'גבוהה' : complianceFilter === 'medium' ? 'בינונית' : 'נמוכה'}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#2D3142] border-2 border-[#3D4058] w-44 rounded-xl">
              <DropdownMenuItem onClick={() => setComplianceFilter('all')} className="text-white font-outfit hover:bg-[#3D4058]">כל המתאמנים</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setComplianceFilter('high')} className="text-white font-outfit hover:bg-[#3D4058]">התאמה גבוהה (≥80%)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setComplianceFilter('medium')} className="text-white font-outfit hover:bg-[#3D4058]">התאמה בינונית (50-79%)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setComplianceFilter('low')} className="text-white font-outfit hover:bg-[#3D4058]">התאמה נמוכה (&lt;50%)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="bg-[#2D3142] hover:bg-[#3D4058] text-white px-4 py-2 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center gap-2 border-2 border-[#3D4058]">
                <ArrowUpDown className="h-4 w-4" />
                מיון
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#2D3142] border-2 border-[#3D4058] w-56 rounded-xl">
              <DropdownMenuItem onClick={() => setSortBy('name-asc')} className="text-white font-outfit hover:bg-[#3D4058]">שם (א-ב)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('name-desc')} className="text-white font-outfit hover:bg-[#3D4058]">שם (ב-א)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('compliance-desc')} className="text-white font-outfit hover:bg-[#3D4058]">התאמה (גבוהה לנמוכה)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('workouts-desc')} className="text-white font-outfit hover:bg-[#3D4058]">אימונים (הרבה למעט)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {(searchQuery || planFilter !== 'all' || complianceFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPlanFilter('all');
                setComplianceFilter('all');
              }}
              className="bg-[#2D3142] hover:bg-[#3D4058] text-white px-4 py-2 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center gap-2 border-2 border-[#3D4058]"
            >
              <X className="h-4 w-4" />
              נקה
            </button>
          )}
        </div>

        {/* Trainees Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonTraineeCard key={i} />
            ))}
          </div>
        ) : filteredAndSortedTrainees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedTrainees.map((trainee, index) => (
              <div
                key={trainee.id}
                className="bg-[#2D3142] rounded-xl overflow-hidden border-2 border-[#3D4058] hover:border-[#5B7FFF] transition-all group hover:scale-105 slide-up"
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                }}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <Link href={`/trainer/trainee/${trainee.id}`}>
                      <Avatar className="h-16 w-16 border-2 border-[#3D4058] group-hover:border-[#5B7FFF] transition-all">
                        <AvatarFallback className="bg-[#5B7FFF]/20 text-[#5B7FFF] font-outfit font-black text-2xl">
                          {trainee.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/trainer/trainee/${trainee.id}`}>
                        <h3 className="text-lg font-outfit font-bold text-white truncate group-hover:text-[#5B7FFF] transition-colors">
                          {trainee.name}
                        </h3>
                      </Link>
                      <p className="text-sm font-outfit text-[#9CA3AF] truncate mt-1">
                        {trainee.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-2 p-3 bg-[#1A1D2E] rounded-lg">
                      <TrendingUp className={cn(
                        "h-4 w-4",
                        trainee.compliance >= 80 ? 'text-[#4CAF50]' :
                        trainee.compliance >= 50 ? 'text-[#FF8A00]' :
                        'text-[#EF4444]'
                      )} />
                      <div className="min-w-0">
                        <p className="text-xs font-outfit text-[#9CA3AF]">התאמה</p>
                        <p className="text-sm font-outfit font-bold text-white">
                          <AnimatedCounter value={trainee.compliance} suffix="%" />
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-[#1A1D2E] rounded-lg">
                      <Dumbbell className="h-4 w-4 text-[#5B7FFF]" />
                      <div className="min-w-0">
                        <p className="text-xs font-outfit text-[#9CA3AF]">אימונים</p>
                        <p className="text-sm font-outfit font-bold text-white">
                          <AnimatedCounter value={trainee.workoutsThisWeek} />
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-[#1A1D2E] rounded-lg col-span-2">
                      {trainee.planActive ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-[#4CAF50]" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-outfit text-[#9CA3AF]">תוכנית</p>
                            <p className="text-sm font-outfit font-bold text-[#4CAF50] truncate">
                              {trainee.planName || 'פעילה'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-[#3D4058]" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-outfit text-[#9CA3AF]">תוכנית</p>
                            <p className="text-sm font-outfit font-bold text-[#9CA3AF]">ללא תוכנית</p>
                          </div>
                        </>
                      )}
                    </div>

                    {trainee.lastWorkout && (
                      <div className="flex items-center gap-2 p-3 bg-[#1A1D2E] rounded-lg col-span-2">
                        <Calendar className="h-4 w-4 text-[#FF8A00]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-outfit text-[#9CA3AF]">אימון אחרון</p>
                          <p className="text-sm font-outfit font-bold text-white">
                            {formatDate(trainee.lastWorkout)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-[#3D4058]">
                    <Link href={`/trainer/trainee/${trainee.id}`} className="flex-1">
                      <button className="w-full bg-[#1A1D2E] hover:bg-[#3D4058] text-white px-4 py-2 rounded-lg font-outfit font-semibold text-sm transition-all flex items-center justify-center gap-2">
                        <Eye className="h-4 w-4" />
                        פרופיל
                      </button>
                    </Link>
                    {trainee.planActive && (
                      <Link href={`/trainer/workout-plans/${trainee.id}/edit`} className="flex-1">
                        <button className="w-full bg-[#1A1D2E] hover:bg-[#3D4058] text-white px-4 py-2 rounded-lg font-outfit font-semibold text-sm transition-all flex items-center justify-center gap-2">
                          <Edit className="h-4 w-4" />
                          תוכנית
                        </button>
                      </Link>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="bg-[#1A1D2E] hover:bg-[#3D4058] text-white w-10 h-10 rounded-lg transition-all flex items-center justify-center">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#2D3142] border-2 border-[#3D4058] rounded-xl">
                        <DropdownMenuItem onClick={() => showToast('🔜 Coming soon!', 'info', 2000)} className="text-white font-outfit hover:bg-[#3D4058]">
                          <Edit className="h-4 w-4 mr-2" />
                          ערוך פרטים
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => showToast('🔜 Coming soon!', 'info', 2000)} className="text-[#EF4444] font-outfit hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4 mr-2" />
                          מחק מתאמן
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div 
            className="bg-[#2D3142] rounded-2xl p-16 text-center slide-up"
            style={{ 
              animationDelay: '100ms',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-6 rounded-full bg-[#1A1D2E] border-2 border-[#3D4058]">
                <UserPlus className="h-16 w-16 text-[#9CA3AF]" />
              </div>
              <div>
                <h3 className="text-xl font-outfit font-bold text-white mb-2">
                  {searchQuery || planFilter !== 'all' || complianceFilter !== 'all' ? 'לא נמצאו תוצאות' : 'עדיין אין מתאמנים'}
                </h3>
                <p className="text-base font-outfit text-[#9CA3AF]">
                  {searchQuery || planFilter !== 'all' || complianceFilter !== 'all' 
                    ? 'נסה לשנות את החיפוש או הפילטרים' 
                    : 'התחל להוסיף מתאמנים כדי לנהל אותם כאן'}
                </p>
              </div>
              {searchQuery || planFilter !== 'all' || complianceFilter !== 'all' ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setPlanFilter('all');
                    setComplianceFilter('all');
                  }}
                  className="mt-2 bg-[#1A1D2E] hover:bg-[#3D4058] text-white px-6 py-3 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  נקה חיפוש
                </button>
              ) : (
                <button 
                  onClick={() => setIsAddDialogOpen(true)} 
                  className="mt-2 bg-[#5B7FFF] hover:bg-[#6B8EFF] text-white px-6 py-3 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center gap-2 hover:scale-105"
                  style={{ boxShadow: '0 8px 32px rgba(91, 127, 255, 0.4)' }}
                >
                  <Plus className="h-4 w-4" />
                  הוסף מתאמן ראשון
                </button>
              )}
            </div>
          </div>
        )}

        {/* Credentials Dialog */}
        {newTraineeCredentials && (
          <Dialog open={!!newTraineeCredentials} onOpenChange={(open) => !open && setNewTraineeCredentials(null)}>
            <DialogContent dir="rtl" className="bg-[#2D3142] border-2 border-[#3D4058] rounded-2xl">
              <CredentialsDisplay
                email={newTraineeCredentials.email}
                password={newTraineeCredentials.password}
                onClose={() => setNewTraineeCredentials(null)}
              />
            </DialogContent>
          </Dialog>
        )}

      </div>
    </>
  );
}

export default function TraineesManagementPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <TraineesManagementContent />
    </ProtectedRoute>
  );
}