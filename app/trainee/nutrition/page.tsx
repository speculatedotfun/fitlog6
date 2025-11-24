"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Apple, Beef, Home, BarChart3, Users, Target, Settings, Edit, Dumbbell } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getNutritionMenu, getNutritionSwaps, addToDailyNutritionLog } from "@/lib/db";
import type { NutritionMenu } from "@/lib/types";
import { 
  FoodItem, 
  calculateMacros, 
  calculateSwapAmount, 
  calculateMacroDifferences,
  getMatchQuality,
  convertSwapToFoodItem 
} from "@/lib/nutrition-utils";
import { FoodSelectorCard } from "@/components/trainee/FoodSelectorCard";

function NutritionCalculatorContent() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [sourceFood, setSourceFood] = useState<FoodItem | null>(null);
  const [sourceAmount, setSourceAmount] = useState<string>("100");
  const [targetFood, setTargetFood] = useState<FoodItem | null>(null);
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [nutritionMenu, setNutritionMenu] = useState<NutritionMenu | null>(null);
  const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSwap, setSavingSwap] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      // Load data in parallel
      const [menu, swaps] = await Promise.all([
        getNutritionMenu(user.id).catch(() => ({ meals: [] })),
        getNutritionSwaps()
      ]);
      
      setNutritionMenu(menu || { meals: [] });
      
      // Convert swaps to FoodItem format
      const formattedSwaps = swaps.map(convertSwapToFoodItem);
      setFoodDatabase(formattedSwaps);
    } catch (error) {
      console.error('Error loading nutrition data:', error);
      setNutritionMenu({ meals: [] });
      setFoodDatabase([]);
    } finally {
      setLoading(false);
    }
  };

  // Get foods from menu
  const menuFoods = nutritionMenu?.meals?.flatMap(meal =>
    meal.foods.map(food => ({
      name: food.foodName,
      amount: parseFloat(food.amount) || 0,
    }))
  ) || [];

  // Calculate swap when both foods are selected
  useEffect(() => {
    if (sourceFood && sourceAmount && targetFood) {
      const amount = parseFloat(sourceAmount);
      if (!isNaN(amount) && amount > 0) {
        const calculatedAmount = calculateSwapAmount(sourceFood, amount, targetFood);
        setTargetAmount(calculatedAmount.toFixed(0));
      }
    }
  }, [sourceFood, sourceAmount, targetFood]);

  const sourceMacros = sourceFood && sourceAmount ? calculateMacros(sourceFood, parseFloat(sourceAmount) || 0) : null;
  const targetMacros = targetFood && targetAmount ? calculateMacros(targetFood, parseFloat(targetAmount) || 0) : null;

  // Calculate differences
  const macroDiffs = sourceMacros && targetMacros 
    ? calculateMacroDifferences(sourceMacros, targetMacros)
    : { protein: 0, carbs: 0, fat: 0, calories: 0 };

  // Calculate match quality
  const matchQuality = sourceMacros && targetMacros 
    ? getMatchQuality(sourceMacros, targetMacros)
    : { text: "—", color: "gray" as const, score: 0 };

  // Get target values (use source as target for comparison)
  const handleLogSwap = async () => {
    if (!user?.id || !targetFood || !targetAmount || !targetMacros) return;

    try {
      setSavingSwap(true);
      
      // Add the target food macros to today's nutrition log
      await addToDailyNutritionLog(
        user.id,
        new Date().toISOString().split('T')[0],
        {
          protein: targetMacros.protein,
          carbs: targetMacros.carbs,
          fat: targetMacros.fat,
          calories: targetMacros.calories,
        }
      );

      alert('ההחלפה נרשמה בהצלחה ביומן התזונה!');
      
      // Optionally reset the form
      // setSourceFood(null);
      // setTargetFood(null);
      // setSourceAmount("100");
      // setTargetAmount("");
    } catch (error: any) {
      console.error('Error logging swap:', error);
      alert(error.message || 'שגיאה בשמירת ההחלפה. אנא נסה שוב.');
    } finally {
      setSavingSwap(false);
    }
  };

  const proteinTarget = sourceMacros?.protein || 0;
  const carbsTarget = sourceMacros?.carbs || 0;
  const fatTarget = sourceMacros?.fat || 0;

  const proteinCurrent = targetMacros?.protein || 0;
  const carbsCurrent = targetMacros?.carbs || 0;
  const fatCurrent = targetMacros?.fat || 0;

  return (
    <div className="min-h-screen bg-[#0a1628] pb-20" dir="rtl">
      {/* Header */}
      <div className="bg-[#1a2332] text-white p-4 sticky top-0 z-10 border-b border-gray-800">
        <div className="max-w-2xl mx-auto flex items-center">
          <Link href="/trainee/dashboard">
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div className="text-center flex-1">
            <h1 className="text-xl font-bold">מחשבון תזונה</h1>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Food Comparison Cards */}
        <div className="grid grid-cols-2 gap-4">
          <FoodSelectorCard
            title="מקור:"
            foodName={sourceFood?.name || null}
            amount={sourceFood && sourceAmount ? sourceAmount : null}
            icon={Apple}
            onSelect={() => setShowSourcePicker(true)}
          />
          <FoodSelectorCard
            title="יעד:"
            foodName={targetFood?.name || null}
            amount={targetFood && targetAmount ? targetAmount : null}
            icon={Beef}
            onSelect={() => setShowTargetPicker(true)}
          />
        </div>

        {/* Nutritional Breakdown */}
        {sourceMacros && targetMacros && (
          <Card className="bg-[#1a2332] border-gray-800">
            <CardContent className="p-6 space-y-5">
              {/* Protein */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm">חלבון ({proteinCurrent.toFixed(0)} / {proteinTarget.toFixed(0)})</span>
                </div>
                <div className="relative h-4 bg-[#0f1a2a] rounded-full overflow-hidden">
                  {proteinCurrent <= proteinTarget ? (
                    <>
                      <div
                        className="absolute right-0 top-0 h-full bg-[#00ff88] rounded-full transition-all"
                        style={{ width: `${(proteinCurrent / proteinTarget) * 100}%` }}
                      ></div>
                      <div
                        className="absolute left-0 top-0 h-full bg-orange-500 rounded-full"
                        style={{ width: `${((proteinTarget - proteinCurrent) / proteinTarget) * 100}%` }}
                      ></div>
                    </>
                  ) : (
                    <>
                      <div
                        className="absolute right-0 top-0 h-full bg-[#00ff88] rounded-full"
                        style={{ width: `${(proteinTarget / proteinCurrent) * 100}%` }}
                      ></div>
                      <div
                        className="absolute left-0 top-0 h-full bg-orange-500 rounded-full"
                        style={{ width: `${((proteinCurrent - proteinTarget) / proteinCurrent) * 100}%` }}
                      ></div>
                    </>
                  )}
                </div>
              </div>

              {/* Carbohydrates */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm">פחמימות ({carbsCurrent.toFixed(0)} / {carbsTarget.toFixed(0)})</span>
                </div>
                <div className="relative h-4 bg-[#0f1a2a] rounded-full overflow-hidden">
                  {carbsCurrent <= carbsTarget ? (
                    <>
                      <div
                        className="absolute right-0 top-0 h-full bg-[#00ff88] rounded-full transition-all"
                        style={{ width: `${(carbsCurrent / (carbsTarget || 1)) * 100}%` }}
                      ></div>
                      <div
                        className="absolute left-0 top-0 h-full bg-orange-500 rounded-full"
                        style={{ width: `${((carbsTarget - carbsCurrent) / (carbsTarget || 1)) * 100}%` }}
                      ></div>
                    </>
                  ) : (
                    <>
                      <div
                        className="absolute right-0 top-0 h-full bg-[#00ff88] rounded-full"
                        style={{ width: `${(carbsTarget / carbsCurrent) * 100}%` }}
                      ></div>
                      <div
                        className="absolute left-0 top-0 h-full bg-orange-500 rounded-full"
                        style={{ width: `${((carbsCurrent - carbsTarget) / carbsCurrent) * 100}%` }}
                      ></div>
                    </>
                  )}
                </div>
              </div>

              {/* Fat */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm">שומן ({fatCurrent.toFixed(1)} / {fatTarget.toFixed(1)})</span>
                </div>
                <div className="relative h-4 bg-[#0f1a2a] rounded-full overflow-hidden">
                  {fatCurrent <= fatTarget ? (
                    <>
                      <div
                        className="absolute right-0 top-0 h-full bg-[#00ff88] rounded-full transition-all"
                        style={{ width: `${(fatCurrent / fatTarget) * 100}%` }}
                      ></div>
                      <div
                        className="absolute left-0 top-0 h-full bg-orange-500 rounded-full"
                        style={{ width: `${((fatTarget - fatCurrent) / fatTarget) * 100}%` }}
                      ></div>
                    </>
                  ) : (
                    <>
                      <div
                        className="absolute right-0 top-0 h-full bg-[#00ff88] rounded-full"
                        style={{ width: `${(fatTarget / fatCurrent) * 100}%` }}
                      ></div>
                      <div
                        className="absolute left-0 top-0 h-full bg-orange-500 rounded-full"
                        style={{ width: `${((fatCurrent - fatTarget) / fatCurrent) * 100}%` }}
                      ></div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {sourceMacros && targetMacros && (
          <Card className="bg-[#1a2332] border-gray-800">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">הפרש קלוריות:</span>
                <span className={`text-white font-semibold ${macroDiffs.calories < 0 ? 'text-green-400' : macroDiffs.calories > 0 ? 'text-red-400' : ''}`}>
                  {macroDiffs.calories > 0 ? '+' : ''}{macroDiffs.calories.toFixed(0)} קק"ל
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">התאמה:</span>
                <span className={`font-semibold ${
                  matchQuality.color === 'green' ? 'text-[#00ff88]' :
                  matchQuality.color === 'yellow' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {matchQuality.text}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {sourceFood && targetFood && sourceAmount && targetAmount && (
          <div className="space-y-3">
            <Button
              className="w-full bg-[#00ff88] hover:bg-[#00e677] text-black font-bold h-14 text-lg"
              onClick={handleLogSwap}
              disabled={savingSwap || !user?.id}
            >
              {savingSwap ? (
                <>
                  <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                  שומר...
                </>
              ) : (
                'בצע החלפה ביומן'
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full bg-[#0f1a2a] border-gray-700 text-gray-300 hover:bg-gray-800 h-12"
              onClick={() => {
                // TODO: Implement save favorite
                alert('שמירת מועדף - יתווסף בהמשך');
              }}
            >
              שמור מועדף
            </Button>
          </div>
        )}
      </div>

      {/* Food Picker Modals */}
      {showSourcePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSourcePicker(false)}>
          <Card className="bg-[#1a2332] border-gray-800 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-white">בחר מזון מקור</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {menuFoods.length > 0 ? (
                menuFoods.map((menuFood, index) => {
                  const food = foodDatabase.find(f => f.name === menuFood.name);
                  if (!food) return null;
                  return (
                    <button
                      key={index}
                      className="w-full text-right p-3 bg-[#0f1a2a] hover:bg-gray-800 rounded-lg text-white transition-colors"
                      onClick={() => {
                        setSourceFood(food);
                        setSourceAmount(menuFood.amount.toString());
                        setShowSourcePicker(false);
                      }}
                    >
                      <div className="font-semibold">{food.name}</div>
                      <div className="text-sm text-gray-400">{menuFood.amount} גרם</div>
                    </button>
                  );
                })
              ) : (
                <div className="space-y-2">
                  {foodDatabase.length === 0 ? (
                    <div className="text-center text-gray-400 py-4">
                      אין מזונות זמינים. אנא הוסף מזונות למסד הנתונים.
                    </div>
                  ) : (
                    foodDatabase.map((food) => (
                      <button
                        key={food.id}
                        className="w-full text-right p-3 bg-[#0f1a2a] hover:bg-gray-800 rounded-lg text-white transition-colors"
                        onClick={() => {
                          setSourceFood(food);
                          setSourceAmount("100");
                          setShowSourcePicker(false);
                        }}
                      >
                        <div className="font-semibold">{food.name}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {showTargetPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowTargetPicker(false)}>
          <Card className="bg-[#1a2332] border-gray-800 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-white">בחר מזון יעד</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {foodDatabase.length === 0 ? (
                <div className="text-center text-gray-400 py-4">
                  אין מזונות זמינים. אנא הוסף מזונות למסד הנתונים.
                </div>
              ) : (
                foodDatabase
                  .filter(f => f.id !== sourceFood?.id)
                  .map((food) => (
                    <button
                      key={food.id}
                      className="w-full text-right p-3 bg-[#0f1a2a] hover:bg-gray-800 rounded-lg text-white transition-colors"
                      onClick={() => {
                        setTargetFood(food);
                        setShowTargetPicker(false);
                      }}
                    >
                      <div className="font-semibold">{food.name}</div>
                    </button>
                  ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

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

export default function NutritionCalculator() {
  return (
    <ProtectedRoute requiredRole="trainee">
      <NutritionCalculatorContent />
    </ProtectedRoute>
  );
}
