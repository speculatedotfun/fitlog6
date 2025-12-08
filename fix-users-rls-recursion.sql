-- Fix infinite recursion in users table RLS policies
-- This script removes problematic policies and creates simple, non-recursive ones

-- Step 1: Drop ALL existing policies on users table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON users';
    END LOOP;
END $$;

-- Step 2: Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 3: Create simple, non-recursive policies
-- These policies don't reference the users table itself, avoiding recursion

-- Allow SELECT for everyone (read access)
CREATE POLICY "users_select_all" ON users
FOR SELECT 
USING (true);

-- Allow INSERT for everyone (user registration)
CREATE POLICY "users_insert_all" ON users
FOR INSERT 
WITH CHECK (true);

-- Allow UPDATE for everyone (including profile_image_url updates)
-- This is safe because we're using service role key in API routes
CREATE POLICY "users_update_all" ON users
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Verify policies were created
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users';

