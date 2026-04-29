-- Migration: Add Admin Notice Support
-- This migration adds support for admin notices that can be sent to all users or specific users

-- ==========================================
-- 1. ALTER NOTICES TABLE
-- ==========================================
-- Add new columns to support admin notices
ALTER TABLE notices ADD COLUMN IF NOT EXISTS is_admin_notice BOOLEAN DEFAULT FALSE;
ALTER TABLE notices ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(50) DEFAULT 'property' CHECK (recipient_type IN ('property', 'all_users', 'specific_users'));
ALTER TABLE notices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Make property_id nullable for admin notices
ALTER TABLE notices ALTER COLUMN property_id DROP NOT NULL;

-- ==========================================
-- 2. CREATE NOTICE_RECIPIENTS TABLE
-- ==========================================
-- This table tracks which users received which notices
CREATE TABLE IF NOT EXISTS notice_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(notice_id, user_id)
);

-- Create indexes for notice_recipients
CREATE INDEX IF NOT EXISTS idx_notice_recipients_notice_id ON notice_recipients(notice_id);
CREATE INDEX IF NOT EXISTS idx_notice_recipients_user_id ON notice_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_notice_recipients_is_read ON notice_recipients(is_read);

-- ==========================================
-- 3. UPDATE RLS POLICIES FOR NOTICES
-- ==========================================
-- Drop existing policies
DROP POLICY IF EXISTS "Owners can view own notices" ON notices;
DROP POLICY IF EXISTS "Owners can insert notices" ON notices;
DROP POLICY IF EXISTS "Owners can update own notices" ON notices;
DROP POLICY IF EXISTS "Owners can delete own notices" ON notices;

-- New policies
CREATE POLICY "Owners can view own notices" ON notices
  FOR SELECT USING (
    owner_id = auth.uid() 
    OR (is_admin_notice = TRUE AND EXISTS (
      SELECT 1 FROM notice_recipients 
      WHERE notice_recipients.notice_id = notices.id 
      AND notice_recipients.user_id = auth.uid()
    ))
    OR (property_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = notices.property_id 
      AND properties.owner_id = auth.uid()
    ))
  );

CREATE POLICY "Owners can insert notices" ON notices
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own notices" ON notices
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete own notices" ON notices
  FOR DELETE USING (owner_id = auth.uid());

-- ==========================================
-- 4. CREATE TRIGGER FOR NOTICES UPDATED_AT
-- ==========================================
DROP TRIGGER IF EXISTS update_notices_updated_at ON notices;

CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON notices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 5. ENABLE RLS ON NOTICE_RECIPIENTS
-- ==========================================
ALTER TABLE notice_recipients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own notice recipients" ON notice_recipients;
DROP POLICY IF EXISTS "Admins can view all notice recipients" ON notice_recipients;
DROP POLICY IF EXISTS "Users can insert own notice recipients" ON notice_recipients;
DROP POLICY IF EXISTS "Admins can insert notice recipients" ON notice_recipients;
DROP POLICY IF EXISTS "Users can update own notice recipients" ON notice_recipients;

-- Users can view their own notice recipients
CREATE POLICY "Users can view own notice recipients" ON notice_recipients
  FOR SELECT USING (user_id = auth.uid());

-- Admins can view all notice recipients
CREATE POLICY "Admins can view all notice recipients" ON notice_recipients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Admins can insert notice recipients
CREATE POLICY "Admins can insert notice recipients" ON notice_recipients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Users can update their own notice read status
CREATE POLICY "Users can update own notice recipients" ON notice_recipients
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
