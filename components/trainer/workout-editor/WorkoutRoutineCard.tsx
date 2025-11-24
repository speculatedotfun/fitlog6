"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Plus, GripVertical } from "lucide-react";
import { RoutineExerciseItem } from "./RoutineExerciseItem";
import type { RoutineWithExercises, RoutineExercise } from "@/lib/types";

interface WorkoutRoutineCardProps {
  routine: RoutineWithExercises;
  isExpanded: boolean;
  onToggle: () => void;
  onAddExercise: () => void;
  onUpdateExercise: (exerciseId: string, data: any) => Promise<void>;
  onDeleteExercise: (exerciseId: string) => Promise<void>;
  onUpdateExerciseImage?: (exerciseId: string, imageUrl: string) => Promise<void>;
}

export function WorkoutRoutineCard({
  routine,
  isExpanded,
  onToggle,
  onAddExercise,
  onUpdateExercise,
  onDeleteExercise,
  onUpdateExerciseImage,
}: WorkoutRoutineCardProps) {
  const sortedExercises = [...routine.routine_exercises].sort(
    (a, b) => a.order_index - b.order_index
  );

  return (
    <Card className="bg-[#1a2332] border-gray-800">
      <CardHeader
        className="cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">
            רוטינה {routine.letter}: {routine.name}
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          {sortedExercises.map((re, index) => (
            <RoutineExerciseItem
              key={re.id}
              exercise={re as RoutineExercise & { exercise?: { id: string; name: string; image_url: string | null } }}
              index={index}
              onUpdate={onUpdateExercise}
              onDelete={onDeleteExercise}
              onUpdateImage={onUpdateExerciseImage}
            />
          ))}
          <Button
            onClick={onAddExercise}
            className="w-full bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
          >
            <Plus className="h-4 w-4 ml-2" />
            הוסף תרגיל
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

