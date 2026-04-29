-- ============================================
-- COMPLETE FIX: Row Level Security (RLS) Policies
-- ============================================
-- Run this in your Supabase SQL Editor
-- Fixes: Users table + Payment Requests table

-- ===== PART 1: USERS TABLE =====
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin can view and update all users (for admin panel)
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  USING (
    -- Check if user is admin by checking email
    (SELECT email FROM auth.users WHERE auth.users.id = auth.uid()) = 'zahid.bdapp2026@gmail.com'
  );

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE
  USING (
    (SELECT email FROM auth.users WHERE auth.users.id = auth.uid()) = 'zahid.bdapp2026@gmail.com'
  );

-- ===== PART 2: PAYMENT_REQUESTS TABLE =====
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policies on payment_requests table
DROP POLICY IF EXISTS "Users can view own payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Users can insert payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Admins can view all payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Admins can update payment requests" ON payment_requests;

-- Users can view and insert their own payment requests
CREATE POLICY "Users can view own payment requests" ON payment_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert payment requests" ON payment_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin can view and update all payment requests
CREATE POLICY "Admins can view all payment requests" ON payment_requests
  FOR SELECT
  USING (
    (SELECT email FROM auth.users WHERE auth.users.id = auth.uid()) = 'zahid.bdapp2026@gmail.com'
  );

CREATE POLICY "Admins can update payment requests" ON payment_requests
  FOR UPDATE
  USING (
    (SELECT email FROM auth.users WHERE auth.users.id = auth.uid()) = 'zahid.bdapp2026@gmail.com'
  );

-- ===== VERIFICATION =====
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles
FROM pg_policies 
WHERE tablename IN ('users', 'payment_requests')
ORDER BY tablename, policyname;

-- Expected output:
-- ✅ users: Admins can update users
-- ✅ users: Admins can view all users
-- ✅ users: Users can insert own profile
-- ✅ users: Users can update own profile
-- ✅ users: Users can view own profile
-- ✅ payment_requests: Admins can update payment requests
-- ✅ payment_requests: Admins can view all payment requests
-- ✅ payment_requests: Users can insert payment requests
-- ✅ payment_requests: Users can view own payment requests
