-- Migrate clinic_admins to use Supabase Auth
-- This migration removes password_hash and ensures auth_user_id is the primary auth method

-- ============================================================================
-- 1. Add auth_user_id column if it doesn't exist
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clinic_admins' 
    AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE public.clinic_admins 
    ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_clinic_admins_auth_user_id 
    ON public.clinic_admins(auth_user_id);
  END IF;
END $$;

-- ============================================================================
-- 2. Make auth_user_id NOT NULL (after ensuring all records have it)
-- ============================================================================
-- Note: Only run this after migrating existing records
-- ALTER TABLE public.clinic_admins ALTER COLUMN auth_user_id SET NOT NULL;

-- ============================================================================
-- 3. Add unique constraint on auth_user_id
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'clinic_admins_auth_user_id_key'
  ) THEN
    ALTER TABLE public.clinic_admins 
    ADD CONSTRAINT clinic_admins_auth_user_id_key UNIQUE (auth_user_id);
  END IF;
END $$;

-- ============================================================================
-- 4. Drop password_hash column (if it exists)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clinic_admins' 
    AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE public.clinic_admins DROP COLUMN password_hash;
  END IF;
END $$;

-- ============================================================================
-- 5. Update clinic_admins table structure (if needed)
-- ============================================================================

-- Ensure email is unique (if not already)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'clinic_admins_email_key'
  ) THEN
    ALTER TABLE public.clinic_admins 
    ADD CONSTRAINT clinic_admins_email_key UNIQUE (email);
  END IF;
END $$;

-- ============================================================================
-- 6. Add is_active column if it doesn't exist
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clinic_admins' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.clinic_admins 
    ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- 7. RLS Policies for clinic_admins
-- ============================================================================

-- Enable RLS
ALTER TABLE public.clinic_admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "clinic_admins_select_own" ON public.clinic_admins;
DROP POLICY IF EXISTS "clinic_admins_update_own" ON public.clinic_admins;
DROP POLICY IF EXISTS "clinic_admins_super_admin_all" ON public.clinic_admins;
DROP POLICY IF EXISTS "clinic_admins_service_role_all" ON public.clinic_admins;

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
WITH CHECK (
  auth_user_id = auth.uid()
  -- Prevent changing critical fields
  AND clinic_id = OLD.clinic_id
  AND email = OLD.email
  AND auth_user_id = OLD.auth_user_id
);

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
-- 8. Grant permissions
-- ============================================================================
GRANT SELECT, UPDATE ON public.clinic_admins TO authenticated;
GRANT ALL ON public.clinic_admins TO service_role;

-- ============================================================================
-- 9. MIGRATION HELPER QUERY (Run this separately if needed)
-- ============================================================================

-- If you have existing clinic_admins with password_hash but no auth_user_id,
-- you'll need to create auth users for them. Here's a template:

/*
-- Example: Create auth user for existing admin
DO $$
DECLARE
  admin_record RECORD;
  new_auth_user_id UUID;
BEGIN
  FOR admin_record IN 
    SELECT id, email, name, clinic_id 
    FROM clinic_admins 
    WHERE auth_user_id IS NULL
  LOOP
    -- Note: This requires manual password reset link generation
    -- You cannot migrate password_hash to Supabase Auth
    -- Admins will need to reset their passwords
    
    -- Create auth user (you'll need to use the Supabase Admin API for this)
    -- This is just a placeholder showing the structure
    RAISE NOTICE 'Admin % needs auth user created', admin_record.email;
  END LOOP;
END $$;
*/

-- ============================================================================
-- 10. Verification Queries
-- ============================================================================

-- Check that all clinic_admins have auth_user_id
-- SELECT id, email, name, auth_user_id 
-- FROM clinic_admins 
-- WHERE auth_user_id IS NULL;

-- Check that auth_user_id references valid auth users
-- SELECT ca.id, ca.email, ca.auth_user_id, au.email as auth_email
-- FROM clinic_admins ca
-- LEFT JOIN auth.users au ON ca.auth_user_id = au.id
-- WHERE au.id IS NULL;

-- Verify RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename = 'clinic_admins';

-- ============================================================================
-- NOTES
-- ============================================================================

-- IMPORTANT: If you have existing clinic admins with password_hash:
-- 1. They will need to reset their passwords using Supabase Auth
-- 2. Send them password reset links via: supabaseAdmin.auth.resetPasswordForEmail()
-- 3. Or recreate their accounts using the updated registration endpoint

-- The password_hash column is dropped because Supabase Auth manages passwords
-- Old password hashes cannot be migrated to Supabase Auth
