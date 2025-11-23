-- Fix RLS policies for workout_plans table
-- This script will fix the 406 error by ensuring proper RLS policies

-- Step 1: Drop ALL existing policies on workout_plans
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'workout_plans') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON workout_plans';
    END LOOP;
END $$;

-- Step 2: Ensure RLS is enabled
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

-- Step 3: Create a simple, permissive policy that allows all operations
-- This uses USING and WITH CHECK both set to true for maximum permissiveness
CREATE POLICY "workout_plans_allow_all" ON workout_plans
FOR ALL 
USING (true)
WITH CHECK (true);

-- Verify the policy was created
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'workout_plans';
