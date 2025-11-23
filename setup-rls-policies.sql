-- RLS Policies for Universal FitLog
-- This enables Row Level Security while allowing the app to work

-- ============================================
-- USERS TABLE
-- ============================================

-- Allow everyone to read users (for now - can be restricted later)
CREATE POLICY "Allow public read access on users" ON users
FOR SELECT USING (true);

-- Allow everyone to insert users (trainers can create trainees)
CREATE POLICY "Allow public insert access on users" ON users
FOR INSERT WITH CHECK (true);

-- Allow everyone to update users
CREATE POLICY "Allow public update access on users" ON users
FOR UPDATE USING (true);

-- ============================================
-- EXERCISE_LIBRARY TABLE
-- ============================================

-- Allow everyone to read exercises
CREATE POLICY "Allow public read access on exercise_library" ON exercise_library
FOR SELECT USING (true);

-- Allow everyone to insert exercises
CREATE POLICY "Allow public insert access on exercise_library" ON exercise_library
FOR INSERT WITH CHECK (true);

-- Allow everyone to update exercises
CREATE POLICY "Allow public update access on exercise_library" ON exercise_library
FOR UPDATE USING (true);

-- Allow everyone to delete exercises
CREATE POLICY "Allow public delete access on exercise_library" ON exercise_library
FOR DELETE USING (true);

-- ============================================
-- WORKOUT_PLANS TABLE
-- ============================================

-- Allow everyone to read workout plans
CREATE POLICY "Allow public read access on workout_plans" ON workout_plans
FOR SELECT USING (true);

-- Allow everyone to insert workout plans
CREATE POLICY "Allow public insert access on workout_plans" ON workout_plans
FOR INSERT WITH CHECK (true);

-- Allow everyone to update workout plans
CREATE POLICY "Allow public update access on workout_plans" ON workout_plans
FOR UPDATE USING (true);

-- Allow everyone to delete workout plans
CREATE POLICY "Allow public delete access on workout_plans" ON workout_plans
FOR DELETE USING (true);

-- ============================================
-- ROUTINES TABLE
-- ============================================

-- Allow everyone to read routines
CREATE POLICY "Allow public read access on routines" ON routines
FOR SELECT USING (true);

-- Allow everyone to insert routines
CREATE POLICY "Allow public insert access on routines" ON routines
FOR INSERT WITH CHECK (true);

-- Allow everyone to update routines
CREATE POLICY "Allow public update access on routines" ON routines
FOR UPDATE USING (true);

-- Allow everyone to delete routines
CREATE POLICY "Allow public delete access on routines" ON routines
FOR DELETE USING (true);

-- ============================================
-- ROUTINE_EXERCISES TABLE
-- ============================================

-- Allow everyone to read routine exercises
CREATE POLICY "Allow public read access on routine_exercises" ON routine_exercises
FOR SELECT USING (true);

-- Allow everyone to insert routine exercises
CREATE POLICY "Allow public insert access on routine_exercises" ON routine_exercises
FOR INSERT WITH CHECK (true);

-- Allow everyone to update routine exercises
CREATE POLICY "Allow public update access on routine_exercises" ON routine_exercises
FOR UPDATE USING (true);

-- Allow everyone to delete routine exercises
CREATE POLICY "Allow public delete access on routine_exercises" ON routine_exercises
FOR DELETE USING (true);

-- ============================================
-- WORKOUT_LOGS TABLE
-- ============================================

-- Allow everyone to read workout logs
CREATE POLICY "Allow public read access on workout_logs" ON workout_logs
FOR SELECT USING (true);

-- Allow everyone to insert workout logs
CREATE POLICY "Allow public insert access on workout_logs" ON workout_logs
FOR INSERT WITH CHECK (true);

-- Allow everyone to update workout logs
CREATE POLICY "Allow public update access on workout_logs" ON workout_logs
FOR UPDATE USING (true);

-- Allow everyone to delete workout logs
CREATE POLICY "Allow public delete access on workout_logs" ON workout_logs
FOR DELETE USING (true);

-- ============================================
-- SET_LOGS TABLE
-- ============================================

-- Allow everyone to read set logs
CREATE POLICY "Allow public read access on set_logs" ON set_logs
FOR SELECT USING (true);

-- Allow everyone to insert set logs
CREATE POLICY "Allow public insert access on set_logs" ON set_logs
FOR INSERT WITH CHECK (true);

-- Allow everyone to update set logs
CREATE POLICY "Allow public update access on set_logs" ON set_logs
FOR UPDATE USING (true);

-- Allow everyone to delete set logs
CREATE POLICY "Allow public delete access on set_logs" ON set_logs
FOR DELETE USING (true);

-- ============================================
-- NUTRITION_SWAPS TABLE
-- ============================================

-- Allow everyone to read nutrition swaps (it's public data)
CREATE POLICY "Allow public read access on nutrition_swaps" ON nutrition_swaps
FOR SELECT USING (true);

-- Allow everyone to insert nutrition swaps
CREATE POLICY "Allow public insert access on nutrition_swaps" ON nutrition_swaps
FOR INSERT WITH CHECK (true);

-- Allow everyone to update nutrition swaps
CREATE POLICY "Allow public update access on nutrition_swaps" ON nutrition_swaps
FOR UPDATE USING (true);

-- ============================================
-- DAILY_NUTRITION_LOGS TABLE
-- ============================================

-- Allow everyone to read nutrition logs
CREATE POLICY "Allow public read access on daily_nutrition_logs" ON daily_nutrition_logs
FOR SELECT USING (true);

-- Allow everyone to insert nutrition logs
CREATE POLICY "Allow public insert access on daily_nutrition_logs" ON daily_nutrition_logs
FOR INSERT WITH CHECK (true);

-- Allow everyone to update nutrition logs
CREATE POLICY "Allow public update access on daily_nutrition_logs" ON daily_nutrition_logs
FOR UPDATE USING (true);

-- Allow everyone to delete nutrition logs
CREATE POLICY "Allow public delete access on daily_nutrition_logs" ON daily_nutrition_logs
FOR DELETE USING (true);

