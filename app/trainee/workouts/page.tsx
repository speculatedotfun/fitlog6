"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Filter, Star, Search, X, Clock, Flame, Target,
  ChevronDown, TrendingUp, Award, Zap, Activity
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { getActiveWorkoutPlan, getRoutinesWithExercises, getWorkoutLogs } from "@/lib/db";
import type { RoutineWithExercises } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// ============================================
// TYPES
// ============================================
interface WorkoutStats {
  exercises: number;
  estimatedTime: number;
  estimatedCalories: number;
  completedCount: number;
}

type DifficultyFilter = "all" | "beginner" | "intermediate" | "advanced";
type SortOption = "name" | "difficulty" | "recent" | "popular";

// ============================================
// COMPONENTS
// ============================================

// Workout Card Component
const WorkoutCard = ({ 
  routine, 
  imageUrl, 
  stats,
  index = 0,
  onFavorite,
  isFavorite = false
}: { 
  routine: RoutineWithExercises;
  imageUrl: string;
  stats: WorkoutStats;
  index?: number;
  onFavorite?: () => void;
  isFavorite?: boolean;
}) => {
  const getDifficultyColor = (letter: string) => {
    if (letter === "A" || letter === "B") return "bg-[#4CAF50]";
    if (letter === "C" || letter === "D") return "bg-[#FF8A00]";
    if (letter === "E") return "bg-[#EF4444]";
    return "bg-[#FF8A00]";
  };

  const getDifficultyLabel = (letter: string) => {
    if (letter === "A" || letter === "B") return "מתחיל";
    if (letter === "C" || letter === "D") return "בינוני";
    if (letter === "E") return "מתקדם";
    return "בינוני";
  };

  const routineName = routine.name || `אימון ${routine.letter}`;
  const difficultyColor = getDifficultyColor(routine.letter || "C");
  const difficultyLabel = getDifficultyLabel(routine.letter || "C");

  return (
    <div 
      className="slide-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <Link
        href={`/trainee/workout?routine=${routine.id}`}
        className="block w-full rounded-2xl relative overflow-hidden group"
        style={{ 
          height: '240px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
          style={{
            backgroundImage: `url(${imageUrl})`,
            zIndex: 0,
          }}
        />
        
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-90"
          style={{
            background: 'linear-gradient(180deg, rgba(26, 29, 46, 0.3) 0%, rgba(26, 29, 46, 0.8) 70%, rgba(26, 29, 46, 0.95) 100%)',
            zIndex: 1
          }}
        />

        {/* Glow effect on hover */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle at 50% 100%, rgba(91, 127, 255, 0.3) 0%, transparent 70%)',
            zIndex: 2
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col h-full justify-between p-5">
          <div className="flex items-start justify-between">
            {/* Difficulty Badge */}
            <div 
              className={cn(
                "inline-flex items-center justify-center rounded-lg px-3 py-1.5 transition-all duration-300 group-hover:scale-105",
                difficultyColor
              )}
              style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }}
            >
              <span className="text-white text-xs font-outfit font-medium">
                {difficultyLabel}
              </span>
            </div>

            {/* Favorite Button */}
            {onFavorite && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onFavorite();
                }}
                className="w-10 h-10 bg-[#2D3142]/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-[#3D4058]"
                style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }}
              >
                <Star 
                  className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isFavorite ? "fill-[#FF8A00] text-[#FF8A00]" : "text-white"
                  )}
                />
              </button>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 transition-all duration-300 group-hover:bg-white">
              <Clock className="w-4 h-4 text-[#1A1D2E]" />
              <span className="text-[#1A1D2E] text-xs font-outfit font-medium">
                {stats.estimatedTime} דקות
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 transition-all duration-300 group-hover:bg-white">
              <Flame className="w-4 h-4 text-[#1A1D2E]" />
              <span className="text-[#1A1D2E] text-xs font-outfit font-medium">
                {stats.estimatedCalories} קלוריות
              </span>
            </div>
          </div>

          {/* Title and Info */}
          <div className="flex flex-col gap-1">
            <h3 className="text-white text-2xl font-outfit font-bold leading-tight transition-transform duration-300 group-hover:translate-x-2">
              {routineName}
            </h3>
            <div className="flex items-center gap-3">
              <p className="text-[#9CA3AF] text-sm font-outfit font-normal">
                {stats.exercises} תרגילים
              </p>
              {stats.completedCount > 0 && (
                <>
                  <span className="text-[#9CA3AF]">•</span>
                  <p className="text-[#5B7FFF] text-sm font-outfit font-medium">
                    הושלם {stats.completedCount} פעמים
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

// Filter Modal Component
const FilterModal = ({ 
  show, 
  onClose, 
  selectedDifficulty,
  onDifficultyChange,
  selectedSort,
  onSortChange
}: {
  show: boolean;
  onClose: () => void;
  selectedDifficulty: DifficultyFilter;
  onDifficultyChange: (diff: DifficultyFilter) => void;
  selectedSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}) => {
  if (!show) return null;

  const difficulties: { value: DifficultyFilter; label: string; icon: any }[] = [
    { value: "all", label: "הכל", icon: Activity },
    { value: "beginner", label: "מתחיל", icon: TrendingUp },
    { value: "intermediate", label: "בינוני", icon: Target },
    { value: "advanced", label: "מתקדם", icon: Award },
  ];

  const sortOptions: { value: SortOption; label: string; icon: any }[] = [
    { value: "name", label: "שם", icon: Filter },
    { value: "difficulty", label: "קושי", icon: TrendingUp },
    { value: "recent", label: "אחרונים", icon: Clock },
    { value: "popular", label: "פופולריים", icon: Zap },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[393px] bg-[#1A1D2E] rounded-t-3xl p-6 slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5)',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}
      >
        {/* Handle Bar */}
        <div className="w-12 h-1.5 bg-[#2D3142] rounded-full mx-auto mb-6" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-outfit font-bold">סינון ומיון</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-[#2D3142] rounded-full flex items-center justify-center hover:bg-[#3D4058] transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Difficulty Filter */}
        <div className="mb-6">
          <h3 className="text-white text-base font-outfit font-semibold mb-3">רמת קושי</h3>
          <div className="grid grid-cols-2 gap-3">
            {difficulties.map((diff) => (
              <button
                key={diff.value}
                onClick={() => onDifficultyChange(diff.value)}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl transition-all duration-300",
                  selectedDifficulty === diff.value
                    ? "bg-[#5B7FFF] text-white shadow-lg shadow-[#5B7FFF]/30"
                    : "bg-[#2D3142] text-[#9CA3AF] hover:bg-[#3D4058]"
                )}
              >
                <diff.icon className="w-5 h-5" />
                <span className="font-outfit font-medium text-sm">{diff.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div className="mb-4">
          <h3 className="text-white text-base font-outfit font-semibold mb-3">מיון לפי</h3>
          <div className="grid grid-cols-2 gap-3">
            {sortOptions.map((sort) => (
              <button
                key={sort.value}
                onClick={() => onSortChange(sort.value)}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl transition-all duration-300",
                  selectedSort === sort.value
                    ? "bg-[#5B7FFF] text-white shadow-lg shadow-[#5B7FFF]/30"
                    : "bg-[#2D3142] text-[#9CA3AF] hover:bg-[#3D4058]"
                )}
              >
                <sort.icon className="w-5 h-5" />
                <span className="font-outfit font-medium text-sm">{sort.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={onClose}
          className="w-full bg-[#5B7FFF] text-white py-4 rounded-xl font-outfit font-semibold text-base hover:bg-[#4A5FCC] transition-colors mt-4"
          style={{ boxShadow: '0 4px 16px rgba(91, 127, 255, 0.4)' }}
        >
          החל
        </button>
      </div>
    </div>
  );
};

// Stats Summary Component
const StatsSummary = ({ 
  totalWorkouts, 
  totalExercises, 
  avgTime 
}: { 
  totalWorkouts: number; 
  totalExercises: number; 
  avgTime: number;
}) => (
  <div className="w-full bg-[#2D3142] rounded-2xl p-4 flex items-center justify-around slide-up"
    style={{ 
      animationDelay: '100ms',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
    }}
  >
    <div className="flex flex-col items-center gap-1">
      <div className="w-10 h-10 bg-[#5B7FFF]/20 rounded-full flex items-center justify-center">
        <Target className="w-5 h-5 text-[#5B7FFF]" />
      </div>
      <span className="text-white text-xl font-outfit font-bold">{totalWorkouts}</span>
      <span className="text-[#9CA3AF] text-xs font-outfit">אימונים</span>
    </div>
    <div className="w-px h-12 bg-[#3D4058]" />
    <div className="flex flex-col items-center gap-1">
      <div className="w-10 h-10 bg-[#FF8A00]/20 rounded-full flex items-center justify-center">
        <Activity className="w-5 h-5 text-[#FF8A00]" />
      </div>
      <span className="text-white text-xl font-outfit font-bold">{totalExercises}</span>
      <span className="text-[#9CA3AF] text-xs font-outfit">תרגילים</span>
    </div>
    <div className="w-px h-12 bg-[#3D4058]" />
    <div className="flex flex-col items-center gap-1">
      <div className="w-10 h-10 bg-[#4CAF50]/20 rounded-full flex items-center justify-center">
        <Clock className="w-5 h-5 text-[#4CAF50]" />
      </div>
      <span className="text-white text-xl font-outfit font-bold">{avgTime}</span>
      <span className="text-[#9CA3AF] text-xs font-outfit">דקות ממוצע</span>
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
export default function WorkoutsPage() {
  const { user } = useAuth();
  const [showFilter, setShowFilter] = useState(false);
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilter>("all");
  const [selectedSort, setSelectedSort] = useState<SortOption>("name");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const traineeId = user?.id || "";

  useEffect(() => {
    if (!traineeId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        const [plan, logs] = await Promise.all([
          getActiveWorkoutPlan(traineeId),
          getWorkoutLogs(traineeId, 90),
        ]);
        
        if (plan) {
          const routinesData = await getRoutinesWithExercises(plan.id);
          if (!cancelled) {
            setRoutines(routinesData);
            setWorkoutLogs(logs || []);
          }
        }
      } catch (err) {
        console.error("Error loading workouts:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [traineeId]);

  // Calculate stats for a routine
  const calculateRoutineStats = (routine: RoutineWithExercises): WorkoutStats => {
    const exercises = routine.routine_exercises?.length || 0;
    
    if (exercises === 0) {
      return { exercises: 0, estimatedTime: 0, estimatedCalories: 0, completedCount: 0 };
    }

    const totalSets = routine.routine_exercises!.reduce((sum, re) => sum + (re.target_sets || 3), 0);
    const totalRestTime = routine.routine_exercises!.reduce((sum, re) => {
      const sets = re.target_sets || 3;
      const restTime = re.rest_time_seconds || 180;
      return sum + (sets * restTime);
    }, 0);
    
    const executionTime = totalSets * 30;
    const totalTimeSeconds = totalRestTime + executionTime;
    const estimatedTime = Math.round(totalTimeSeconds / 60);
    const estimatedCalories = Math.round(estimatedTime * 9);
    
    const completedCount = workoutLogs.filter(
      log => log.routine_id === routine.id && log.completed
    ).length;

    return { exercises, estimatedTime, estimatedCalories, completedCount };
  };

  // Filter and sort routines
  const filteredAndSortedRoutines = useMemo(() => {
    let filtered = [...routines];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(r =>
        (r.name || `אימון ${r.letter}`).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply difficulty filter
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(r => {
        const letter = r.letter || "C";
        if (selectedDifficulty === "beginner") return letter === "A" || letter === "B";
        if (selectedDifficulty === "intermediate") return letter === "C" || letter === "D";
        if (selectedDifficulty === "advanced") return letter === "E";
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case "name":
          const nameA = a.name || `אימון ${a.letter}`;
          const nameB = b.name || `אימון ${b.letter}`;
          return nameA.localeCompare(nameB);
        
        case "difficulty":
          const letterA = a.letter || "C";
          const letterB = b.letter || "C";
          return letterA.localeCompare(letterB);
        
        case "recent":
          const statsA = calculateRoutineStats(a);
          const statsB = calculateRoutineStats(b);
          return statsB.completedCount - statsA.completedCount;
        
        case "popular":
          const popularA = calculateRoutineStats(a);
          const popularB = calculateRoutineStats(b);
          return popularB.completedCount - popularA.completedCount;
        
        default:
          return 0;
      }
    });

    return filtered;
  }, [routines, searchQuery, selectedDifficulty, selectedSort, workoutLogs]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalWorkouts = routines.length;
    const totalExercises = routines.reduce((sum, r) => sum + (r.routine_exercises?.length || 0), 0);
    const avgTime = routines.length > 0
      ? Math.round(routines.reduce((sum, r) => {
          const stats = calculateRoutineStats(r);
          return sum + stats.estimatedTime;
        }, 0) / routines.length)
      : 0;
    
    return { totalWorkouts, totalExercises, avgTime };
  }, [routines, workoutLogs]);

  // Toggle favorite
  const toggleFavorite = (routineId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(routineId)) {
        newFavorites.delete(routineId);
      } else {
        newFavorites.add(routineId);
      }
      return newFavorites;
    });
  };

  // Workout images pool
  const routineImages = [
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=240&fit=crop",
    "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400&h=240&fit=crop",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=240&fit=crop",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=240&fit=crop",
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=240&fit=crop"
  ];

  if (loading) {
    return <LoadingSpinner fullScreen text="טוען אימונים..." size="lg" />;
  }

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        
        .slide-up {
          animation: slideUp 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .bg-texture {
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(91, 127, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(91, 127, 255, 0.02) 0%, transparent 50%);
        }
      `}</style>

      <div className="relative bg-[#1A1D2E] w-full min-h-screen bg-texture">
        {/* Main Content */}
        <div className="w-full overflow-y-auto pb-24">
          <div className="w-full max-w-[393px] mx-auto px-5 pt-12">
            <div className="flex flex-col items-start w-full gap-6">
              
              {/* Header */}
              <div className="w-full flex items-center justify-between animate-fade-in">
                <h1 className="text-[32px] font-outfit font-bold text-white">אימונים</h1>
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className="w-12 h-12 bg-[#2D3142] rounded-full flex items-center justify-center hover:bg-[#3D4058] transition-all duration-300 relative hover:scale-110"
                  style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)' }}
                >
                  <Filter className="w-5 h-5 text-white" />
                  {(selectedDifficulty !== "all" || selectedSort !== "name") && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#5B7FFF] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Search Bar */}
              <div 
                className="w-full h-[52px] bg-[#2D3142] rounded-xl flex items-center gap-3 px-4 transition-all duration-300 hover:shadow-lg animate-fade-in"
                style={{ 
                  animationDelay: '100ms',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                <Search className="w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חיפוש אימון..."
                  className="flex-1 bg-transparent text-white text-base font-outfit outline-none placeholder:text-[#9CA3AF]"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#3D4058] transition-colors"
                  >
                    <X className="w-4 h-4 text-[#9CA3AF]" />
                  </button>
                )}
              </div>

              {/* Stats Summary */}
              {routines.length > 0 && (
                <StatsSummary
                  totalWorkouts={summaryStats.totalWorkouts}
                  totalExercises={summaryStats.totalExercises}
                  avgTime={summaryStats.avgTime}
                />
              )}

              {/* Active Filters Display */}
              {(selectedDifficulty !== "all" || selectedSort !== "name" || searchQuery) && (
                <div className="w-full flex items-center gap-2 flex-wrap animate-fade-in">
                  {selectedDifficulty !== "all" && (
                    <div className="flex items-center gap-2 bg-[#5B7FFF]/20 text-[#5B7FFF] px-3 py-1.5 rounded-full">
                      <span className="text-sm font-outfit font-medium">
                        {selectedDifficulty === "beginner" ? "מתחיל" : 
                         selectedDifficulty === "intermediate" ? "בינוני" : "מתקדם"}
                      </span>
                      <button 
                        onClick={() => setSelectedDifficulty("all")}
                        className="w-4 h-4 flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {selectedSort !== "name" && (
                    <div className="flex items-center gap-2 bg-[#FF8A00]/20 text-[#FF8A00] px-3 py-1.5 rounded-full">
                      <span className="text-sm font-outfit font-medium">
                        {selectedSort === "difficulty" ? "לפי קושי" :
                         selectedSort === "recent" ? "אחרונים" : "פופולריים"}
                      </span>
                      <button 
                        onClick={() => setSelectedSort("name")}
                        className="w-4 h-4 flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Results Count */}
              {routines.length > 0 && (
                <div className="w-full flex items-center justify-between text-sm animate-fade-in" style={{ animationDelay: '200ms' }}>
                  <span className="text-[#9CA3AF] font-outfit">
                    {filteredAndSortedRoutines.length} אימונים
                    {searchQuery && ` (מתוך ${routines.length})`}
                  </span>
                </div>
              )}

              {/* Workout Cards List */}
              {filteredAndSortedRoutines.length > 0 ? (
                <div className="w-full flex flex-col gap-5">
                  {filteredAndSortedRoutines.map((routine, index) => (
                    <WorkoutCard
                      key={routine.id}
                      routine={routine}
                      imageUrl={routineImages[index % routineImages.length]}
                      stats={calculateRoutineStats(routine)}
                      index={index}
                      onFavorite={() => toggleFavorite(routine.id)}
                      isFavorite={favorites.has(routine.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="w-full text-center py-12 slide-up">
                  <div className="bg-[#2D3142] rounded-2xl p-8"
                    style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)' }}
                  >
                    <div className="w-16 h-16 bg-[#3D4058] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-[#9CA3AF]" />
                    </div>
                    <p className="text-white text-lg font-outfit font-semibold mb-2">
                      {searchQuery ? "לא נמצאו תוצאות" : "אין אימונים זמינים"}
                    </p>
                    <p className="text-[#9CA3AF] text-sm font-outfit">
                      {searchQuery ? "נסה חיפוש אחר או שנה את הסינון" : "התחל להוסיף אימונים לתוכנית שלך"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Modal */}
        <FilterModal
          show={showFilter}
          onClose={() => setShowFilter(false)}
          selectedDifficulty={selectedDifficulty}
          onDifficultyChange={setSelectedDifficulty}
          selectedSort={selectedSort}
          onSortChange={setSelectedSort}
        />
      </div>
    </>
  );
}