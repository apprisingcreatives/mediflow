-- Enable RLS on clinic_ai_features table
ALTER TABLE public.clinic_ai_features ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "clinic_ai_features_select_policy" ON public.clinic_ai_features;
DROP POLICY IF EXISTS "clinic_ai_features_insert_policy" ON public.clinic_ai_features;
DROP POLICY IF EXISTS "clinic_ai_features_update_policy" ON public.clinic_ai_features;
DROP POLICY IF EXISTS "clinic_ai_features_delete_policy" ON public.clinic_ai_features;

-- Policy: Allow service role to do anything (for API routes using supabaseAdmin)
DROP POLICY IF EXISTS "clinic_ai_features_service_role_all" ON public.clinic_ai_features;
CREATE POLICY "clinic_ai_features_service_role_all"
ON public.clinic_ai_features
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to read clinic_ai_features for their clinic only
-- This requires that the user has a way to prove they belong to a clinic
-- Option 1: If you have a clinic_admins table that links users to clinics
DROP POLICY IF EXISTS "clinic_ai_features_read_own_clinic" ON public.clinic_ai_features;
CREATE POLICY "clinic_ai_features_read_own_clinic"
ON public.clinic_ai_features
FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id 
    FROM clinic_admins 
    WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Super admins can read all clinic_ai_features
DROP POLICY IF EXISTS "clinic_ai_features_super_admin_read" ON public.clinic_ai_features;
CREATE POLICY "clinic_ai_features_super_admin_read"
ON public.clinic_ai_features
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM super_admins 
    WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Super admins can update clinic_ai_features
DROP POLICY IF EXISTS "clinic_ai_features_super_admin_update" ON public.clinic_ai_features;
CREATE POLICY "clinic_ai_features_super_admin_update"
ON public.clinic_ai_features
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

-- Enable RLS on ai_features table (read-only for most users)
ALTER TABLE public.ai_features ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do anything
DROP POLICY IF EXISTS "ai_features_service_role_all" ON public.ai_features;
CREATE POLICY "ai_features_service_role_all"
ON public.ai_features
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to read all ai_features
DROP POLICY IF EXISTS "ai_features_read_all" ON public.ai_features;
CREATE POLICY "ai_features_read_all"
ON public.ai_features
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow anon users to read all ai_features (for public-facing features list)
DROP POLICY IF EXISTS "ai_features_anon_read_all" ON public.ai_features;
CREATE POLICY "ai_features_anon_read_all"
ON public.ai_features
FOR SELECT
TO anon
USING (true);

-- Grant necessary permissions
GRANT SELECT ON public.clinic_ai_features TO authenticated;
GRANT SELECT ON public.ai_features TO authenticated, anon;
GRANT ALL ON public.clinic_ai_features TO service_role;
GRANT ALL ON public.ai_features TO service_role;
