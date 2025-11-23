"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getNutritionMenu } from "@/lib/db";
import type { NutritionMenu } from "@/lib/types";

interface FoodItem {
  id: string;
  name: string;
  category: "carbs" | "protein" | "fat";
  conversionFactor: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  caloriesPer100g: number;
}

const foodDatabase: FoodItem[] = [
  {
    id: "rice",
    name: "אורז",
    category: "carbs",
    conversionFactor: 1.0,
    proteinPer100g: 2.7,
    carbsPer100g: 28.2,
    fatPer100g: 0.3,
    caloriesPer100g: 130,
  },
  {
    id: "pasta",
    name: "פסטה",
    category: "carbs",
    conversionFactor: 0.8,
    proteinPer100g: 5.0,
    carbsPer100g: 25.0,
    fatPer100g: 0.9,
    caloriesPer100g: 131,
  },
  {
    id: "oats",
    name: "שיבולת שועל",
    category: "carbs",
    conversionFactor: 0.7,
    proteinPer100g: 13.2,
    carbsPer100g: 55.7,
    fatPer100g: 6.5,
    caloriesPer100g: 379,
  },
  {
    id: "sweet_potato",
    name: "בטטה",
    category: "carbs",
    conversionFactor: 1.2,
    proteinPer100g: 1.6,
    carbsPer100g: 20.1,
    fatPer100g: 0.1,
    caloriesPer100g: 86,
  },
  {
    id: "chicken",
    name: "חזה עוף",
    category: "protein",
    conversionFactor: 1.0,
    proteinPer100g: 31.0,
    carbsPer100g: 0.0,
    fatPer100g: 3.6,
    caloriesPer100g: 165,
  },
  {
    id: "beef",
    name: "בשר בקר",
    category: "protein",
    conversionFactor: 1.1,
    proteinPer100g: 26.0,
    carbsPer100g: 0.0,
    fatPer100g: 15.0,
    caloriesPer100g: 250,
  },
  {
    id: "eggs",
    name: "ביצים",
    category: "protein",
    conversionFactor: 0.9,
    proteinPer100g: 13.0,
    carbsPer100g: 1.1,
    fatPer100g: 11.0,
    caloriesPer100g: 155,
  },
  {
    id: "cottage",
    name: "קוטג'",
    category: "protein",
    conversionFactor: 0.85,
    proteinPer100g: 11.0,
    carbsPer100g: 3.4,
    fatPer100g: 4.3,
    caloriesPer100g: 98,
  },
];

export default function NutritionCalculator() {
  const { user } = useAuth();
  const [currentFood, setCurrentFood] = useState<string>("");
  const [currentAmount, setCurrentAmount] = useState<string>("");
  const [targetFood, setTargetFood] = useState<string>("");
  const [nutritionMenu, setNutritionMenu] = useState<NutritionMenu | null>(null);
  const [loading, setLoading] = useState(true);

  // Load nutrition menu from Supabase
  useEffect(() => {
    if (user?.id) {
      loadNutritionMenu();
    }
  }, [user?.id]);

  const loadNutritionMenu = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const menu = await getNutritionMenu(user.id);
      setNutritionMenu(menu || { meals: [] });
    } catch (error) {
      console.error('Error loading nutrition menu:', error);
      setNutritionMenu({ meals: [] });
    } finally {
      setLoading(false);
    }
  };

  // Convert menu to the format expected by the calculator
  const dailyMenu = nutritionMenu?.meals || [];

  // Get all foods from daily menu
  const menuFoods = dailyMenu.flatMap(meal =>
    meal.foods.map(food => ({
      foodName: food.foodName,
      amount: parseFloat(food.amount) || 0,
      mealName: meal.mealName,
    }))
  );

  // Get unique food names from menu and match with database
  const availableFoods = menuFoods.map(menuFood => {
    const foodFromDb = foodDatabase.find(f => f.name === menuFood.foodName);
    return foodFromDb ? { ...foodFromDb, menuAmount: menuFood.amount, mealName: menuFood.mealName } : null;
  }).filter(Boolean) as Array<FoodItem & { menuAmount: number; mealName: string }>;

  // Get unique foods only (in case same food appears in multiple meals)
  const uniqueFoods = Array.from(
    new Map(availableFoods.map(f => [f.name, f])).values()
  );

  const currentFoodItem = uniqueFoods.find((f) => f.name === currentFood);
  const targetFoodItem = foodDatabase.find((f) => f.name === targetFood);

  const calculateSwap = () => {
    if (!currentFoodItem || !targetFoodItem || !currentAmount) return null;

    const amount = parseFloat(currentAmount);
    const targetAmount = (amount * targetFoodItem.conversionFactor) / currentFoodItem.conversionFactor;

    const currentMacros = {
      protein: (currentFoodItem.proteinPer100g * amount) / 100,
      carbs: (currentFoodItem.carbsPer100g * amount) / 100,
      fat: (currentFoodItem.fatPer100g * amount) / 100,
      calories: (currentFoodItem.caloriesPer100g * amount) / 100,
    };

    const targetMacros = {
      protein: (targetFoodItem.proteinPer100g * targetAmount) / 100,
      carbs: (targetFoodItem.carbsPer100g * targetAmount) / 100,
      fat: (targetFoodItem.fatPer100g * targetAmount) / 100,
      calories: (targetFoodItem.caloriesPer100g * targetAmount) / 100,
    };

    return {
      targetAmount: targetAmount.toFixed(0),
      currentMacros,
      targetMacros,
    };
  };

  const result = calculateSwap();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="pt-4 pb-2">
          <Link href="/trainee/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowRight className="h-4 w-4 ml-2" />
              חזור לדשבורד
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">מחשבון המרות תזונה</h1>
          <p className="text-gray-600">החלף מזון מהתפריט שלך במזון אחר תוך שמירה על ערכים תזונתיים דומים</p>
        </div>

        {/* Daily Menu Display */}
        {loading ? (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="pt-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-600" />
              <p className="mt-2 text-muted-foreground">טוען תפריט...</p>
            </CardContent>
          </Card>
        ) : dailyMenu.length > 0 ? (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-lg">התפריט של היום</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dailyMenu.map((meal, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-semibold text-green-900">{meal.mealName}:</span>{" "}
                    <span className="text-green-800">
                      {meal.foods.map(f => `${f.foodName} ${f.amount}ג`).join(" + ")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-lg">אין תפריט זמין</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-800">
                המאמן שלך עדיין לא יצר תפריט תזונה. אתה יכול להשתמש במחשבון להמרת מזונות כלליים.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main Calculator Card */}
        <Card>
          <CardHeader>
            <CardTitle>בצע החלפה</CardTitle>
            <CardDescription>בחר מזון מהתפריט והחלף אותו במזון אחר</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Food Selection - Only from menu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">מזון מהתפריט</label>
              <select
                value={currentFood}
                onChange={(e) => {
                  setCurrentFood(e.target.value);
                  const selected = uniqueFoods.find(f => f.name === e.target.value);
                  if (selected) {
                    setCurrentAmount(selected.menuAmount.toString());
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">בחר מזון מהתפריט</option>
                {uniqueFoods.map((food) => (
                  <option key={food.id} value={food.name}>
                    {food.name} ({food.menuAmount}ג - {food.mealName})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Input - Pre-filled from menu */}
            {currentFood && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">כמות (גרם) - מהתפריט</label>
                <input
                  type="number"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="הזן כמות בגרמים"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {currentFoodItem && (
                  <p className="text-xs text-muted-foreground mt-1">
                    כמות בתפריט: {currentFoodItem.menuAmount}ג
                  </p>
                )}
              </div>
            )}

            {/* Arrow Icon */}
            {currentFood && currentAmount && (
              <div className="flex justify-center">
                <div className="bg-blue-100 rounded-full p-3">
                  <ArrowLeft className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            )}

            {/* Target Food Selection - All foods from database */}
            {currentFood && currentAmount && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">מזון יעד להחלפה</label>
                <select
                  value={targetFood}
                  onChange={(e) => setTargetFood(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">בחר מזון יעד</option>
                  {foodDatabase
                    .filter((f) => f.name !== currentFood)
                    .map((food) => (
                      <option key={food.id} value={food.name}>
                        {food.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Card */}
        {result && (
          <Card className="border-2 border-green-500 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">תוצאת ההמרה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Result */}
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-lg mb-2">במקום:</p>
                <p className="text-2xl font-bold text-gray-900 mb-3">
                  {currentAmount} גרם {currentFoodItem?.name}
                </p>
                <div className="flex justify-center mb-3">
                  <ArrowLeft className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-lg mb-2">אכול:</p>
                <p className="text-3xl font-bold text-green-600">
                  {result.targetAmount} גרם {targetFoodItem?.name}
                </p>
              </div>

              {/* Macros Comparison */}
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-center">השוואת ערכים תזונתיים</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-600 mb-2">{currentFoodItem?.name}</p>
                    <div className="space-y-1">
                      <p>חלבון: {result.currentMacros.protein.toFixed(1)}g</p>
                      <p>פחמימות: {result.currentMacros.carbs.toFixed(1)}g</p>
                      <p>שומן: {result.currentMacros.fat.toFixed(1)}g</p>
                      <p className="font-semibold">קלוריות: {result.currentMacros.calories.toFixed(0)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600 mb-2">{targetFoodItem?.name}</p>
                    <div className="space-y-1">
                      <p>חלבון: {result.targetMacros.protein.toFixed(1)}g</p>
                      <p>פחמימות: {result.targetMacros.carbs.toFixed(1)}g</p>
                      <p>שומן: {result.targetMacros.fat.toFixed(1)}g</p>
                      <p className="font-semibold">קלוריות: {result.targetMacros.calories.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={() => {
                setCurrentFood("");
                setTargetFood("");
                setCurrentAmount("");
              }}>
                החלפה חדשה
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
