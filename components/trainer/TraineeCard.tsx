"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Calendar, Mail, Dumbbell, TrendingUp, Eye, Target, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 hover:shadow-md transition-all rounded-2xl group">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
            {/* Enhanced Avatar */}
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xl sm:text-3xl border-2 border-blue-200 dark:border-blue-800 shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
              {trainee.name.charAt(0)}
            </div>
            
            <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
              {/* Name */}
              <h3 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white truncate">{trainee.name}</h3>
              
              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Email */}
                <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                  <div className="bg-blue-500/20 p-1 sm:p-1.5 rounded-lg flex-shrink-0">
                    <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500" />
                  </div>
                  <span className="text-gray-500 dark:text-slate-400 font-medium truncate">{trainee.email}</span>
                </div>
                
                {/* Join Date */}
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-1 sm:p-1.5 rounded-lg flex-shrink-0">
                    <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap">הצטרף: {formatJoinDate(trainee.created_at)}</span>
                </div>
                
                {/* Active Plan */}
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <div className={`${trainee.planActive ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-slate-800'} p-1 sm:p-1.5 rounded-lg flex-shrink-0`}>
                    <Dumbbell className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${trainee.planActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-slate-400'}`} />
                  </div>
                  <span className={`font-bold ${trainee.planActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-slate-400'} truncate`}>
                    {trainee.planName || "אין תוכנית"}
                  </span>
                </div>
                
                {/* Last Workout */}
                {trainee.lastWorkout && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-1 sm:p-1.5 rounded-lg flex-shrink-0">
                      <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap">אימון אחרון: {formatJoinDate(trainee.lastWorkout)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
            <Link href={`/trainer/workout-plans/${trainee.id}/edit`} className="flex-1 sm:flex-none">
              <Button className={cn(
                "w-full sm:w-auto h-10 sm:h-11 px-4 sm:px-5 text-white font-bold rounded-lg sm:rounded-xl shadow-sm transition-all active:scale-95 text-sm sm:text-base",
                trainee.planActive 
                  ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  : "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
              )}>
                {trainee.planActive ? (
                  <>
                    <Edit className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">ערוך תוכנית</span>
                    <span className="sm:hidden">ערוך</span>
                  </>
                ) : (
                  <>
                    <Target className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">צור תוכנית</span>
                    <span className="sm:hidden">צור</span>
                  </>
                )}
              </Button>
            </Link>
            <Link href={`/trainer/trainee/${trainee.id}`} className="flex-1 sm:flex-none">
              <Button className="w-full sm:w-auto h-10 sm:h-11 px-4 sm:px-5 bg-white dark:bg-slate-900/50 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-900 dark:text-white font-bold rounded-lg sm:rounded-xl border border-gray-200 dark:border-slate-800 hover:border-blue-600 dark:hover:border-blue-500 transition-all active:scale-95 text-sm sm:text-base">
                <Settings className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">ניהול מתאמן</span>
                <span className="sm:hidden">ניהול</span>
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

