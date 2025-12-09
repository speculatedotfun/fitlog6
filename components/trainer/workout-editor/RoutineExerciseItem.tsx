"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Image as ImageIcon, Edit2, Trash2 } from "lucide-react";
import type { RoutineExercise } from "@/lib/types";

interface RoutineExerciseItemProps {
  exercise: RoutineExercise & { exercise?: { id: string; name: string; image_url: string | null } };
  index: number;
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateImage?: (exerciseId: string, imageUrl: string) => Promise<void>;
}

export function RoutineExerciseItem({
  exercise,
  index,
  onUpdate,
  onDelete,
  onUpdateImage,
}: RoutineExerciseItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [values, setValues] = useState({
    target_sets: exercise.target_sets,
    target_reps_min: exercise.target_reps_min,
    target_reps_max: exercise.target_reps_max,
    rir_target: exercise.rir_target,
    rest_time_seconds: exercise.rest_time_seconds,
    special_instructions: exercise.special_instructions || '',
  });
  const [imageUrl, setImageUrl] = useState(exercise.exercise?.image_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onUpdate(exercise.id, values);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving exercise:", error);
      alert("❌ שגיאה בשמירת התרגיל");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("⚠️ האם אתה בטוח שברצונך למחוק תרגיל זה?")) return;
    
    try {
      setIsDeleting(true);
      await onDelete(exercise.id);
    } catch (error) {
      console.error("Error deleting exercise:", error);
      alert("❌ שגיאה במחיקת התרגיל");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveImage = async () => {
    if (!onUpdateImage || !imageUrl.trim()) return;
    
    try {
      await onUpdateImage(exercise.id, imageUrl);
      alert("✅ התמונה נשמרה בהצלחה!");
    } catch (error) {
      console.error("Error saving image:", error);
      alert("❌ שגיאה בשמירת התמונה");
    }
  };

  if (isEditing) {
    return (
      <div className="border-b-2 border-[#3D4058] pb-4 last:border-0">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex-1 space-y-4">
            {/* Exercise Title */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#5B7FFF] flex items-center justify-center">
                <span className="text-white font-outfit font-bold text-sm">{index + 1}</span>
              </div>
              <h4 className="text-white font-outfit font-bold text-base">
                {exercise.exercise?.name || 'תרגיל לא ידוע'}
              </h4>
            </div>

            {/* Exercise Parameters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-outfit font-semibold text-[#9CA3AF] mb-1.5 block">סטים:</label>
                <Input
                  type="number"
                  value={values.target_sets || 0}
                  onChange={(e) => setValues({
                    ...values,
                    target_sets: parseInt(e.target.value) || 0
                  })}
                  className="bg-[#1A1D2E] border-2 border-[#3D4058] text-white text-sm rounded-lg font-outfit focus:border-[#5B7FFF]"
                />
              </div>
              <div>
                <label className="text-xs font-outfit font-semibold text-[#9CA3AF] mb-1.5 block">חזרות:</label>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    value={values.target_reps_min || 0}
                    onChange={(e) => setValues({
                      ...values,
                      target_reps_min: parseInt(e.target.value) || 0
                    })}
                    className="bg-[#1A1D2E] border-2 border-[#3D4058] text-white text-sm rounded-lg font-outfit focus:border-[#5B7FFF]"
                    placeholder="Min"
                  />
                  <span className="text-[#9CA3AF] self-center font-bold">-</span>
                  <Input
                    type="number"
                    value={values.target_reps_max || 0}
                    onChange={(e) => setValues({
                      ...values,
                      target_reps_max: parseInt(e.target.value) || 0
                    })}
                    className="bg-[#1A1D2E] border-2 border-[#3D4058] text-white text-sm rounded-lg font-outfit focus:border-[#5B7FFF]"
                    placeholder="Max"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-outfit font-semibold text-[#9CA3AF] mb-1.5 block">RIR:</label>
                <Input
                  type="number"
                  value={values.rir_target || 0}
                  onChange={(e) => setValues({
                    ...values,
                    rir_target: parseInt(e.target.value) || 0
                  })}
                  className="bg-[#1A1D2E] border-2 border-[#3D4058] text-white text-sm rounded-lg font-outfit focus:border-[#5B7FFF]"
                />
              </div>
              <div>
                <label className="text-xs font-outfit font-semibold text-[#9CA3AF] mb-1.5 block">מנוחה (שניות):</label>
                <Input
                  type="number"
                  value={values.rest_time_seconds || 0}
                  onChange={(e) => setValues({
                    ...values,
                    rest_time_seconds: parseInt(e.target.value) || 0
                  })}
                  className="bg-[#1A1D2E] border-2 border-[#3D4058] text-white text-sm rounded-lg font-outfit focus:border-[#5B7FFF]"
                />
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="text-xs font-outfit font-semibold text-[#9CA3AF] mb-1.5 block">הוראות ביצוע:</label>
              <Textarea
                value={values.special_instructions || ''}
                onChange={(e) => setValues({
                  ...values,
                  special_instructions: e.target.value
                })}
                placeholder="הזן הוראות ביצוע מפורטות לתרגיל..."
                className="bg-[#1A1D2E] border-2 border-[#3D4058] text-white placeholder:text-[#9CA3AF] text-sm min-h-[100px] rounded-lg font-outfit focus:border-[#5B7FFF]"
                rows={4}
              />
            </div>

            {/* Image URL */}
            {onUpdateImage && (
              <div>
                <label className="text-xs font-outfit font-semibold text-[#9CA3AF] mb-1.5 block flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  URL תמונה:
                </label>
                <div className="flex gap-2">
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="bg-[#1A1D2E] border-2 border-[#3D4058] text-white placeholder:text-[#9CA3AF] text-sm flex-1 rounded-lg font-outfit focus:border-[#5B7FFF]"
                  />
                  <button
                    onClick={handleSaveImage}
                    className="bg-[#4CAF50] hover:bg-[#45A049] text-white px-4 py-2 rounded-lg font-outfit font-semibold text-sm transition-all flex items-center gap-2"
                    style={{ boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)' }}
                  >
                    <Save className="h-3 w-3" />
                    שמור תמונה
                  </button>
                </div>
                {imageUrl && (
                  <div className="mt-2">
                    <img
                      src={imageUrl}
                      alt="תצוגה מקדימה"
                      className="w-24 h-24 rounded-lg object-cover border-2 border-[#3D4058]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-br from-[#5B7FFF] to-[#4A5FCC] hover:from-[#6B8EFF] hover:to-[#5A6FDD] text-white px-4 py-2 rounded-lg font-outfit font-semibold text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                style={{ boxShadow: '0 4px 16px rgba(91, 127, 255, 0.3)' }}
              >
                {isSaving ? "שומר..." : "שמור"}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setValues({
                    target_sets: exercise.target_sets,
                    target_reps_min: exercise.target_reps_min,
                    target_reps_max: exercise.target_reps_max,
                    rir_target: exercise.rir_target,
                    rest_time_seconds: exercise.rest_time_seconds,
                    special_instructions: exercise.special_instructions || '',
                  });
                }}
                className="bg-[#2D3142] hover:bg-[#3D4058] border-2 border-[#3D4058] text-white px-4 py-2 rounded-lg font-outfit font-semibold text-sm transition-all"
              >
                ביטול
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-[#EF4444] hover:bg-[#DC2626] text-white px-4 py-2 rounded-lg font-outfit font-semibold text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                style={{ boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)' }}
              >
                <X className="h-4 w-4" />
                מחק
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b-2 border-[#3D4058] pb-4 last:border-0 group hover:bg-[#1A1D2E]/30 -mx-2 px-2 rounded-lg transition-all">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex-1">
          {/* Exercise Title */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#5B7FFF] flex items-center justify-center">
              <span className="text-white font-outfit font-bold text-sm">{index + 1}</span>
            </div>
            <h4 className="text-white font-outfit font-bold text-base">
              {exercise.exercise?.name || 'תרגיל לא ידוע'}
            </h4>
          </div>

          {/* Exercise Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div className="bg-[#2D3142] rounded-lg p-2 border border-[#3D4058]">
              <span className="text-[#9CA3AF] text-xs font-outfit block">סטים:</span>
              <span className="text-white font-outfit font-bold text-sm">{exercise.target_sets}</span>
            </div>
            <div className="bg-[#2D3142] rounded-lg p-2 border border-[#3D4058]">
              <span className="text-[#9CA3AF] text-xs font-outfit block">חזרות:</span>
              <span className="text-white font-outfit font-bold text-sm">{exercise.target_reps_min}-{exercise.target_reps_max}</span>
            </div>
            <div className="bg-[#2D3142] rounded-lg p-2 border border-[#3D4058]">
              <span className="text-[#9CA3AF] text-xs font-outfit block">RIR:</span>
              <span className="text-white font-outfit font-bold text-sm">{exercise.rir_target}</span>
            </div>
            <div className="bg-[#2D3142] rounded-lg p-2 border border-[#3D4058]">
              <span className="text-[#9CA3AF] text-xs font-outfit block">מנוחה:</span>
              <span className="text-white font-outfit font-bold text-sm">{exercise.rest_time_seconds}ש</span>
            </div>
          </div>

          {/* Exercise Image */}
          {exercise.exercise?.image_url && (
            <div className="mb-3">
              <img
                src={exercise.exercise.image_url}
                alt={exercise.exercise.name}
                className="w-32 h-32 rounded-lg object-cover border-2 border-[#3D4058]"
              />
            </div>
          )}

          {/* Special Instructions */}
          {exercise.special_instructions && (
            <div className="mt-2 p-3 bg-[#2D3142] rounded-lg border border-[#3D4058] mb-3">
              <p className="text-xs font-outfit font-semibold text-[#9CA3AF] mb-1">הוראות ביצוע:</p>
              <p className="text-sm font-outfit text-white whitespace-pre-line">{exercise.special_instructions}</p>
            </div>
          )}

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(true)}
            className="bg-[#2D3142] hover:bg-[#3D4058] border-2 border-[#3D4058] hover:border-[#5B7FFF] text-white px-4 py-2 rounded-lg font-outfit font-semibold text-sm transition-all flex items-center gap-2"
          >
            <Edit2 className="h-4 w-4" />
            ערוך תרגיל
          </button>
        </div>
      </div>
    </div>
  );
}