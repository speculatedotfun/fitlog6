"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import type { WorkoutPlan, RoutineWithExercises } from "@/lib/types";

interface DailyWorkoutCardProps {
  workoutPlan: WorkoutPlan | null;
  currentRoutine: RoutineWithExercises | null;
}

export function DailyWorkoutCard({ workoutPlan, currentRoutine }: DailyWorkoutCardProps) {
  return (
    <Card className="bg-card border-border shadow-md">
      <CardHeader>
        <CardTitle className="text-foreground text-lg">האימון של היום:</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {workoutPlan && currentRoutine ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{workoutPlan.name} {currentRoutine.letter}</p>
                <p className="text-sm text-muted-foreground mt-1">{currentRoutine.name}</p>
              </div>
              <div className="flex items-center gap-2 text-primary">
                <Clock className="h-5 w-5" />
                <span className="text-lg font-semibold">08:30</span>
              </div>
            </div>
            <Link href="/trainee/workout">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 text-lg shadow-sm">
                התחל אימון
              </Button>
            </Link>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">אין תוכנית אימונים פעילה</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

