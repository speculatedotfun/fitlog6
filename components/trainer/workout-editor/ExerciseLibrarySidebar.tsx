"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X as XIcon, Plus, GripVertical, Image as ImageIcon, Loader2 } from "lucide-react";
import type { Exercise, RoutineWithExercises } from "@/lib/types";

interface ExerciseLibrarySidebarProps {
  exercises: Exercise[];
  routines: RoutineWithExercises[];
  selectedRoutineId: string | null;
  onSelectExercise: (routineId: string, exercise: Exercise) => void;
  onCreateAndAdd: (routineId: string, exerciseData: { name: string; muscle_group: string; image_url: string }) => Promise<void>;
  onClose?: () => void;
  onClearSelection?: () => void;
  isOpen: boolean;
}

export function ExerciseLibrarySidebar({
  exercises,
  routines,
  selectedRoutineId,
  onSelectExercise,
  onCreateAndAdd,
  onClose,
  onClearSelection,
  isOpen,
}: ExerciseLibrarySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("הכל");
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>(exercises);
  const [showNewExerciseForm, setShowNewExerciseForm] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseMuscleGroup, setNewExerciseMuscleGroup] = useState("כללי");
  const [newExerciseImageUrl, setNewExerciseImageUrl] = useState("");
  const [creatingExercise, setCreatingExercise] = useState(false);

  useEffect(() => {
    filterExercises();
  }, [searchQuery, selectedMuscleGroup, exercises]);

  const filterExercises = () => {
    let filtered = exercises;

    if (searchQuery.trim()) {
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedMuscleGroup !== "הכל") {
      filtered = filtered.filter(ex => ex.muscle_group === selectedMuscleGroup);
    }

    setFilteredExercises(filtered);
  };

  const getMuscleGroups = () => {
    const groups = new Set(exercises.map(ex => ex.muscle_group));
    return ["הכל", ...Array.from(groups).sort()];
  };

  const handleCreateAndAdd = async () => {
    if (!newExerciseName.trim()) {
      alert("⚠️ אנא הזן שם תרגיל");
      return;
    }

    if (!selectedRoutineId) {
      alert("⚠️ אנא בחר רוטינה קודם");
      return;
    }

    try {
      setCreatingExercise(true);
      await onCreateAndAdd(selectedRoutineId, {
        name: newExerciseName.trim(),
        muscle_group: newExerciseMuscleGroup,
        image_url: newExerciseImageUrl.trim(),
      });

      setNewExerciseName("");
      setNewExerciseMuscleGroup("כללי");
      setNewExerciseImageUrl("");
      setShowNewExerciseForm(false);
      setSearchQuery("");
    } catch (error) {
      console.error("Error creating exercise:", error);
      alert("❌ שגיאה ביצירת תרגיל");
    } finally {
      setCreatingExercise(false);
    }
  };

  const handleExerciseClick = (exercise: Exercise) => {
    if (selectedRoutineId) {
      onSelectExercise(selectedRoutineId, exercise);
    }
  };

  const searchQueryNotMatched = searchQuery.trim() &&
    !filteredExercises.some(ex =>
      ex.name.toLowerCase() === searchQuery.toLowerCase().trim()
    ) &&
    !showNewExerciseForm;

  return (
    <>
      <style jsx>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .slide-in-right {
          animation: slideInRight 0.4s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>

      <aside className={`
        ${isOpen ? 'flex' : 'hidden'} lg:flex
        lg:w-80 flex-col bg-[#2D3142] border-l-2 border-[#3D4058]
        fixed lg:relative inset-y-0 left-0 z-30 lg:z-auto
        slide-in-right
      `}
      style={{ boxShadow: '0 0 32px rgba(0, 0, 0, 0.3)' }}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-2 border-[#3D4058] flex items-center justify-between bg-[#1A1D2E]">
          <h2 className="text-lg font-outfit font-bold text-white">ספריית תרגילים</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden w-8 h-8 rounded-lg bg-[#2D3142] hover:bg-[#3D4058] border border-[#3D4058] flex items-center justify-center transition-all"
            >
              <XIcon className="h-4 w-4 text-white" />
            </button>
          )}
        </div>

        {/* Search & Filters */}
        <div className="p-4 sm:p-5 border-b-2 border-[#3D4058] space-y-3 bg-[#1A1D2E]">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim() && !filteredExercises.some(ex =>
                  ex.name.toLowerCase() === e.target.value.toLowerCase().trim()
                )) {
                  setNewExerciseName(e.target.value.trim());
                }
              }}
              placeholder="חפש תרגיל או הקלד שם חדש..."
              className="bg-[#2D3142] border-2 border-[#3D4058] text-white placeholder:text-[#9CA3AF] pr-10 rounded-xl font-outfit focus:border-[#5B7FFF] transition-all"
            />
          </div>

          {/* Create New Exercise Button (from search) */}
          {searchQueryNotMatched && (
            <button
              onClick={() => {
                setShowNewExerciseForm(true);
                setNewExerciseName(searchQuery.trim());
              }}
              className="w-full bg-gradient-to-br from-[#5B7FFF] to-[#4A5FCC] hover:from-[#6B8EFF] hover:to-[#5A6FDD] text-white px-4 py-2.5 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
              style={{ boxShadow: '0 4px 16px rgba(91, 127, 255, 0.3)' }}
            >
              <Plus className="h-4 w-4" />
              צור תרגיל חדש: "{searchQuery.trim()}"
            </button>
          )}

          {/* Add New Exercise Button */}
          {!showNewExerciseForm && !searchQueryNotMatched && (
            <button
              onClick={() => {
                setShowNewExerciseForm(true);
                setNewExerciseName(searchQuery.trim() || "");
              }}
              className="w-full bg-gradient-to-br from-[#5B7FFF] to-[#4A5FCC] hover:from-[#6B8EFF] hover:to-[#5A6FDD] text-white px-4 py-2.5 rounded-xl font-outfit font-semibold text-sm transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
              style={{ boxShadow: '0 4px 16px rgba(91, 127, 255, 0.3)' }}
            >
              <Plus className="h-4 w-4" />
              הוסף תרגיל חדש
            </button>
          )}

          {/* New Exercise Form */}
          {showNewExerciseForm && (
            <div className="bg-[#2D3142] border-2 border-[#3D4058] rounded-xl p-4 space-y-3 animate-fade-in">
              <div>
                <label className="text-xs font-outfit font-semibold text-[#9CA3AF] mb-1.5 block">
                  שם התרגיל:
                </label>
                <Input
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  placeholder="לדוגמה: סקוואט"
                  className="bg-[#1A1D2E] border-2 border-[#3D4058] text-white placeholder:text-[#9CA3AF] text-sm rounded-lg font-outfit focus:border-[#5B7FFF]"
                />
              </div>
              <div>
                <label className="text-xs font-outfit font-semibold text-[#9CA3AF] mb-1.5 block">
                  קבוצת שרירים:
                </label>
                <select
                  value={newExerciseMuscleGroup}
                  onChange={(e) => setNewExerciseMuscleGroup(e.target.value)}
                  className="w-full bg-[#1A1D2E] border-2 border-[#3D4058] text-white text-sm rounded-lg px-3 py-2 font-outfit focus:outline-none focus:border-[#5B7FFF] transition-all"
                >
                  <option value="כללי">כללי</option>
                  <option value="חזה">חזה</option>
                  <option value="גב">גב</option>
                  <option value="כתפיים">כתפיים</option>
                  <option value="ידיים">ידיים</option>
                  <option value="רגליים">רגליים</option>
                  <option value="בטן">בטן</option>
                  <option value="קרדיו">קרדיו</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-outfit font-semibold text-[#9CA3AF] mb-1.5 block flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  URL תמונה (אופציונלי):
                </label>
                <Input
                  value={newExerciseImageUrl}
                  onChange={(e) => setNewExerciseImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="bg-[#1A1D2E] border-2 border-[#3D4058] text-white placeholder:text-[#9CA3AF] text-sm rounded-lg font-outfit focus:border-[#5B7FFF]"
                />
                {newExerciseImageUrl && (
                  <div className="mt-2">
                    <img
                      src={newExerciseImageUrl}
                      alt="תצוגה מקדימה"
                      className="w-20 h-20 rounded-lg object-cover border-2 border-[#3D4058]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCreateAndAdd}
                  disabled={creatingExercise || !newExerciseName.trim() || !selectedRoutineId}
                  className="flex-1 bg-gradient-to-br from-[#5B7FFF] to-[#4A5FCC] hover:from-[#6B8EFF] hover:to-[#5A6FDD] text-white px-4 py-2.5 rounded-lg font-outfit font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ boxShadow: '0 4px 16px rgba(91, 127, 255, 0.3)' }}
                >
                  {creatingExercise ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      יוצר...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      צור והוסף
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowNewExerciseForm(false);
                    setNewExerciseName("");
                    setNewExerciseMuscleGroup("כללי");
                    setNewExerciseImageUrl("");
                  }}
                  className="w-10 h-10 rounded-lg bg-[#1A1D2E] hover:bg-[#3D4058] border-2 border-[#3D4058] flex items-center justify-center transition-all"
                >
                  <XIcon className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>
          )}

          {/* Muscle Group Filters */}
          <div className="flex flex-wrap gap-2">
            {getMuscleGroups().map((group) => (
              <button
                key={group}
                onClick={() => setSelectedMuscleGroup(group)}
                className={`
                  px-3 py-1.5 rounded-lg font-outfit font-semibold text-xs transition-all
                  ${selectedMuscleGroup === group
                    ? 'bg-[#5B7FFF] text-white shadow-lg shadow-[#5B7FFF]/30'
                    : 'bg-[#2D3142] text-[#9CA3AF] border border-[#3D4058] hover:bg-[#3D4058] hover:text-white'
                  }
                `}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
          {/* Selected Routine Indicator */}
          {selectedRoutineId && (
            <div 
              className="mb-3 p-3 bg-[#5B7FFF]/10 border-2 border-[#5B7FFF]/30 rounded-xl animate-fade-in"
              style={{ boxShadow: '0 4px 16px rgba(91, 127, 255, 0.1)' }}
            >
              <p className="text-xs font-outfit font-semibold text-[#5B7FFF] mb-1">
                מוסיף לרוטינה:
              </p>
              <p className="text-sm font-outfit font-bold text-white">
                {routines.find(r => r.id === selectedRoutineId)?.letter || ''} - {routines.find(r => r.id === selectedRoutineId)?.name || ''}
              </p>
              {onClearSelection && (
                <button
                  onClick={onClearSelection}
                  className="mt-2 text-xs font-outfit text-[#9CA3AF] hover:text-white flex items-center gap-1 transition-colors"
                >
                  <XIcon className="h-3 w-3" />
                  ביטול בחירה
                </button>
              )}
            </div>
          )}

          {/* Exercise Cards */}
          {filteredExercises.map((exercise, index) => (
            <div
              key={exercise.id}
              onClick={() => handleExerciseClick(exercise)}
              className="flex items-center gap-3 p-3 bg-[#1A1D2E] rounded-xl hover:bg-[#3D4058] cursor-pointer border-2 border-[#3D4058] hover:border-[#5B7FFF] transition-all group"
              style={{ 
                animationDelay: `${index * 30}ms`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
            >
              <GripVertical className="h-5 w-5 text-[#9CA3AF] group-hover:text-[#5B7FFF] transition-colors" />
              <div className="flex-1">
                <p className="text-white text-sm font-outfit font-semibold">{exercise.name}</p>
                <p className="text-[#9CA3AF] text-xs font-outfit">{exercise.muscle_group}</p>
              </div>
              {exercise.image_url ? (
                <img
                  src={exercise.image_url}
                  alt={exercise.name}
                  className="w-12 h-12 rounded-lg object-cover border-2 border-[#3D4058] group-hover:border-[#5B7FFF] transition-all"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-[#2D3142] border-2 border-[#3D4058] flex items-center justify-center group-hover:border-[#5B7FFF] transition-all">
                  <span className="text-[#9CA3AF] text-[10px] font-outfit">תמונה</span>
                </div>
              )}
            </div>
          ))}

          {/* Empty State */}
          {filteredExercises.length === 0 && !searchQuery.trim() && (
            <div className="text-center text-[#9CA3AF] py-12 font-outfit">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#2D3142] border-2 border-[#3D4058] flex items-center justify-center">
                <Search className="h-8 w-8 text-[#9CA3AF]" />
              </div>
              <p className="font-semibold">לא נמצאו תרגילים</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}