-- Fix for Infinite Recursion in RLS Policy
-- Run this in your Supabase SQL Editor to fix the issue

-- Step 1: Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Step 2: Verify the remaining policies are working
-- The users table now has these policies:
-- - "Users can view own profile" (SELECT)
-- - "Users can update own profile" (UPDATE)  
-- - "Users can insert own profile" (INSERT)

-- If you need admin functionality to view all users, use one of these approaches:

-- OPTION 1: Use RLS bypass with Supabase service role
-- (Use in server-side code only with limited access)
-- const { data } = await supabaseAdmin.from('users').select()

-- OPTION 2: Create an admin_roles table (better for production)
-- CREATE TABLE admin_roles (
--   user_id UUID REFERENCES users(id),
--   role VARCHAR(50) CHECK (role IN ('super_admin', 'moderator'))
-- );

-- OPTION 3: Use custom JWT claims in auth.jwt()
-- CREATE POLICY "Admins can view all users" ON users
--   FOR SELECT USING (
--     (auth.jwt() ->> 'role' = 'admin')
--   );

-- Status after running this migration:
-- ✅ Infinite recursion fixed
-- ✅ Users can view their own profile
-- ✅ Users can update their own profile
-- ✅ Users can insert their profile
