-- Migration: Add nutrition_menu column to workout_plans table
-- Run this in your Supabase SQL Editor

ALTER TABLE workout_plans 
ADD COLUMN IF NOT EXISTS nutrition_menu JSONB;

-- This will store the nutrition menu structure:
-- {
--   "meals": [
--     {
--       "id": "1",
--       "mealName": "ארוחת בוקר",
--       "foods": [
--         { "id": "1", "foodName": "שיבולת שועל", "amount": "100" }
--       ]
--     }
--   ]
-- }

