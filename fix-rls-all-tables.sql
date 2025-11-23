-- Comprehensive RLS Fix for All Tables
-- This script will fix RLS issues for routines, exercise_library, and other related tables

-- ============================================
-- ROUTINES TABLE
-- ============================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'routines') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON routines';
    END LOOP;
END $$;

ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "routines_allow_all" ON routines
FOR ALL 
USING (true)
WITH CHECK (true);

-- ============================================
-- EXERCISE_LIBRARY TABLE
-- ============================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'exercise_library') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON exercise_library';
    END LOOP;
END $$;

ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercise_library_allow_all" ON exercise_library
FOR ALL 
USING (true)
WITH CHECK (true);

-- ============================================
-- ROUTINE_EXERCISES TABLE
-- ============================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'routine_exercises') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON routine_exercises';
    END LOOP;
END $$;

ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "routine_exercises_allow_all" ON routine_exercises
FOR ALL 
USING (true)
WITH CHECK (true);

-- ============================================
-- WORKOUT_LOGS TABLE
-- ============================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'workout_logs') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON workout_logs';
    END LOOP;
END $$;

ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_logs_allow_all" ON workout_logs
FOR ALL 
USING (true)
WITH CHECK (true);

-- ============================================
-- SET_LOGS TABLE (if it exists)
-- ============================================
DO $$ 
DECLARE
    r RECORD;
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'set_logs'
    ) INTO table_exists;
    
    IF table_exists THEN
        FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'set_logs') LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON set_logs';
        END LOOP;
        
        ALTER TABLE set_logs ENABLE ROW LEVEL SECURITY;
        
        EXECUTE 'CREATE POLICY "set_logs_allow_all" ON set_logs
        FOR ALL 
        USING (true)
        WITH CHECK (true)';
    END IF;
END $$;

-- Verify all policies were created
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('routines', 'exercise_library', 'routine_exercises', 'workout_logs', 'set_logs')
ORDER BY tablename, policyname;

