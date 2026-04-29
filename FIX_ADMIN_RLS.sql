-- ==========================================
-- FIX RLS POLICIES FOR USERS TABLE
-- ==========================================
-- These policies need to be applied in Supabase SQL Editor
-- This fixes the sign-up issue where new users can't insert their own profile

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create correct policies:
-- 1. Regular users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (
    id = auth.uid()
  );

-- 2. Admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    role = 'admin'
  );

-- 3. Regular users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (
    id = auth.uid()
  );

-- 4. Admins can update any user
CREATE POLICY "Admins can update any user" ON users
  FOR UPDATE USING (
    role = 'admin'
  );

-- 5. Regular users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ==========================================
-- FIX PAYMENT_REQUESTS TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Admins can view all payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Admins can update payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Admins can delete payment requests" ON payment_requests;

-- Admins can update payment requests (approve/reject payments)
CREATE POLICY "Admins can update payment requests" ON payment_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users AS admin_user
      WHERE admin_user.id = auth.uid() AND admin_user.role = 'admin'
    )
  );

-- Admins can delete payment requests
CREATE POLICY "Admins can delete payment requests" ON payment_requests
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users AS admin_user
      WHERE admin_user.id = auth.uid() AND admin_user.role = 'admin'
    )
  );

-- Admins can view all payment requests
CREATE POLICY "Admins can view all payment requests" ON payment_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users AS admin_user
      WHERE admin_user.id = auth.uid() AND admin_user.role = 'admin'
    )
  );

