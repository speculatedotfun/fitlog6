-- Check current RLS status and policies for workout_plans
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'workout_plans';

-- List all policies for workout_plans
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'workout_plans';

-- Test query that should work
SELECT COUNT(*) FROM workout_plans WHERE trainee_id = '87f3366b-0130-448a-99d0-07b317d89ae8' AND is_active = true;
