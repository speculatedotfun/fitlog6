-- Add profile_image_url column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Create storage bucket for avatars if it doesn't exist
-- Note: This needs to be run in Supabase Dashboard → Storage
-- Or use the Supabase Management API

-- Storage bucket policy (run this after creating the bucket)
-- Allow authenticated users to upload their own profile images
-- Allow public read access to profile images


