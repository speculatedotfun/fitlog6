"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Image as ImageIcon } from "lucide-react";
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
      alert("שגיאה בשמירת התרגיל");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("האם אתה בטוח שברצונך למחוק תרגיל זה?")) return;
    
    try {
      setIsDeleting(true);
      await onDelete(exercise.id);
    } catch (error) {
      console.error("Error deleting exercise:", error);
      alert("שגיאה במחיקת התרגיל");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveImage = async () => {
    if (!onUpdateImage || !imageUrl.trim()) return;
    
    try {
      await onUpdateImage(exercise.id, imageUrl);
    } catch (error) {
      console.error("Error saving image:", error);
      alert("שגיאה בשמירת התמונה");
    }
  };

  if (isEditing) {
    return (
      <div className="border-b border-gray-800 pb-4 last:border-0">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h4 className="text-white font-semibold mb-3">
              {index + 1}. {exercise.exercise?.name || 'תרגיל לא ידוע'}
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">סטים:</label>
                <Input
                  type="number"
                  value={values.target_sets || 0}
                  onChange={(e) => setValues({
                    ...values,
                    target_sets: parseInt(e.target.value) || 0
                  })}
                  className="bg-[#0f1a2a] border-gray-700 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">חזרות:</label>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    value={values.target_reps_min || 0}
                    onChange={(e) => setValues({
                      ...values,
                      target_reps_min: parseInt(e.target.value) || 0
                    })}
                    className="bg-[#0f1a2a] border-gray-700 text-white text-sm"
                    placeholder="מינימום"
                  />
                  <span className="text-gray-400 self-center">-</span>
                  <Input
                    type="number"
                    value={values.target_reps_max || 0}
                    onChange={(e) => setValues({
                      ...values,
                      target_reps_max: parseInt(e.target.value) || 0
                    })}
                    className="bg-[#0f1a2a] border-gray-700 text-white text-sm"
                    placeholder="מקסימום"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">RIR:</label>
                <Input
                  type="number"
                  value={values.rir_target || 0}
                  onChange={(e) => setValues({
                    ...values,
                    rir_target: parseInt(e.target.value) || 0
                  })}
                  className="bg-[#0f1a2a] border-gray-700 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">מנוחה:</label>
                <Input
                  type="number"
                  value={values.rest_time_seconds || 0}
                  onChange={(e) => setValues({
                    ...values,
                    rest_time_seconds: parseInt(e.target.value) || 0
                  })}
                  className="bg-[#0f1a2a] border-gray-700 text-white text-sm"
                />
              </div>
              <div className="col-span-2 lg:col-span-4">
                <label className="text-xs text-gray-400 mb-1 block">הוראות ביצוע:</label>
                <Textarea
                  value={values.special_instructions || ''}
                  onChange={(e) => setValues({
                    ...values,
                    special_instructions: e.target.value
                  })}
                  placeholder="הזן הוראות ביצוע מפורטות לתרגיל..."
                  className="bg-[#0f1a2a] border-gray-700 text-white text-sm min-h-[100px]"
                  rows={4}
                />
              </div>
              {onUpdateImage && (
                <div className="col-span-2 lg:col-span-4">
                  <label className="text-xs text-gray-400 mb-1 block">
                    <ImageIcon className="inline h-3 w-3 ml-1" />
                    URL תמונה:
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="bg-[#0f1a2a] border-gray-700 text-white text-sm flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSaveImage}
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      <Save className="h-3 w-3 ml-1" />
                      שמור תמונה
                    </Button>
                  </div>
                  {imageUrl && (
                    <div className="mt-2">
                      <img
                        src={imageUrl}
                        alt="תצוגה מקדימה"
                        className="w-24 h-24 rounded object-cover border border-gray-700"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="col-span-2 lg:col-span-4 flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-[#00ff88] hover:bg-[#00e677] text-black"
                >
                  {isSaving ? "שומר..." : "שמור"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset values
                    setValues({
                      target_sets: exercise.target_sets,
                      target_reps_min: exercise.target_reps_min,
                      target_reps_max: exercise.target_reps_max,
                      rir_target: exercise.rir_target,
                      rest_time_seconds: exercise.rest_time_seconds,
                      special_instructions: exercise.special_instructions || '',
                    });
                  }}
                  className="border-gray-700 text-gray-300"
                >
                  ביטול
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="border-red-700 text-red-400 hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" />
                  מחק
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-800 pb-4 last:border-0">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h4 className="text-white font-semibold mb-3">
            {index + 1}. {exercise.exercise?.name || 'תרגיל לא ידוע'}
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-3">
            <div>
              <span className="text-gray-400">סטים:</span>
              <span className="text-white mr-2">{exercise.target_sets}</span>
            </div>
            <div>
              <span className="text-gray-400">חזרות:</span>
              <span className="text-white mr-2">{exercise.target_reps_min}-{exercise.target_reps_max}</span>
            </div>
            <div>
              <span className="text-gray-400">RIR:</span>
              <span className="text-white mr-2">{exercise.rir_target}</span>
            </div>
            <div>
              <span className="text-gray-400">מנוחה:</span>
              <span className="text-white mr-2">{exercise.rest_time_seconds}ש</span>
            </div>
          </div>
          {exercise.exercise?.image_url && (
            <div className="mb-3">
              <img
                src={exercise.exercise.image_url}
                alt={exercise.exercise.name}
                className="w-32 h-32 rounded object-cover border border-gray-700"
              />
            </div>
          )}
          {exercise.special_instructions && (
            <div className="col-span-2 lg:col-span-4 mt-2 p-3 bg-[#0f1a2a] rounded-lg border border-gray-700 mb-3">
              <p className="text-xs text-gray-400 mb-1">הוראות ביצוע:</p>
              <p className="text-sm text-white whitespace-pre-line">{exercise.special_instructions}</p>
            </div>
          )}
          <div className="col-span-2 lg:col-span-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              ערוך
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

