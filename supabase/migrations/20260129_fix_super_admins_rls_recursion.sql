-- =====================================================
-- FIX: Infinite Recursion in super_admins RLS Policies
-- =====================================================
-- This migration fixes the "infinite recursion detected" error
-- by replacing self-referential policies with a SECURITY DEFINER function
-- =====================================================

-- Step 1: Drop existing policies (if any)
DROP POLICY IF EXISTS "Active super admins can view all super admins" ON super_admins;
DROP POLICY IF EXISTS "Users can view their own super admin record" ON super_admins;
DROP POLICY IF EXISTS "Users can update their own super admin record" ON super_admins;
DROP POLICY IF EXISTS "Active super admins can manage other super admins" ON super_admins;

-- Step 2: Drop existing function (if any)
DROP FUNCTION IF EXISTS public.is_active_super_admin();

-- Step 3: Create helper function to prevent infinite recursion
-- SECURITY DEFINER means it bypasses RLS when checking the table
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_active_super_admin() TO authenticated;

-- Step 4: Create SELECT policies
CREATE POLICY "Active super admins can view all super admins"
  ON super_admins
  FOR SELECT
  TO authenticated
  USING (public.is_active_super_admin());

CREATE POLICY "Users can view their own super admin record"
  ON super_admins
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Step 5: Create UPDATE policies
CREATE POLICY "Users can update their own super admin record"
  ON super_admins
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (
    auth_user_id = auth.uid()
    AND invited_by IS NOT DISTINCT FROM (SELECT invited_by FROM super_admins WHERE auth_user_id = auth.uid())
    AND auth_user_id IS NOT DISTINCT FROM (SELECT auth_user_id FROM super_admins WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Active super admins can manage other super admins"
  ON super_admins
  FOR UPDATE
  TO authenticated
  USING (public.is_active_super_admin())
  WITH CHECK (
    public.is_active_super_admin()
    AND invited_by IS NOT DISTINCT FROM (SELECT invited_by FROM super_admins WHERE id = super_admins.id)
    AND auth_user_id IS NOT DISTINCT FROM (SELECT auth_user_id FROM super_admins WHERE id = super_admins.id)
  );

-- Step 6: Verify
DO $$
BEGIN
  -- Check helper function exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_active_super_admin'
  ) THEN
    RAISE EXCEPTION 'Helper function is_active_super_admin was not created';
  END IF;

  -- Check policies exist
  IF (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'super_admins') < 4 THEN
    RAISE WARNING 'Expected at least 4 policies, found %', 
      (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'super_admins');
  END IF;

  RAISE NOTICE '✅ RLS policies fixed successfully!';
  RAISE NOTICE '✅ Helper function created to prevent recursion';
  RAISE NOTICE 'Policies:';
  RAISE NOTICE '  - Active super admins can view all (SELECT)';
  RAISE NOTICE '  - Users can view own record (SELECT)';
  RAISE NOTICE '  - Users can update own record (UPDATE)';
  RAISE NOTICE '  - Active super admins can manage others (UPDATE)';
END $$;
