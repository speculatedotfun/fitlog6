"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

export interface FoodSelectorCardProps {
  title: string;
  foodName: string | null;
  amount?: string | null;
  icon: LucideIcon;
  onSelect: () => void;
  className?: string;
}

export function FoodSelectorCard({
  title,
  foodName,
  amount,
  icon: Icon,
  onSelect,
  className = "",
}: FoodSelectorCardProps) {
  return (
    <Card className={`bg-[#1a2332] border-gray-800 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-[#0f1a2a] rounded-lg flex items-center justify-center">
            <Icon className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg">
            {foodName || "בחר מזון"}
          </p>
          {foodName && amount && (
            <p className="text-gray-400 text-sm mt-1">
              ({amount} גרם)
            </p>
          )}
        </div>
        <Button
          className="w-full bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold h-9"
          onClick={onSelect}
        >
          שינוי
        </Button>
      </CardContent>
    </Card>
  );
}

