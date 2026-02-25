-- ============================================================================
-- PRACTITIONERS TABLE - ADD AUTH AND RLS POLICIES
-- 1. Add auth_user_id column for practitioner logins
-- 2. Add is_active column if not exists
-- 3. Create RLS policies for clinic admins
-- ============================================================================

-- ============================================================================
-- SCHEMA CHANGES
-- ============================================================================

-- Add auth_user_id column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'practitioners' 
    AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE public.practitioners 
    ADD COLUMN auth_user_id UUID UNIQUE REFERENCES auth.users(id);
  END IF;
END $$;

-- Add role column for practitioner role type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'practitioners' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.practitioners 
    ADD COLUMN role TEXT DEFAULT 'practitioner';
  END IF;
END $$;

-- Create index on auth_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_practitioners_auth_user 
ON public.practitioners(auth_user_id);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE public.practitioners ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "practitioners_clinic_admins_select" ON public.practitioners;
DROP POLICY IF EXISTS "practitioners_clinic_admins_insert" ON public.practitioners;
DROP POLICY IF EXISTS "practitioners_clinic_admins_update" ON public.practitioners;
DROP POLICY IF EXISTS "practitioners_clinic_admins_delete" ON public.practitioners;
DROP POLICY IF EXISTS "practitioners_own_select" ON public.practitioners;
DROP POLICY IF EXISTS "practitioners_own_update" ON public.practitioners;
DROP POLICY IF EXISTS "practitioners_public_select" ON public.practitioners;
DROP POLICY IF EXISTS "practitioners_service_role_all" ON public.practitioners;

-- ============================================================================
-- CLINIC ADMIN POLICIES
-- ============================================================================

-- Clinic admins can view all practitioners in their clinic
CREATE POLICY "practitioners_clinic_admins_select"
ON public.practitioners
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM clinic_admins ca 
    WHERE ca.auth_user_id = auth.uid()
      AND ca.clinic_id = practitioners.clinic_id
      AND ca.is_active = true
  )
);

-- Clinic admins can create practitioners for their clinic
CREATE POLICY "practitioners_clinic_admins_insert"
ON public.practitioners
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM clinic_admins ca 
    WHERE ca.auth_user_id = auth.uid()
      AND ca.clinic_id = clinic_id
      AND ca.is_active = true
  )
);

-- Clinic admins can update practitioners in their clinic
CREATE POLICY "practitioners_clinic_admins_update"
ON public.practitioners
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM clinic_admins ca 
    WHERE ca.auth_user_id = auth.uid()
      AND ca.clinic_id = practitioners.clinic_id
      AND ca.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM clinic_admins ca 
    WHERE ca.auth_user_id = auth.uid()
      AND ca.clinic_id = clinic_id
      AND ca.is_active = true
  )
);

-- Clinic admins can delete practitioners in their clinic
CREATE POLICY "practitioners_clinic_admins_delete"
ON public.practitioners
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM clinic_admins ca 
    WHERE ca.auth_user_id = auth.uid()
      AND ca.clinic_id = practitioners.clinic_id
      AND ca.is_active = true
  )
);

-- ============================================================================
-- PRACTITIONER SELF-MANAGEMENT POLICIES
-- ============================================================================

-- Practitioners can view their own record
CREATE POLICY "practitioners_own_select"
ON public.practitioners
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Practitioners can update their own non-critical fields (bio, image, etc.)
CREATE POLICY "practitioners_own_update"
ON public.practitioners
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- ============================================================================
-- PUBLIC ACCESS POLICIES
-- ============================================================================

-- Anyone can view active practitioners (for public clinic pages)
CREATE POLICY "practitioners_public_select"
ON public.practitioners
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- ============================================================================
-- SERVICE ROLE POLICY
-- ============================================================================

CREATE POLICY "practitioners_service_role_all"
ON public.practitioners
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON public.practitioners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practitioners TO authenticated;
GRANT ALL ON public.practitioners TO service_role;
