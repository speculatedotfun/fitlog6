-- Fix RLS policy for users table to allow users to update their own profile_image_url
-- Run this in Supabase SQL Editor

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Allow public update access on users" ON users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON users;

-- Create a policy that allows users to update their own record
-- This is more secure than allowing everyone to update
CREATE POLICY "Allow users to update their own profile" ON users
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Also ensure the public update policy exists as a fallback (if needed)
-- Only use this if the above doesn't work
-- CREATE POLICY "Allow public update access on users" ON users
-- FOR UPDATE USING (true);

-- Verify RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

