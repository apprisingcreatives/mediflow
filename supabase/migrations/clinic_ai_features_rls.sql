-- RLS Policy for clinic_ai_features table
-- Super admins: Full access (SELECT, INSERT, UPDATE, DELETE)
-- Clinic admins: Read-only access (SELECT) for their own clinic's features

-- Enable RLS on clinic_ai_features table
ALTER TABLE clinic_ai_features ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Super admins have full access to clinic AI features" ON clinic_ai_features;
DROP POLICY IF EXISTS "Clinic admins can view their clinic's AI features" ON clinic_ai_features;

-- ============================================================================
-- SUPER ADMIN POLICIES (Full Access)
-- ============================================================================

-- Policy: Super admins can do everything (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Super admins have full access to clinic AI features"
ON clinic_ai_features
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM super_admins
    WHERE super_admins.auth_user_id = auth.uid()
    AND super_admins.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM super_admins
    WHERE super_admins.auth_user_id = auth.uid()
    AND super_admins.is_active = true
  )
);

-- ============================================================================
-- CLINIC ADMIN POLICIES (Read-Only for their clinic)
-- ============================================================================

-- Policy: Clinic admins can view AI features for their own clinic only
CREATE POLICY "Clinic admins can view their clinic's AI features"
ON clinic_ai_features
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clinic_admins
    WHERE clinic_admins.auth_user_id = auth.uid()
    AND clinic_admins.clinic_id = clinic_ai_features.clinic_id
    AND clinic_admins.is_active = true
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that RLS is enabled
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'clinic_ai_features' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS is enabled on clinic_ai_features table';
  ELSE
    RAISE NOTICE '❌ RLS is NOT enabled on clinic_ai_features table';
  END IF;
END $$;

-- List all policies on clinic_ai_features table
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '📋 Current policies on clinic_ai_features:';
  FOR policy_record IN 
    SELECT policyname, cmd, roles, qual, with_check
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'clinic_ai_features'
  LOOP
    RAISE NOTICE '  - Policy: %, Command: %, Roles: %', 
      policy_record.policyname, 
      policy_record.cmd, 
      policy_record.roles;
  END LOOP;
END $$;

-- Test query examples (commented out - uncomment to test)
/*
-- As a super admin, you should see all clinic AI features
SELECT 
  caf.*,
  c.name as clinic_name,
  af.name as feature_name
FROM clinic_ai_features caf
JOIN clinics c ON c.id = caf.clinic_id
JOIN ai_features af ON af.id = caf.feature_id
ORDER BY c.name, af.name;

-- As a clinic admin, you should only see your clinic's AI features
SELECT 
  caf.*,
  af.name as feature_name,
  caf.is_enabled
FROM clinic_ai_features caf
JOIN ai_features af ON af.id = caf.feature_id
WHERE caf.clinic_id = (
  SELECT clinic_id FROM clinic_admins 
  WHERE auth_user_id = auth.uid()
);
*/

-- ============================================================================
-- NOTES
-- ============================================================================

-- Super Admin Access:
--   - Can SELECT all clinic AI features across all clinics
--   - Can INSERT new clinic AI feature associations
--   - Can UPDATE any clinic AI feature (e.g., toggle is_enabled)
--   - Can DELETE any clinic AI feature association
--   - Used by: /api/super-admin/clinics/[clinicId]/features

-- Clinic Admin Access:
--   - Can SELECT only their own clinic's AI features
--   - CANNOT INSERT, UPDATE, or DELETE (must request super admin)
--   - Used by: /api/clinic/[clinicId]/features (read-only)

-- For clinic admins to request feature changes:
--   - Create a separate table like "clinic_feature_requests"
--   - Or handle via super admin dashboard

COMMENT ON TABLE clinic_ai_features IS 
'Stores which AI features are enabled for each clinic. 
RLS: Super admins have full access, clinic admins have read-only access to their clinic.';
