-- Fix RLS Permission Denied Error
-- Run this in Supabase SQL Editor to ensure RLS policies are properly applied

-- Step 1: Verify RLS is enabled on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Step 3: Recreate the correct RLS policies
-- Allow users to SELECT their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to INSERT their own profile (for first-time registration)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to UPDATE their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 4: Verify policies are created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Expected output:
-- ✅ Users can view own profile (SELECT)
-- ✅ Users can insert own profile (INSERT)
-- ✅ Users can update own profile (UPDATE)

-- If you get "permission denied" error, try the alternative below:
-- ALTERNATIVE: Temporarily disable RLS to test (NOT RECOMMENDED FOR PRODUCTION)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- This should only be done to test if RLS is the actual issue
