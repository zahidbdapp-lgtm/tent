-- ==========================================
-- FIX RLS POLICIES FOR ADMIN NOTICES
-- ==========================================
-- This fixes the issue where admins cannot update or delete admin notices

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Owners can update own notices" ON notices;
DROP POLICY IF EXISTS "Owners can delete own notices" ON notices;

-- Create new policies that allow admins to manage admin notices
CREATE POLICY "Owners can update own notices" ON notices
  FOR UPDATE USING (
    owner_id = auth.uid() 
    OR (
      is_admin_notice = TRUE 
      AND EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
      )
    )
  );

CREATE POLICY "Owners can delete own notices" ON notices
  FOR DELETE USING (
    owner_id = auth.uid() 
    OR (
      is_admin_notice = TRUE 
      AND EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
      )
    )
  );

-- Verify the policies are in place
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'notices'
ORDER BY policyname;
