"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Plus, GripVertical, Trash2 } from "lucide-react";
import { RoutineExerciseItem } from "./RoutineExerciseItem";
import type { RoutineWithExercises, RoutineExercise } from "@/lib/types";

interface WorkoutRoutineCardProps {
  routine: RoutineWithExercises;
  isExpanded: boolean;
  onToggle: () => void;
  onAddExercise: () => void;
  onUpdateExercise: (exerciseId: string, data: any) => Promise<void>;
  onDeleteExercise: (exerciseId: string) => Promise<void>;
  onDeleteRoutine?: () => void;
  onUpdateExerciseImage?: (exerciseId: string, imageUrl: string) => Promise<void>;
}

export function WorkoutRoutineCard({
  routine,
  isExpanded,
  onToggle,
  onAddExercise,
  onUpdateExercise,
  onDeleteExercise,
  onDeleteRoutine,
  onUpdateExerciseImage,
}: WorkoutRoutineCardProps) {
  const sortedExercises = [...routine.routine_exercises].sort(
    (a, b) => a.order_index - b.order_index
  );

  return (
    <>
      <style jsx>{`
        @keyframes expandDown {
          from { max-height: 0; opacity: 0; }
          to { max-height: 2000px; opacity: 1; }
        }
        
        .expand-animation {
          animation: expandDown 0.3s ease-out forwards;
        }
      `}</style>

      <div 
        className="bg-[#2D3142] border-2 border-[#3D4058] hover:border-[#5B7FFF] transition-all rounded-xl overflow-hidden"
        style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)' }}
      >
        {/* Header */}
        <div
          className="cursor-pointer hover:bg-[#3D4058] transition-all p-4"
          onClick={onToggle}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5B7FFF] flex items-center justify-center">
                <GripVertical className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-white text-xl font-outfit font-black">
                  רוטינה {routine.letter}
                </h3>
                <p className="text-[#9CA3AF] text-sm font-outfit">{routine.name}</p>
              </div>
              {sortedExercises.length > 0 && (
                <div className="bg-[#5B7FFF]/20 px-3 py-1.5 rounded-lg border border-[#5B7FFF]/30">
                  <span className="text-[#5B7FFF] font-outfit font-black text-sm">{sortedExercises.length}</span>
                  <span className="text-[#9CA3AF] text-xs mr-1 font-outfit">תרגילים</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onDeleteRoutine && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("⚠️ האם אתה בטוח שברצונך למחוק רוטינה זו?")) {
                      onDeleteRoutine();
                    }
                  }}
                  className="w-10 h-10 rounded-xl bg-[#EF4444]/20 hover:bg-[#EF4444] border border-[#EF4444]/30 hover:border-[#EF4444] flex items-center justify-center transition-all group"
                >
                  <Trash2 className="h-5 w-5 text-[#EF4444] group-hover:text-white transition-colors" />
                </button>
              )}
              <div className="w-10 h-10 rounded-xl bg-[#1A1D2E] border-2 border-[#3D4058] flex items-center justify-center">
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-white" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-white" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="border-t-2 border-[#3D4058] p-4 space-y-4 bg-[#1A1D2E] expand-animation">
            {sortedExercises.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#2D3142] border-2 border-[#3D4058] flex items-center justify-center">
                  <Plus className="h-8 w-8 text-[#9CA3AF]" />
                </div>
                <p className="text-[#9CA3AF] font-outfit font-semibold">אין תרגילים ברוטינה זו</p>
                <p className="text-[#9CA3AF] text-sm font-outfit">לחץ על "הוסף תרגיל" כדי להתחיל</p>
              </div>
            ) : (
              sortedExercises.map((re, index) => (
                <RoutineExerciseItem
                  key={re.id}
                  exercise={re as RoutineExercise & { exercise?: { id: string; name: string; image_url: string | null } }}
                  index={index}
                  onUpdate={onUpdateExercise}
                  onDelete={onDeleteExercise}
                  onUpdateImage={onUpdateExerciseImage}
                />
              ))
            )}
            <button
              onClick={onAddExercise}
              className="w-full bg-gradient-to-br from-[#5B7FFF] to-[#4A5FCC] hover:from-[#6B8EFF] hover:to-[#5A6FDD] text-white py-3 rounded-xl font-outfit font-bold text-sm transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
              style={{ boxShadow: '0 4px 16px rgba(91, 127, 255, 0.4)' }}
            >
              <Plus className="h-5 w-5" />
              הוסף תרגיל לרוטינה
            </button>
          </div>
        )}
      </div>
    </>
  );
}