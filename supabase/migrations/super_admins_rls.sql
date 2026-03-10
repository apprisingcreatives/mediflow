-- =====================================================
-- RLS POLICIES FOR super_admins TABLE
-- =====================================================
-- This migration sets up Row Level Security for the super_admins table
-- Designed to support the invite-user flow:
--   1. Invite: API route uses supabaseAdmin (bypasses RLS)
--   2. Setup Password: User updates their own record to activate
--   3. Dashboard: Active super admins can view all super admins
-- =====================================================

-- Enable RLS on super_admins table
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTION (Prevents Infinite Recursion)
-- =====================================================

-- This function checks if the current user is an active super admin
-- SECURITY DEFINER means it runs with elevated privileges and bypasses RLS
CREATE OR REPLACE FUNCTION public.is_active_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.super_admins
    WHERE auth_user_id = auth.uid()
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_active_super_admin() TO authenticated;

-- =====================================================
-- SELECT POLICIES
-- =====================================================

-- Policy 1: Super admins can view all other super admins
-- (For dashboard, invite history, audit trails)
CREATE POLICY "Active super admins can view all super admins"
  ON super_admins
  FOR SELECT
  TO authenticated
  USING (public.is_active_super_admin());

-- Policy 2: Users can always view their own record
-- (Even before activation, for setup-password page)
CREATE POLICY "Users can view their own super admin record"
  ON super_admins
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- =====================================================
-- INSERT POLICIES
-- =====================================================

-- No INSERT policy needed!
-- All inserts are done via supabaseAdmin in the invite-user API route,
-- which bypasses RLS. This provides an extra layer of security by ensuring
-- only the API route (with proper authentication checks) can create super admins.

-- =====================================================
-- UPDATE POLICIES
-- =====================================================

-- Policy 3: Users can activate themselves after invite
-- (Critical for setup-password flow)
CREATE POLICY "Users can update their own super admin record"
  ON super_admins
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (
    -- Ensure users can only update their own record
    auth_user_id = auth.uid()
    -- Prevent users from changing sensitive fields
    AND invited_by IS NOT DISTINCT FROM (SELECT invited_by FROM super_admins WHERE auth_user_id = auth.uid())
    AND auth_user_id IS NOT DISTINCT FROM (SELECT auth_user_id FROM super_admins WHERE auth_user_id = auth.uid())
  );

-- Policy 4: Active super admins can update other super admins
-- (For future admin management features like deactivating users)
CREATE POLICY "Active super admins can manage other super admins"
  ON super_admins
  FOR UPDATE
  TO authenticated
  USING (public.is_active_super_admin())
  WITH CHECK (
    -- Active super admins can update others
    public.is_active_super_admin()
    -- But can't change who invited someone or their auth_user_id
    AND invited_by IS NOT DISTINCT FROM (SELECT invited_by FROM super_admins WHERE id = super_admins.id)
    AND auth_user_id IS NOT DISTINCT FROM (SELECT auth_user_id FROM super_admins WHERE id = super_admins.id)
  );

-- =====================================================
-- DELETE POLICIES
-- =====================================================

-- No DELETE policy!
-- Use soft delete via is_active = false instead.
-- This preserves audit trails and prevents accidental data loss.

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  -- Check if RLS is enabled
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'super_admins') THEN
    RAISE EXCEPTION 'RLS is not enabled on super_admins table';
  END IF;

  -- Check if policies exist
  IF (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'super_admins') < 4 THEN
    RAISE WARNING 'Expected at least 4 policies, found %', 
      (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'super_admins');
  END IF;

  RAISE NOTICE '✅ super_admins RLS policies created successfully!';
  RAISE NOTICE 'Policies created:';
  RAISE NOTICE '  - Active super admins can view all super admins (SELECT)';
  RAISE NOTICE '  - Users can view their own record (SELECT)';
  RAISE NOTICE '  - Users can update their own record (UPDATE)';
  RAISE NOTICE '  - Active super admins can manage others (UPDATE)';
END $$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, UPDATE ON super_admins TO authenticated;

-- Service role has full access (for API routes using supabaseAdmin)
GRANT ALL ON super_admins TO service_role;

-- =====================================================
-- TESTING QUERIES (Run these in SQL Editor)
-- =====================================================

-- Test 1: Check RLS status
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'super_admins';

-- Test 2: View all policies
-- SELECT * FROM pg_policies WHERE tablename = 'super_admins';

-- Test 3: Test as authenticated user (replace with your auth.uid())
-- SET request.jwt.claims.sub = 'your-auth-user-id-here';
-- SELECT * FROM super_admins;

-- Test 4: Verify grants
-- SELECT grantee, privilege_type FROM information_schema.role_table_grants 
-- WHERE table_name = 'super_admins';
