-- Simplified migration for clinic_admins auth update
-- Only runs what's needed based on current schema

-- ============================================================================
-- STEP 1: Add unique constraint on auth_user_id
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'clinic_admins_auth_user_id_key'
  ) THEN
    ALTER TABLE public.clinic_admins 
    ADD CONSTRAINT clinic_admins_auth_user_id_key UNIQUE (auth_user_id);
    RAISE NOTICE 'Added unique constraint on auth_user_id';
  ELSE
    RAISE NOTICE 'Unique constraint on auth_user_id already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Make password_hash nullable first (for safety)
-- ============================================================================
-- This allows existing records to remain while you migrate them
DO $$
BEGIN
  ALTER TABLE public.clinic_admins 
  ALTER COLUMN password_hash DROP NOT NULL;
  
  RAISE NOTICE 'Made password_hash column nullable';
END $$;

-- ============================================================================
-- STEP 3: Drop password_hash column (ONLY after all admins have auth_user_id)
-- ============================================================================
-- UNCOMMENT THIS ONLY AFTER VERIFYING ALL ADMINS HAVE auth_user_id:
-- 
-- DO $$
-- DECLARE
--   admins_without_auth INT;
-- BEGIN
--   SELECT COUNT(*) INTO admins_without_auth
--   FROM clinic_admins
--   WHERE auth_user_id IS NULL;
--   
--   IF admins_without_auth > 0 THEN
--     RAISE EXCEPTION '% clinic admins still need auth_user_id. Migration required!', admins_without_auth;
--   ELSE
--     ALTER TABLE public.clinic_admins DROP COLUMN password_hash;
--     RAISE NOTICE 'Dropped password_hash column successfully';
--   END IF;
-- END $$;

-- ============================================================================
-- STEP 4: Enable RLS on clinic_admins
-- ============================================================================
ALTER TABLE public.clinic_admins ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Drop existing policies (if any)
-- ============================================================================
DROP POLICY IF EXISTS "clinic_admins_select_own" ON public.clinic_admins;
DROP POLICY IF EXISTS "clinic_admins_update_own" ON public.clinic_admins;
DROP POLICY IF EXISTS "clinic_admins_super_admin_read" ON public.clinic_admins;
DROP POLICY IF EXISTS "clinic_admins_super_admin_update" ON public.clinic_admins;
DROP POLICY IF EXISTS "clinic_admins_service_role_all" ON public.clinic_admins;

-- ============================================================================
-- STEP 6: Create RLS Policies
-- ============================================================================

-- Service role can do everything
CREATE POLICY "clinic_admins_service_role_all"
ON public.clinic_admins
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Clinic admins can read their own record
CREATE POLICY "clinic_admins_select_own"
ON public.clinic_admins
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Clinic admins can update their own record (limited fields)
CREATE POLICY "clinic_admins_update_own"
ON public.clinic_admins
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Super admins can read all clinic admins
CREATE POLICY "clinic_admins_super_admin_read"
ON public.clinic_admins
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM super_admins 
    WHERE auth_user_id = auth.uid()
  )
);

-- Super admins can update clinic admins
CREATE POLICY "clinic_admins_super_admin_update"
ON public.clinic_admins
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM super_admins 
    WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM super_admins 
    WHERE auth_user_id = auth.uid()
  )
);

-- ============================================================================
-- STEP 7: Grant permissions
-- ============================================================================
GRANT SELECT, UPDATE ON public.clinic_admins TO authenticated;
GRANT ALL ON public.clinic_admins TO service_role;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to check your migration)
-- ============================================================================

-- Check if there are any clinic_admins without auth_user_id
DO $$
DECLARE
  count_without_auth INT;
BEGIN
  SELECT COUNT(*) INTO count_without_auth
  FROM clinic_admins
  WHERE auth_user_id IS NULL;
  
  IF count_without_auth > 0 THEN
    RAISE WARNING '⚠️  % clinic admins need auth_user_id migration!', count_without_auth;
  ELSE
    RAISE NOTICE '✅ All clinic admins have auth_user_id';
  END IF;
END $$;

-- Check if password_hash column still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clinic_admins' 
    AND column_name = 'password_hash'
  ) THEN
    RAISE WARNING '⚠️  password_hash column still exists (nullable)';
  ELSE
    RAISE NOTICE '✅ password_hash column has been dropped';
  END IF;
END $$;

-- Verify RLS is enabled
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename = 'clinic_admins';
  
  IF rls_enabled THEN
    RAISE NOTICE '✅ RLS is enabled on clinic_admins';
  ELSE
    RAISE WARNING '⚠️  RLS is NOT enabled on clinic_admins';
  END IF;
END $$;
