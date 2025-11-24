"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Plus, X, Trophy } from "lucide-react";

interface SetData {
  setNumber: number;
  weight: string;
  reps: string;
  rir: string;
}

interface Exercise {
  id: string;
  name: string;
  specialInstructions: string;
  targetSets: number;
  targetReps: string;
  restTime: number;
  exerciseId: string;
  rirTarget: number;
  previousPerformance?: { weight: number; reps: number }[];
  videoUrl?: string;
  imageUrl?: string;
  muscleGroup?: string;
}

interface ActiveExerciseCardProps {
  exercise: Exercise;
  index: number;
  sets: SetData[];
  onUpdateSet: (exerciseId: string, setIndex: number, field: keyof SetData, value: string) => void;
  onAddSet: (exerciseId: string) => void;
  onRemoveSet: (exerciseId: string, setIndex: number) => void;
  onShowInstructions?: () => void;
}

export function ActiveExerciseCard({
  exercise,
  index,
  sets,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onShowInstructions,
}: ActiveExerciseCardProps) {
  const [expandedSets, setExpandedSets] = useState<Record<number, boolean>>({ 0: true });

  const toggleSet = (setIndex: number) => {
    setExpandedSets(prev => ({
      ...prev,
      [setIndex]: !prev[setIndex]
    }));
  };

  return (
    <div className="space-y-4">
      {/* Exercise Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <span className="bg-primary/20 text-primary text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center">
            {index + 1}
          </span>
          {exercise.name}
        </h2>
        {exercise.specialInstructions && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary h-8 px-2" 
            onClick={onShowInstructions}
          >
            <Info className="h-4 w-4 ml-1" />
            הוראות
          </Button>
        )}
      </div>

      {/* Video/Image */}
      <div className="relative w-full aspect-video bg-black/50 rounded-xl border border-border overflow-hidden shadow-sm">
        {exercise.videoUrl ? (
          <video
            src={exercise.videoUrl}
            className="w-full h-full object-cover"
            controls
            playsInline
          />
        ) : exercise.imageUrl ? (
          <img
            src={exercise.imageUrl}
            alt={exercise.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-muted-foreground/70 text-sm">אין מדיה זמינה</p>
            </div>
          </div>
        )}
      </div>

      {/* Sets */}
      <div className="space-y-3">
        {sets.map((set, setIndex) => (
          <Card 
            key={setIndex} 
            className="bg-card border-border shadow-md overflow-hidden"
          >
            <div className="bg-accent/30 p-3 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  סט {set.setNumber}
                </span>
                {setIndex === 0 && (
                  <span className="text-xs text-muted-foreground">
                    (מטרה: {exercise.targetSets} סטים • {exercise.targetReps} חזרות)
                  </span>
                )}
              </div>
              {sets.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveSet(exercise.id, setIndex)}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <CardContent className="p-4 space-y-6">
              {/* Weight and Reps */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground block text-center">
                    חזרות
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={set.reps}
                      onChange={(e) => onUpdateSet(exercise.id, setIndex, "reps", e.target.value)}
                      placeholder={
                        setIndex === 0 && exercise.previousPerformance?.[0]?.reps.toString() || 
                        sets[setIndex - 1]?.reps || 
                        "10"
                      }
                      className="bg-background/50 border-input text-foreground text-center text-2xl font-bold h-16 rounded-xl focus:ring-primary/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground block text-center">
                    משקל (ק"ג)
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.5"
                      inputMode="decimal"
                      value={set.weight}
                      onChange={(e) => onUpdateSet(exercise.id, setIndex, "weight", e.target.value)}
                      placeholder={
                        setIndex === 0 && exercise.previousPerformance?.[0]?.weight.toString() || 
                        sets[setIndex - 1]?.weight || 
                        "80"
                      }
                      className="bg-background/50 border-input text-foreground text-center text-2xl font-bold h-16 rounded-xl focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>

              {/* RIR Slider */}
              <div className="bg-background/30 p-4 rounded-xl border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-muted-foreground">
                    קרבה לכשל (RIR):
                  </label>
                  <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-lg font-bold min-w-[3rem] text-center">
                    {set.rir}
                  </div>
                </div>
                <div className="px-2">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={set.rir}
                    onChange={(e) => onUpdateSet(exercise.id, setIndex, "rir", e.target.value)}
                    className="w-full h-3 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    style={{
                      background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(parseFloat(set.rir) / 5) * 100}%, hsl(var(--secondary)) ${(parseFloat(set.rir) / 5) * 100}%, hsl(var(--secondary)) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2 font-medium">
                    <span>0 (כשל)</span>
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5 (קל)</span>
                  </div>
                </div>
              </div>

              {/* Previous Best - Only show on first set */}
              {setIndex === 0 && exercise.previousPerformance?.[0] && (
                <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20 flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <p className="text-sm text-blue-100">
                    שיא אישי: <span className="font-bold">{exercise.previousPerformance[0].weight} ק"ג</span> ל-<span className="font-bold">{exercise.previousPerformance[0].reps} חזרות</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Add Set Button */}
        {sets.length < exercise.targetSets && (
          <Button
            variant="outline"
            onClick={() => onAddSet(exercise.id)}
            className="w-full border-dashed border-2 border-primary/50 text-primary hover:bg-primary/10 h-12"
          >
            <Plus className="h-5 w-5 ml-2" />
            הוסף סט ({sets.length}/{exercise.targetSets})
          </Button>
        )}
      </div>
    </div>
  );
}

