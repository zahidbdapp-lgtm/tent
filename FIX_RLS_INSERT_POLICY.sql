-- Fix RLS INSERT policy for users table to allow signup
-- Run this in Supabase SQL Editor if signup still fails with permission errors

-- Step 1: Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Step 2: Create a more flexible INSERT policy
-- This allows users to insert their own profile when authenticated
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

-- If you still get permission errors after deploying the app, 
-- temporarily use this more permissive policy:
-- 
-- DROP POLICY IF EXISTS "Users can insert own profile" ON users;
-- 
-- CREATE POLICY "Users can insert own profile" ON users
--   FOR INSERT WITH CHECK (true);
-- 
-- Then after signup works, revert to the stricter version above.

-- To verify the policy:
-- SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'users' AND policyname LIKE '%insert%';

