"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Loader2, Plus, X, CheckCircle2, Calendar, TrendingUp,
  Home, BarChart3, Users, Target, Settings, Image as ImageIcon, Apple, Dumbbell
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { getWorkoutLogs, getBodyWeightHistory, saveBodyWeight } from "@/lib/db";
import type { WorkoutLogWithDetails } from "@/lib/types";

// Calculate 1RM using Brzycki formula
function calculate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight / (1.0278 - 0.0278 * reps);
}

function ProgressTrackingContent() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [weightHistory, setWeightHistory] = useState<Array<{ date: string; weight: number }>>([]);
  const [benchPressHistory, setBenchPressHistory] = useState<Array<{ date: string; oneRM: number }>>([]);
  const [timeFilter, setTimeFilter] = useState<"month" | "3months" | "6months" | "year">("month");
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [bodyWeight, setBodyWeight] = useState("");
  const [weightError, setWeightError] = useState<string | null>(null);
  const [savingWeight, setSavingWeight] = useState(false);
  const [progressPhotos, setProgressPhotos] = useState<Array<{ id: string; date: string; url: string }>>([]);

  useEffect(() => {
    if (user?.id) {
      loadProgressData();
    }
  }, [user?.id]);

  const loadProgressData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Load weight history
      const weights = await getBodyWeightHistory(user.id);
      setWeightHistory(weights);

      // Load workout logs to calculate bench press 1RM
      const logs = await getWorkoutLogs(user.id);
      
      // Find bench press exercises (search for variations)
      const benchPressNames = ['לחיצת חזה', 'bench press', 'לחיצה בחזה', 'חזה', 'chest press'];
      const benchPressData: Array<{ date: string; oneRM: number }> = [];
      
      logs.forEach(log => {
        log.set_logs?.forEach(setLog => {
          const exerciseName = setLog.exercise?.name?.toLowerCase() || '';
          const muscleGroup = setLog.exercise?.muscle_group?.toLowerCase() || '';
          const isBenchPress = benchPressNames.some(name => 
            exerciseName.includes(name.toLowerCase())
          ) || muscleGroup.includes('חזה') || muscleGroup.includes('chest');
          
          if (isBenchPress && setLog.weight_kg && setLog.reps) {
            const oneRM = calculate1RM(setLog.weight_kg, setLog.reps);
            benchPressData.push({
              date: log.date,
              oneRM: oneRM
            });
          }
        });
      });

      // Group by date and take max 1RM for each date
      const groupedByDate = new Map<string, number>();
      benchPressData.forEach(item => {
        const existing = groupedByDate.get(item.date);
        if (!existing || item.oneRM > existing) {
          groupedByDate.set(item.date, item.oneRM);
        }
      });

      const sortedBenchPress = Array.from(groupedByDate.entries())
        .map(([date, oneRM]) => ({ date, oneRM }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setBenchPressHistory(sortedBenchPress);

      // TODO: Load progress photos from storage
      // For now, using mock data
      setProgressPhotos([]);

    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightSubmit = async () => {
    if (!user?.id || !bodyWeight) return;

    setWeightError(null);
    setSavingWeight(true);

    try {
      const weight = parseFloat(bodyWeight);
      if (isNaN(weight) || weight <= 0) {
        setWeightError('אנא הזן משקל תקין (מספר חיובי)');
        setSavingWeight(false);
        return;
      }

      if (weight > 500) {
        setWeightError('המשקל שהוזן לא סביר. אנא בדוק את הערך.');
        setSavingWeight(false);
        return;
      }

      await saveBodyWeight(user.id, weight);
      
      setShowWeightInput(false);
      setBodyWeight("");
      setWeightError(null);
      await loadProgressData();
    } catch (error: any) {
      console.error('Error saving weight:', error);
      setWeightError(error.message || 'שגיאה בשמירת המשקל');
    } finally {
      setSavingWeight(false);
    }
  };

  // Filter data based on time filter
  const getFilteredWeightData = () => {
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (timeFilter) {
      case "month":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "3months":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case "6months":
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case "year":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return weightHistory
      .filter(item => new Date(item.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getFilteredBenchPressData = () => {
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (timeFilter) {
      case "month":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "3months":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case "6months":
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case "year":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return benchPressHistory
      .filter(item => new Date(item.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Line Chart Component
  const LineChart = ({ 
    data, 
    currentValue, 
    unit = "kg",
    height = 180 
  }: { 
    data: Array<{ date: string; value: number }>;
    currentValue: number | null;
    unit?: string;
    height?: number;
  }) => {
    if (data.length === 0) {
      return (
        <div className="h-[180px] flex items-center justify-center text-gray-500">
          אין נתונים להצגה
        </div>
      );
    }

    const padding = 50;
    const chartWidth = 350;
    const chartHeight = height;
    const graphWidth = chartWidth - padding * 2;
    const graphHeight = chartHeight - padding * 2;

    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    // Generate Y-axis labels
    const yLabels = [];
    const steps = 3;
    for (let i = 0; i <= steps; i++) {
      const value = minValue + (range * i / steps);
      yLabels.push(value);
    }

    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1 || 1)) * graphWidth;
      const y = padding + graphHeight - ((d.value - minValue) / range) * graphHeight;
      return { x, y, value: d.value, date: d.date };
    });

    const path = points
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
      .join(" ");

    return (
      <div className="w-full overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="w-full">
          {/* Grid lines and Y-axis labels */}
          {yLabels.map((value, idx) => {
            const ratio = (value - minValue) / range;
            const y = padding + graphHeight - (ratio * graphHeight);
            return (
              <g key={idx}>
                <line
                  x1={padding}
                  y1={y}
                  x2={padding + graphWidth}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                />
                <text 
                  x={padding - 10} 
                  y={y + 4} 
                  fontSize="11" 
                  textAnchor="end" 
                  fill="#64748b"
                >
                  {value.toFixed(unit === "kg" ? 1 : 0)}{unit}
                </text>
              </g>
            );
          })}

          {/* Data line */}
          <path
            d={path}
            fill="none"
            stroke="#00ff88"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, i) => (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#00ff88"
                stroke="#0f1a2a"
                strokeWidth="2"
              />
            </g>
          ))}
        </svg>
      </div>
    );
  };

  const filteredWeightData = getFilteredWeightData();
  const filteredBenchPressData = getFilteredBenchPressData();
  const currentWeight = weightHistory.length > 0 ? weightHistory[0].weight : null;
  const currentBenchPress = benchPressHistory.length > 0 
    ? benchPressHistory[benchPressHistory.length - 1].oneRM 
    : null;

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case "month": return "חודש אחרון";
      case "3months": return "3 חודשים";
      case "6months": return "6 חודשים";
      case "year": return "שנה";
      default: return "חודש אחרון";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1a2a] flex items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-[#00ff88]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1a2a] pb-20" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0f1a2a] border-b border-gray-800 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/trainee/dashboard">
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-white flex-1">מעקב התקדמות</h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Body Weight Section */}
        <Card className="bg-[#1a2332] border-gray-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-white">משקל גוף</CardTitle>
              <div className="flex items-center gap-2">
                {currentWeight && (
                  <span className="text-lg font-bold text-[#00ff88]">
                    {currentWeight.toFixed(1)}kg
                  </span>
                )}
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as any)}
                  className="bg-[#0f1a2a] border border-gray-700 text-white text-sm rounded px-2 py-1"
                >
                  <option value="month">חודש אחרון</option>
                  <option value="3months">3 חודשים</option>
                  <option value="6months">6 חודשים</option>
                  <option value="year">שנה</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <LineChart
              data={filteredWeightData.map(item => ({ date: item.date, value: item.weight }))}
              currentValue={currentWeight}
              unit="kg"
            />
            <Button
              onClick={() => setShowWeightInput(true)}
              className="w-full mt-4 bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
            >
              <Plus className="h-4 w-4 ml-2" />
              הוסף שקילה
            </Button>
          </CardContent>
        </Card>

        {/* Bench Press 1RM Section */}
        <Card className="bg-[#1a2332] border-gray-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-white">כוח - לחיצת חזה (1RM)</CardTitle>
              {currentBenchPress && (
                <span className="text-lg font-bold text-[#00ff88]">
                  {currentBenchPress.toFixed(1)}kg
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <LineChart
              data={filteredBenchPressData.map(item => ({ date: item.date, value: item.oneRM }))}
              currentValue={currentBenchPress}
              unit="kg"
            />
            <Button
              variant="outline"
              className="w-full mt-4 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              היסטוריית ביצועים
            </Button>
          </CardContent>
        </Card>

        {/* Progress Photos Section */}
        <Card className="bg-[#1a2332] border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">תמונות התקדמות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {progressPhotos.length === 0 ? (
                <>
                  <div className="flex-1 aspect-[3/4] bg-[#0f1a2a] border border-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                      <span className="text-xs text-gray-500">אין תמונות</span>
                    </div>
                  </div>
                  <div className="flex-1 aspect-[3/4] bg-[#0f1a2a] border border-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                      <span className="text-xs text-gray-500">אין תמונות</span>
                    </div>
                  </div>
                  <div className="flex-1 aspect-[3/4] bg-[#0f1a2a] border border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#00ff88] transition-colors">
                    <Plus className="h-6 w-6 text-gray-500 mb-1" />
                    <span className="text-xs text-gray-500">הוסף תמונה</span>
                  </div>
                </>
              ) : (
                <>
                  {progressPhotos.slice(0, 2).map((photo) => (
                    <div key={photo.id} className="flex-1 aspect-[3/4] bg-[#0f1a2a] border border-gray-700 rounded-lg overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-gray-600" />
                      </div>
                      <div className="p-2 text-xs text-gray-400">
                        {new Date(photo.date).toLocaleDateString('he-IL')}
                      </div>
                    </div>
                  ))}
                  <div className="flex-1 aspect-[3/4] bg-[#0f1a2a] border border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#00ff88] transition-colors">
                    <Plus className="h-6 w-6 text-gray-500 mb-1" />
                    <span className="text-xs text-gray-500">הוסף תמונה</span>
                  </div>
                </>
              )}
            </div>
            <Button
              className="w-full mt-4 bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
            >
              <Plus className="h-4 w-4 ml-2" />
              הוסף תמונה
            </Button>
          </CardContent>
        </Card>

        {/* Weight Input Modal */}
        {showWeightInput && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <Card className="bg-[#1a2332] border-gray-800 w-full max-w-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">הוסף שקילה</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowWeightInput(false);
                      setBodyWeight("");
                      setWeightError(null);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {weightError && (
                  <div className="p-3 bg-red-900/30 border border-red-800 rounded-md text-red-300 text-sm">
                    {weightError}
                  </div>
                )}
                <Input
                  type="number"
                  step="0.1"
                  value={bodyWeight}
                  onChange={(e) => {
                    setBodyWeight(e.target.value);
                    setWeightError(null);
                  }}
                  placeholder="הזן משקל (ק״ג)"
                  className="w-full px-4 py-4 text-2xl font-bold bg-[#0f1a2a] border-gray-700 text-white text-center"
                  autoFocus
                  disabled={savingWeight}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleWeightSubmit}
                    className="flex-1 bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
                    disabled={!bodyWeight || savingWeight}
                  >
                    {savingWeight ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        שומר...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 ml-2" />
                        שמור
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowWeightInput(false);
                      setBodyWeight("");
                      setWeightError(null);
                    }}
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                    disabled={savingWeight}
                  >
                    ביטול
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a2332] border-t border-gray-800 px-4 py-2 pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <Link href="/trainee/dashboard" className="flex flex-col items-center gap-1 py-2 px-4">
            <Home className={`h-5 w-5 ${pathname === '/trainee/dashboard' ? 'text-[#00ff88]' : 'text-gray-500'}`} />
            <span className={`text-xs ${pathname === '/trainee/dashboard' ? 'text-[#00ff88]' : 'text-gray-500'}`}>בית</span>
          </Link>
          <Link href="/trainee/history" className="flex flex-col items-center gap-1 py-2 px-4">
            <BarChart3 className={`h-5 w-5 ${pathname === '/trainee/history' ? 'text-[#00ff88]' : 'text-gray-500'}`} />
            <span className={`text-xs ${pathname === '/trainee/history' ? 'text-[#00ff88]' : 'text-gray-500'}`}>התקדמות</span>
          </Link>
          <Link href="/trainee/nutrition" className="flex flex-col items-center gap-1 py-2 px-4">
            <Apple className={`h-5 w-5 ${pathname === '/trainee/nutrition' ? 'text-[#00ff88]' : 'text-gray-500'}`} />
            <span className={`text-xs ${pathname === '/trainee/nutrition' ? 'text-[#00ff88]' : 'text-gray-500'}`}>תזונה</span>
          </Link>
          <Link href="/trainee/workout" className="flex flex-col items-center gap-1 py-2 px-4">
            <Dumbbell className={`h-5 w-5 ${pathname?.startsWith('/trainee/workout') ? 'text-[#00ff88]' : 'text-gray-500'}`} />
            <span className={`text-xs ${pathname?.startsWith('/trainee/workout') ? 'text-[#00ff88]' : 'text-gray-500'}`}>אימון</span>
          </Link>
          <Link href="/trainee/settings" className="flex flex-col items-center gap-1 py-2 px-4">
            <Settings className={`h-5 w-5 ${pathname === '/trainee/settings' ? 'text-[#00ff88]' : 'text-gray-500'}`} />
            <span className={`text-xs ${pathname === '/trainee/settings' ? 'text-[#00ff88]' : 'text-gray-500'}`}>הגדרות</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ProgressTrackingPage() {
  return (
    <ProtectedRoute requiredRole="trainee">
      <ProgressTrackingContent />
    </ProtectedRoute>
  );
}
