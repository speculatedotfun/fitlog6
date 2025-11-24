"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Plus, Search, Edit, Trash2, Loader2, PieChart
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getTrainerTrainees, getActiveWorkoutPlan, getNutritionMenu } from "@/lib/db";
import type { User, NutritionMenu } from "@/lib/types";

interface NutritionPlanCard {
  id: string;
  traineeId: string;
  traineeName: string;
  planName: string;
  calorieTarget: number;
  protein: number;
  carbs: number;
  fat: number;
}

function NutritionPlansContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlanCard[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<NutritionPlanCard[]>([]);

  const trainerId = user?.id || "";

  useEffect(() => {
    if (trainerId) {
      loadNutritionPlans();
    }
  }, [trainerId]);

  useEffect(() => {
    filterPlans();
  }, [searchQuery, nutritionPlans]);

  const loadNutritionPlans = async () => {
    try {
      setLoading(true);
      
      // Get all trainees
      const trainees = await getTrainerTrainees(trainerId);
      
      // Get nutrition plans for each trainee
      const plans: NutritionPlanCard[] = [];
      
      for (const trainee of trainees) {
        const workoutPlan = await getActiveWorkoutPlan(trainee.id);
        if (workoutPlan) {
          const nutritionMenu = await getNutritionMenu(trainee.id);
          
          if (nutritionMenu) {
            // Calculate macros from nutrition menu
            let totalCalories = 0;
            let totalProtein = 0;
            let totalCarbs = 0;
            let totalFat = 0;
            
            nutritionMenu.meals.forEach(meal => {
              meal.foods.forEach(food => {
                // Mock calculation - you'll need to implement real food database
                const amount = parseFloat(food.amount) || 0;
                // These are placeholder values - replace with real food database
                totalProtein += amount * 0.2; // 20g protein per 100g
                totalCarbs += amount * 0.5; // 50g carbs per 100g
                totalFat += amount * 0.1; // 10g fat per 100g
              });
            });
            
            // Calculate calories (4 cal/g protein, 4 cal/g carbs, 9 cal/g fat)
            totalCalories = (totalProtein * 4) + (totalCarbs * 4) + (totalFat * 9);
            
            // Calculate percentages
            const proteinPercent = totalCalories > 0 ? Math.round((totalProtein * 4 / totalCalories) * 100) : 30;
            const carbsPercent = totalCalories > 0 ? Math.round((totalCarbs * 4 / totalCalories) * 100) : 40;
            const fatPercent = totalCalories > 0 ? Math.round((totalFat * 9 / totalCalories) * 100) : 30;
            
            plans.push({
              id: workoutPlan.id,
              traineeId: trainee.id,
              traineeName: trainee.name,
              planName: `${workoutPlan.name} - ${trainee.name}`,
              calorieTarget: Math.round(totalCalories) || 2500,
              protein: proteinPercent,
              carbs: carbsPercent,
              fat: fatPercent,
            });
          }
        }
      }
      
      setNutritionPlans(plans);
    } catch (error: any) {
      console.error("Error loading nutrition plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterPlans = () => {
    if (!searchQuery.trim()) {
      setFilteredPlans(nutritionPlans);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = nutritionPlans.filter(plan =>
      plan.traineeName.toLowerCase().includes(query) ||
      plan.planName.toLowerCase().includes(query)
    );
    setFilteredPlans(filtered);
  };

  // Pie Chart Component
  const PieChartComponent = ({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) => {
    const size = 120;
    const radius = size / 2 - 10;
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Normalize percentages to ensure they sum to 100
    const total = protein + carbs + fat;
    const normalizedProtein = total > 0 ? (protein / total) * 100 : 30;
    const normalizedCarbs = total > 0 ? (carbs / total) * 100 : 40;
    const normalizedFat = total > 0 ? (fat / total) * 100 : 30;
    
    // Convert percentages to angles
    const proteinAngle = (normalizedProtein / 100) * 360;
    const carbsAngle = (normalizedCarbs / 100) * 360;
    const fatAngle = (normalizedFat / 100) * 360;
    
    // Calculate start and end angles for each segment
    let currentAngle = -90; // Start from top
    
    const proteinStart = currentAngle;
    const proteinEnd = currentAngle + proteinAngle;
    currentAngle += proteinAngle;
    
    const carbsStart = currentAngle;
    const carbsEnd = currentAngle + carbsAngle;
    currentAngle += carbsAngle;
    
    const fatStart = currentAngle;
    const fatEnd = currentAngle + fatAngle;
    
    // Helper function to create arc path
    const createArc = (startAngle: number, endAngle: number) => {
      if (endAngle - startAngle >= 360) {
        // Full circle
        return `M ${centerX} ${centerY} m -${radius} 0 a ${radius} ${radius} 0 1 1 ${radius * 2} 0 a ${radius} ${radius} 0 1 1 -${radius * 2} 0`;
      }
      const start = (startAngle * Math.PI) / 180;
      const end = (endAngle * Math.PI) / 180;
      const x1 = centerX + radius * Math.cos(start);
      const y1 = centerY + radius * Math.sin(start);
      const x2 = centerX + radius * Math.cos(end);
      const y2 = centerY + radius * Math.sin(end);
      const largeArc = endAngle - startAngle > 180 ? 1 : 0;
      return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    };
    
    return (
      <svg width={size} height={size} className="flex-shrink-0">
        {proteinAngle > 0 && (
          <path
            d={createArc(proteinStart, proteinEnd)}
            fill="#00ff88"
          />
        )}
        {carbsAngle > 0 && (
          <path
            d={createArc(carbsStart, carbsEnd)}
            fill="#ffa500"
          />
        )}
        {fatAngle > 0 && (
          <path
            d={createArc(fatStart, fatEnd)}
            fill="#ff6b6b"
          />
        )}
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-[#00ff88]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] p-4 lg:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">ניהול תוכניות תזונה</h1>
            <h2 className="text-xl text-gray-400">מאגר תזונה</h2>
          </div>
          <Link href="/trainer/nutrition-plans/new">
            <Button className="bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold">
              <Plus className="h-4 w-4 ml-2" />
              צור תוכנית תזונה חדשה
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חפש..."
            className="bg-[#1a2332] border-gray-700 text-white pr-10"
          />
        </div>

        {/* Nutrition Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlans.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400 text-lg">
                {searchQuery ? "לא נמצאו תוכניות תזונה" : "אין תוכניות תזונה עדיין"}
              </p>
            </div>
          ) : (
            filteredPlans.map((plan) => (
              <Card key={plan.id} className="bg-[#1a2332] border-gray-800 hover:border-[#00ff88]/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-white text-lg">{plan.planName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Calorie Target */}
                  <div>
                    <p className="text-sm text-gray-400 mb-1">יעד קלורי:</p>
                    <p className="text-xl font-bold text-white">{plan.calorieTarget} קק"ל</p>
                  </div>

                  {/* Pie Chart and Macros */}
                  <div className="flex items-center gap-4">
                    <PieChartComponent 
                      protein={plan.protein} 
                      carbs={plan.carbs} 
                      fat={plan.fat} 
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-[#00ff88]"></div>
                        <span className="text-sm text-white">חלבון: {plan.protein}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-[#ffa500]"></div>
                        <span className="text-sm text-white">פחמימות: {plan.carbs}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-[#ff6b6b]"></div>
                        <span className="text-sm text-white">שומן: {plan.fat}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/trainer/nutrition-plans/${plan.traineeId}/edit`} className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        <Edit className="h-4 w-4 ml-2" />
                        ערוך
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="border-red-700 text-red-400 hover:bg-red-900/20"
                      onClick={() => {
                        if (confirm("האם אתה בטוח שברצונך למחוק תוכנית תזונה זו?")) {
                          // TODO: Delete nutrition plan
                          alert("מחיקת תוכנית תזונה - יושם בהמשך");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      מחק
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function NutritionPlansPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <NutritionPlansContent />
    </ProtectedRoute>
  );
}

