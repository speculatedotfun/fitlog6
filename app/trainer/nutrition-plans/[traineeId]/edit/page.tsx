"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Save, Plus, X, Loader2, Apple, Trash2, Edit, Search, History
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { 
  getActiveWorkoutPlan, 
  getNutritionMenu, 
  updateWorkoutPlan, 
  getFoodHistory, 
  type FoodHistoryItem 
} from "@/lib/db";
import { supabase } from "@/lib/supabase";
import type { NutritionMenu } from "@/lib/types";

function EditNutritionPlanContent() {
  const params = useParams();
  const router = useRouter();
  const traineeId = params.traineeId as string;
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planName, setPlanName] = useState("");
  const [calorieTarget, setCalorieTarget] = useState(2500);
  const [proteinPercent, setProteinPercent] = useState(30);
  const [carbsPercent, setCarbsPercent] = useState(40);
  const [fatPercent, setFatPercent] = useState(30);
  
  const [meals, setMeals] = useState<Array<{
    id: string;
    mealName: string;
    foods: Array<{
      id: string;
      foodName: string;
      amount: string;
    }>;
  }>>([]);
  
  const [editingMealName, setEditingMealName] = useState<Record<string, string>>({});
  const [foodHistory, setFoodHistory] = useState<FoodHistoryItem[]>([]);
  const [loadingFoodHistory, setLoadingFoodHistory] = useState(false);
  const [showFoodHistory, setShowFoodHistory] = useState(false);
  const [selectedMealForFood, setSelectedMealForFood] = useState<string | null>(null);
  const [foodSearchQuery, setFoodSearchQuery] = useState("");
  const [workoutPlanId, setWorkoutPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (traineeId && user?.id) {
      loadNutritionPlan();
      loadFoodHistory();
    }
  }, [traineeId, user?.id]);

  useEffect(() => {
    // Ensure percentages sum to 100
    const total = proteinPercent + carbsPercent + fatPercent;
    if (total !== 100) {
      const diff = 100 - total;
      setFatPercent(prev => prev + diff);
    }
  }, [proteinPercent, carbsPercent]);

  const loadNutritionPlan = async () => {
    try {
      setLoading(true);
      
      const workoutPlan = await getActiveWorkoutPlan(traineeId);
      if (!workoutPlan) {
        alert("לא נמצאה תוכנית תזונה למתאמן זה");
        router.push("/trainer/nutrition-plans");
        return;
      }

      setWorkoutPlanId(workoutPlan.id);
      setPlanName(workoutPlan.name || "");

      const nutritionMenu = await getNutritionMenu(traineeId);
      if (nutritionMenu && nutritionMenu.meals) {
        setMeals(nutritionMenu.meals);
      } else {
        // If no menu exists, start with one empty meal
        setMeals([{ id: "1", mealName: "ארוחת בוקר", foods: [] }]);
      }
    } catch (error: any) {
      console.error("Error loading nutrition plan:", error);
      alert("שגיאה בטעינת תוכנית התזונה: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFoodHistory = async () => {
    if (!traineeId) return;
    
    try {
      setLoadingFoodHistory(true);
      const history = await getFoodHistory(traineeId);
      setFoodHistory(history);
    } catch (error: any) {
      console.error("Error loading food history:", error);
    } finally {
      setLoadingFoodHistory(false);
    }
  };

  const addFoodToMeal = (mealId: string) => {
    setMeals(prev => prev.map(meal => 
      meal.id === mealId 
        ? {
            ...meal,
            foods: [...meal.foods, {
              id: `food-${Date.now()}-${Math.random()}`,
              foodName: "",
              amount: ""
            }]
          }
        : meal
    ));
  };

  const removeFoodFromMeal = (mealId: string, foodId: string) => {
    setMeals(prev => prev.map(meal =>
      meal.id === mealId
        ? {
            ...meal,
            foods: meal.foods.filter(f => f.id !== foodId)
          }
        : meal
    ));
  };

  const updateFood = (mealId: string, foodId: string, field: "foodName" | "amount", value: string) => {
    setMeals(prev => prev.map(meal =>
      meal.id === mealId
        ? {
            ...meal,
            foods: meal.foods.map(food =>
              food.id === foodId
                ? { ...food, [field]: value }
                : food
            )
          }
        : meal
    ));
  };

  const addMeal = () => {
    setMeals(prev => [...prev, {
      id: `meal-${Date.now()}`,
      mealName: "ארוחה חדשה",
      foods: []
    }]);
  };

  const removeMeal = (mealId: string) => {
    if (meals.length <= 1) {
      alert("חייב להיות לפחות ארוחה אחת");
      return;
    }
    setMeals(prev => prev.filter(meal => meal.id !== mealId));
  };

  const updateMealName = (mealId: string, newName: string) => {
    setMeals(prev => prev.map(meal =>
      meal.id === mealId
        ? { ...meal, mealName: newName }
        : meal
    ));
    setEditingMealName(prev => {
      const updated = { ...prev };
      delete updated[mealId];
      return updated;
    });
  };

  const startEditingMealName = (mealId: string, currentName: string) => {
    setEditingMealName(prev => ({ ...prev, [mealId]: currentName }));
  };

  const addFoodFromHistory = (mealId: string, food: FoodHistoryItem) => {
    setMeals(prev => prev.map(meal => 
      meal.id === mealId 
        ? {
            ...meal,
            foods: [...meal.foods, {
              id: `food-${Date.now()}-${Math.random()}`,
              foodName: food.foodName,
              amount: food.amount || ""
            }]
          }
        : meal
    ));
    setSelectedMealForFood(null);
    setShowFoodHistory(false);
  };

  const filteredFoodHistory = foodHistory.filter(food =>
    food.foodName.toLowerCase().includes(foodSearchQuery.toLowerCase())
  );

  const handleSave = async () => {
    if (!planName.trim()) {
      alert("אנא הזן שם לתוכנית");
      return;
    }

    if (proteinPercent + carbsPercent + fatPercent !== 100) {
      alert("סכום האחוזים של המקרונוטריינטים חייב להיות 100%");
      return;
    }

    if (!workoutPlanId) {
      alert("שגיאה: לא נמצא מזהה תוכנית");
      return;
    }

    try {
      setSaving(true);

      // Update plan name
      await updateWorkoutPlan(workoutPlanId, { name: planName });

      // Create nutrition menu
      const nutritionMenu: NutritionMenu = {
        meals: meals.map(meal => ({
          id: meal.id,
          mealName: meal.mealName,
          foods: meal.foods.filter(f => f.foodName.trim() && f.amount.trim())
        }))
      };

      // Save nutrition menu
      const { error } = await supabase
        .from('workout_plans')
        .update({ nutrition_menu: nutritionMenu as any })
        .eq('id', workoutPlanId);

      if (error) {
        // If column doesn't exist, inform user to run migration
        if (error.code === '42703' || error.message?.includes('column')) {
          throw new Error('nutrition_menu column does not exist. Please run the migration to add it first.');
        }
        throw error;
      }

      // Redirect to nutrition plans page
      router.push("/trainer/nutrition-plans");
    } catch (error: any) {
      console.error("Error saving nutrition plan:", error);
      alert("שגיאה בשמירת תוכנית התזונה: " + (error.message || error.toString()));
    } finally {
      setSaving(false);
    }
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
      <div className="max-w-7xl mx-auto flex gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/trainer/nutrition-plans">
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">ערוך תוכנית תזונה</h1>
          </div>
        </div>

        {/* Basic Info Card */}
        <Card className="bg-[#1a2332] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">פרטים בסיסיים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">שם התוכנית:</label>
              <Input
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="לדוגמה: חיטוב מתקדם"
                className="bg-[#0f1a2a] border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">יעד קלורי (קק"ל):</label>
              <Input
                type="number"
                value={calorieTarget}
                onChange={(e) => setCalorieTarget(parseInt(e.target.value) || 2500)}
                className="bg-[#0f1a2a] border-gray-700 text-white"
              />
            </div>

            {/* Macronutrient Distribution */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">חלוקת מקרונוטריינטים:</label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">חלבון (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={proteinPercent}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      const remaining = 100 - value - carbsPercent;
                      setProteinPercent(value);
                      if (remaining >= 0 && remaining <= 100) {
                        setFatPercent(remaining);
                      }
                    }}
                    className="bg-[#0f1a2a] border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">פחמימות (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={carbsPercent}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      const remaining = 100 - proteinPercent - value;
                      setCarbsPercent(value);
                      if (remaining >= 0 && remaining <= 100) {
                        setFatPercent(remaining);
                      }
                    }}
                    className="bg-[#0f1a2a] border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">שומן (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={fatPercent}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      const remaining = 100 - proteinPercent - carbsPercent;
                      setFatPercent(value);
                      if (remaining >= 0 && remaining <= 100) {
                        setCarbsPercent(remaining);
                      }
                    }}
                    className="bg-[#0f1a2a] border-gray-700 text-white"
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[#00ff88]"></div>
                  <span className="text-gray-400">חלבון: {proteinPercent}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[#ffa500]"></div>
                  <span className="text-gray-400">פחמימות: {carbsPercent}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[#ff6b6b]"></div>
                  <span className="text-gray-400">שומן: {fatPercent}%</span>
                </div>
                <span className={`text-xs ${proteinPercent + carbsPercent + fatPercent === 100 ? 'text-[#00ff88]' : 'text-red-400'}`}>
                  סה"כ: {proteinPercent + carbsPercent + fatPercent}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meals Card */}
        <Card className="bg-[#1a2332] border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Apple className="h-5 w-5" />
                ארוחות ומזונות
              </CardTitle>
              <Button
                onClick={addMeal}
                className="bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
              >
                <Plus className="h-4 w-4 ml-2" />
                הוסף ארוחה
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {meals.map((meal) => (
              <div key={meal.id} className="border border-gray-800 rounded-lg p-4 bg-[#0f1a2a]">
                <div className="flex items-center justify-between mb-4">
                  {editingMealName[meal.id] !== undefined ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingMealName[meal.id]}
                        onChange={(e) => setEditingMealName(prev => ({ ...prev, [meal.id]: e.target.value }))}
                        onBlur={() => {
                          if (editingMealName[meal.id]?.trim()) {
                            updateMealName(meal.id, editingMealName[meal.id].trim());
                          } else {
                            setEditingMealName(prev => {
                              const updated = { ...prev };
                              delete updated[meal.id];
                              return updated;
                            });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editingMealName[meal.id]?.trim()) {
                              updateMealName(meal.id, editingMealName[meal.id].trim());
                            }
                          } else if (e.key === 'Escape') {
                            setEditingMealName(prev => {
                              const updated = { ...prev };
                              delete updated[meal.id];
                              return updated;
                            });
                          }
                        }}
                        autoFocus
                        className="bg-[#1a2332] border-gray-700 text-white flex-1 max-w-xs"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (editingMealName[meal.id]?.trim()) {
                            updateMealName(meal.id, editingMealName[meal.id].trim());
                          }
                        }}
                        className="bg-[#00ff88] hover:bg-[#00e677] text-black"
                      >
                        שמור
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingMealName(prev => {
                            const updated = { ...prev };
                            delete updated[meal.id];
                            return updated;
                          });
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h3 
                        className="text-lg font-semibold text-white cursor-pointer hover:text-[#00ff88] transition-colors"
                        onClick={() => startEditingMealName(meal.id, meal.mealName)}
                      >
                        {meal.mealName}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditingMealName(meal.id, meal.mealName)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {meals.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeMeal(meal.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedMealForFood(meal.id);
                              setShowFoodHistory(true);
                            }}
                            className="border-gray-700 text-gray-300 hover:bg-gray-800"
                            title="הוסף מהיסטוריה"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => addFoodToMeal(meal.id)}
                            className="bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
                          >
                            <Plus className="h-4 w-4 ml-2" />
                            הוסף מזון
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {meal.foods.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">אין מזונות בארוחה זו</p>
                ) : (
                  <div className="space-y-3">
                    {meal.foods.map((food) => (
                      <div key={food.id} className="flex items-center gap-3 p-3 bg-[#1a2332] rounded-lg border border-gray-800">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">שם המזון:</label>
                            <Input
                              value={food.foodName}
                              onChange={(e) => updateFood(meal.id, food.id, "foodName", e.target.value)}
                              placeholder="לדוגמה: חזה עוף"
                              className="bg-[#0f1a2a] border-gray-700 text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">כמות (גרם):</label>
                            <Input
                              type="number"
                              value={food.amount}
                              onChange={(e) => updateFood(meal.id, food.id, "amount", e.target.value)}
                              placeholder="200"
                              className="bg-[#0f1a2a] border-gray-700 text-white text-sm"
                            />
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFoodFromMeal(meal.id, food.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            disabled={saving || !planName.trim()}
            className="flex-1 bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 ml-2" />
                שמור שינויים
              </>
            )}
          </Button>
          <Link href="/trainer/nutrition-plans">
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              ביטול
            </Button>
          </Link>
        </div>
      </div>

      {/* Food History Sidebar */}
      <aside className={`
        ${showFoodHistory ? 'flex' : 'hidden'} lg:flex
        lg:w-80 flex-col bg-[#1a2332] border-l border-gray-800
        fixed lg:relative inset-y-0 left-0 z-30 lg:z-auto
      `}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <History className="h-5 w-5" />
            היסטוריית מזונות
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-gray-800"
            onClick={() => {
              setShowFoodHistory(false);
              setSelectedMealForFood(null);
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              value={foodSearchQuery}
              onChange={(e) => setFoodSearchQuery(e.target.value)}
              placeholder="חפש מזון..."
              className="bg-[#0f1a2a] border-gray-700 text-white pr-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loadingFoodHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#00ff88]" />
            </div>
          ) : selectedMealForFood ? (
            <div className="mb-3 p-3 bg-[#00ff88]/20 border border-[#00ff88]/50 rounded-lg">
              <p className="text-xs text-[#00ff88] font-semibold mb-1">מוסיף לארוחה:</p>
              <p className="text-sm text-white">
                {meals.find(m => m.id === selectedMealForFood)?.mealName || ''}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedMealForFood(null);
                  setShowFoodHistory(false);
                }}
                className="mt-2 text-xs text-gray-400 hover:text-white h-6 px-2"
              >
                <X className="h-3 w-3 ml-1" />
                ביטול בחירה
              </Button>
            </div>
          ) : null}
          
          {filteredFoodHistory.length === 0 && !loadingFoodHistory ? (
            <div className="text-center text-gray-500 py-8">
              אין היסטוריית מזונות
            </div>
          ) : (
            filteredFoodHistory.map((food, index) => (
              <div
                key={`${food.foodName}-${index}`}
                className="flex items-center gap-3 p-3 bg-[#0f1a2a] rounded-lg hover:bg-[#1a2332] cursor-pointer border border-gray-800"
                onClick={() => {
                  if (selectedMealForFood) {
                    addFoodFromHistory(selectedMealForFood, food);
                  } else if (meals.length > 0) {
                    // Auto-select first meal if none selected
                    addFoodFromHistory(meals[0].id, food);
                  }
                }}
              >
                <Apple className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-white text-sm">{food.foodName}</p>
                  {food.amount && (
                    <p className="text-gray-500 text-xs">כמות: {food.amount} גרם</p>
                  )}
                </div>
                <Button
                  size="sm"
                  className="bg-[#00ff88] hover:bg-[#00e677] text-black"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedMealForFood) {
                      addFoodFromHistory(selectedMealForFood, food);
                    } else if (meals.length > 0) {
                      addFoodFromHistory(meals[0].id, food);
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </aside>
      </div>
    </div>
  );
}

export default function EditNutritionPlanPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <EditNutritionPlanContent />
    </ProtectedRoute>
  );
}

