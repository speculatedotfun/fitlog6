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

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by muscle group
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
      alert("אנא הזן שם תרגיל");
      return;
    }

    if (!selectedRoutineId) {
      alert("אנא בחר רוטינה קודם");
      return;
    }

    try {
      setCreatingExercise(true);
      await onCreateAndAdd(selectedRoutineId, {
        name: newExerciseName.trim(),
        muscle_group: newExerciseMuscleGroup,
        image_url: newExerciseImageUrl.trim(),
      });

      // Reset form
      setNewExerciseName("");
      setNewExerciseMuscleGroup("כללי");
      setNewExerciseImageUrl("");
      setShowNewExerciseForm(false);
      setSearchQuery("");
    } catch (error) {
      console.error("Error creating exercise:", error);
      alert("שגיאה ביצירת תרגיל");
    } finally {
      setCreatingExercise(false);
    }
  };

  const handleExerciseClick = (exercise: Exercise) => {
    if (selectedRoutineId) {
      onSelectExercise(selectedRoutineId, exercise);
    }
  };

  // Check if search query doesn't match any exercise
  const searchQueryNotMatched = searchQuery.trim() &&
    !filteredExercises.some(ex =>
      ex.name.toLowerCase() === searchQuery.toLowerCase().trim()
    ) &&
    !showNewExerciseForm;

  return (
    <aside className={`
      ${isOpen ? 'flex' : 'hidden'} lg:flex
      lg:w-80 flex-col bg-[#1a2332] border-l border-gray-800
      fixed lg:relative inset-y-0 left-0 z-30 lg:z-auto
    `}>
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">ספריית תרגילים</h2>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-gray-800"
            onClick={onClose}
          >
            <XIcon className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="p-4 border-b border-gray-800 space-y-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              // Auto-fill new exercise name if typing
              if (e.target.value.trim() && !filteredExercises.some(ex =>
                ex.name.toLowerCase() === e.target.value.toLowerCase().trim()
              )) {
                setNewExerciseName(e.target.value.trim());
              }
            }}
            placeholder="חפש תרגיל או הקלד שם חדש..."
            className="bg-[#0f1a2a] border-gray-700 text-white pr-10"
          />
        </div>

        {/* Show create button if search doesn't match */}
        {searchQueryNotMatched && (
          <Button
            onClick={() => {
              setShowNewExerciseForm(true);
              setNewExerciseName(searchQuery.trim());
            }}
            className="w-full bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
            size="sm"
          >
            <Plus className="h-4 w-4 ml-2" />
            צור תרגיל חדש: "{searchQuery.trim()}"
          </Button>
        )}

        {/* Add New Exercise Button */}
        {!showNewExerciseForm && !searchQueryNotMatched && (
          <Button
            onClick={() => {
              setShowNewExerciseForm(true);
              setNewExerciseName(searchQuery.trim() || "");
            }}
            className="w-full bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
            size="sm"
          >
            <Plus className="h-4 w-4 ml-2" />
            הוסף תרגיל חדש
          </Button>
        )}

        {/* New Exercise Form */}
        {showNewExerciseForm && (
          <Card className="bg-[#0f1a2a] border-gray-700">
            <CardContent className="pt-4 space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">שם התרגיל:</label>
                <Input
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  placeholder="לדוגמה: סקוואט"
                  className="bg-[#1a2332] border-gray-700 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">קבוצת שרירים:</label>
                <select
                  value={newExerciseMuscleGroup}
                  onChange={(e) => setNewExerciseMuscleGroup(e.target.value)}
                  className="w-full bg-[#1a2332] border border-gray-700 text-white text-sm rounded px-3 py-2"
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
                <label className="text-xs text-gray-400 mb-1 block">
                  <ImageIcon className="inline h-3 w-3 ml-1" />
                  URL תמונה (אופציונלי):
                </label>
                <Input
                  value={newExerciseImageUrl}
                  onChange={(e) => setNewExerciseImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="bg-[#1a2332] border-gray-700 text-white text-sm"
                />
                {newExerciseImageUrl && (
                  <div className="mt-2">
                    <img
                      src={newExerciseImageUrl}
                      alt="תצוגה מקדימה"
                      className="w-20 h-20 rounded object-cover border border-gray-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateAndAdd}
                  disabled={creatingExercise || !newExerciseName.trim() || !selectedRoutineId}
                  className="flex-1 bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
                  size="sm"
                >
                  {creatingExercise ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      יוצר...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 ml-2" />
                      צור והוסף
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowNewExerciseForm(false);
                    setNewExerciseName("");
                    setNewExerciseMuscleGroup("כללי");
                    setNewExerciseImageUrl("");
                  }}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  size="sm"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          {getMuscleGroups().map((group) => (
            <Button
              key={group}
              size="sm"
              variant={selectedMuscleGroup === group ? "default" : "outline"}
              onClick={() => setSelectedMuscleGroup(group)}
              className={
                selectedMuscleGroup === group
                  ? "bg-[#00ff88] text-black"
                  : "border-gray-700 text-gray-300 hover:bg-gray-800"
              }
            >
              {group}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {selectedRoutineId && (
          <div className="mb-3 p-3 bg-[#00ff88]/20 border border-[#00ff88]/50 rounded-lg">
            <p className="text-xs text-[#00ff88] font-semibold mb-1">מוסיף לרוטינה:</p>
            <p className="text-sm text-white">
              {routines.find(r => r.id === selectedRoutineId)?.letter || ''} - {routines.find(r => r.id === selectedRoutineId)?.name || ''}
            </p>
            {onClearSelection && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClearSelection}
                className="mt-2 text-xs text-gray-400 hover:text-white h-6 px-2"
              >
                <XIcon className="h-3 w-3 ml-1" />
                ביטול בחירה
              </Button>
            )}
          </div>
        )}
        {filteredExercises.map((exercise) => (
          <div
            key={exercise.id}
            className="flex items-center gap-3 p-3 bg-[#0f1a2a] rounded-lg hover:bg-[#1a2332] cursor-pointer border border-gray-800"
            onClick={() => handleExerciseClick(exercise)}
          >
            <GripVertical className="h-5 w-5 text-gray-600" />
            <div className="flex-1">
              <p className="text-white text-sm">{exercise.name}</p>
              <p className="text-gray-500 text-xs">{exercise.muscle_group}</p>
            </div>
            {exercise.image_url ? (
              <img
                src={exercise.image_url}
                alt={exercise.name}
                className="w-12 h-12 rounded object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-gray-700 flex items-center justify-center">
                <span className="text-gray-500 text-xs">תמונה</span>
              </div>
            )}
          </div>
        ))}
        {filteredExercises.length === 0 && !searchQuery.trim() && (
          <div className="text-center text-gray-500 py-8">
            לא נמצאו תרגילים
          </div>
        )}
      </div>
    </aside>
  );
}

