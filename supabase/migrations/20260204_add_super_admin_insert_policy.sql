-- =====================================================
-- ADD INSERT POLICY FOR super_admins TABLE
-- =====================================================
-- Allows active super admins to invite new super admins
-- This enables defense-in-depth security: both API route 
-- authentication AND RLS policies must pass
-- =====================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Active super admins can insert new super admins" ON super_admins;

-- Create INSERT policy for active super admins
CREATE POLICY "Active super admins can insert new super admins"
  ON super_admins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only active super admins can insert
    public.is_active_super_admin()
  );

-- Grant INSERT permission to authenticated users
GRANT INSERT ON super_admins TO authenticated;

-- Verification
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE tablename = 'super_admins';
  
  RAISE NOTICE '✅ INSERT policy added for super_admins';
  RAISE NOTICE '📊 Total policies on super_admins: %', policy_count;
  
  -- List all policies
  RAISE NOTICE '📋 Current policies:';
  FOR policy_name IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'super_admins'
  LOOP
    RAISE NOTICE '  - %', policy_name;
  END LOOP;
END $$;
