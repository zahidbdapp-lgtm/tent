-- ============================================
-- FIX: Admin User Deletion RLS Policies
-- ============================================
-- Run this in your Supabase SQL Editor
-- This enables admins to delete users and all related data from the admin panel

-- ===== 1. USERS TABLE =====
DROP POLICY IF EXISTS "Admins can delete users" ON users;

CREATE POLICY "Admins can delete users" ON users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users AS admin_user
      WHERE admin_user.id = auth.uid() AND admin_user.role = 'admin'
    )
  );

-- ===== 2. PROPERTIES TABLE =====
DROP POLICY IF EXISTS "Admins can delete properties" ON properties;

CREATE POLICY "Admins can delete properties" ON properties
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users AS admin_user
      WHERE admin_user.id = auth.uid() AND admin_user.role = 'admin'
    )
  );

-- ===== 3. TENANTS TABLE =====
DROP POLICY IF EXISTS "Admins can delete tenants" ON tenants;

CREATE POLICY "Admins can delete tenants" ON tenants
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users AS admin_user
      WHERE admin_user.id = auth.uid() AND admin_user.role = 'admin'
    )
  );

-- ===== 4. INVOICES TABLE =====
DROP POLICY IF EXISTS "Admins can delete invoices" ON invoices;

CREATE POLICY "Admins can delete invoices" ON invoices
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users AS admin_user
      WHERE admin_user.id = auth.uid() AND admin_user.role = 'admin'
    )
  );

-- ===== 5. NOTICES TABLE =====
DROP POLICY IF EXISTS "Admins can delete notices" ON notices;

CREATE POLICY "Admins can delete notices" ON notices
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users AS admin_user
      WHERE admin_user.id = auth.uid() AND admin_user.role = 'admin'
    )
  );

-- ===== 6. TICKETS TABLE =====
DROP POLICY IF EXISTS "Admins can delete tickets" ON tickets;

CREATE POLICY "Admins can delete tickets" ON tickets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users AS admin_user
      WHERE admin_user.id = auth.uid() AND admin_user.role = 'admin'
    )
  );

-- ===== 7. EXPENSES TABLE =====
DROP POLICY IF EXISTS "Admins can delete expenses" ON expenses;

CREATE POLICY "Admins can delete expenses" ON expenses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users AS admin_user
      WHERE admin_user.id = auth.uid() AND admin_user.role = 'admin'
    )
  );

-- Verify all policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('users', 'properties', 'tenants', 'invoices', 'notices', 'tickets', 'expenses')
  AND policyname LIKE 'Admins can delete%'
ORDER BY tablename, policyname;
