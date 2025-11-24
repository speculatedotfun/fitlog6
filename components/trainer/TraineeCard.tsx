"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

interface TraineeCardProps {
  trainee: {
    id: string;
    name: string;
    email: string;
    created_at: string;
    planActive: boolean;
    planName: string | null;
    lastWorkout: string | null;
  };
}

export function TraineeCard({ trainee }: TraineeCardProps) {
  const formatJoinDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <Card className="bg-[#0f1a2a] border-gray-800 hover:border-[#00ff88]/50 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-16 h-16 rounded-full bg-[#00ff88] flex items-center justify-center text-black font-bold text-xl">
              {trainee.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">{trainee.name}</h3>
              <div className="space-y-1 text-sm text-gray-400">
                <p>{trainee.email}</p>
                <p>הצטרף: {formatJoinDate(trainee.created_at)}</p>
                <p className={trainee.planActive ? "text-green-400" : "text-gray-500"}>
                  תוכנית פעילה: {trainee.planName || "אין תוכנית"}
                </p>
                {trainee.lastWorkout && (
                  <p className="text-gray-500">
                    אימון אחרון: {formatJoinDate(trainee.lastWorkout)}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {trainee.planActive && (
              <Link href={`/trainer/workout-plans/${trainee.id}/edit`}>
                <Button className="bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold whitespace-nowrap">
                  צפה בתוכנית
                </Button>
              </Link>
            )}
            <Link href={`/trainer/trainee/${trainee.id}`}>
              <Button className="bg-[#1a2332] border border-gray-700 text-gray-300 hover:bg-gray-800 font-semibold whitespace-nowrap">
                <Settings className="ml-2 h-4 w-4" />
                ניהול מתאמן
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

