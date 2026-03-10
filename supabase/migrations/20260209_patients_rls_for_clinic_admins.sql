-- ============================================================================
-- PATIENTS RLS POLICIES FOR CLINIC ADMINS
-- Allows clinic admins to create and manage patients for their clinic
-- ============================================================================

-- Enable RLS on patients table (if not already enabled)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "patients_clinic_admins_select" ON public.patients;
DROP POLICY IF EXISTS "patients_clinic_admins_insert" ON public.patients;
DROP POLICY IF EXISTS "patients_clinic_admins_update" ON public.patients;

-- ============================================================================
-- SELECT POLICIES
-- ============================================================================

-- Clinic admins can view patients who have appointments at their clinic
-- OR patients that were created by their clinic (clinic_id matches)
CREATE POLICY "patients_clinic_admins_select"
ON public.patients
FOR SELECT
TO authenticated
USING (
  -- Patient has an appointment at the clinic
  id IN (
    SELECT DISTINCT a.patient_id 
    FROM appointments a
    JOIN clinic_admins ca ON a.clinic_id = ca.clinic_id
    WHERE ca.auth_user_id = auth.uid()
  )
  OR
  -- Patient was created by this clinic (if clinic_id column exists)
  -- For now, we allow viewing patients with appointments
  EXISTS (
    SELECT 1 
    FROM clinic_admins ca 
    WHERE ca.auth_user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM appointments a 
        WHERE a.patient_id = patients.id 
        AND a.clinic_id = ca.clinic_id
      )
  )
);

-- ============================================================================
-- INSERT POLICIES
-- ============================================================================

-- Clinic admins can create new patients
-- The patient will be linked to the clinic via appointments
CREATE POLICY "patients_clinic_admins_insert"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be a clinic admin
  EXISTS (
    SELECT 1 
    FROM clinic_admins ca 
    WHERE ca.auth_user_id = auth.uid()
      AND ca.is_active = true
  )
  -- auth_user_id should be NULL for clinic-created patients (they'll set it up later)
  AND (auth_user_id IS NULL)
);

-- ============================================================================
-- UPDATE POLICIES
-- ============================================================================

-- Clinic admins can update patients who have appointments at their clinic
CREATE POLICY "patients_clinic_admins_update"
ON public.patients
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT DISTINCT a.patient_id 
    FROM appointments a
    JOIN clinic_admins ca ON a.clinic_id = ca.clinic_id
    WHERE ca.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT DISTINCT a.patient_id 
    FROM appointments a
    JOIN clinic_admins ca ON a.clinic_id = ca.clinic_id
    WHERE ca.auth_user_id = auth.uid()
  )
);

-- ============================================================================
-- Ensure patients can still manage their own data
-- ============================================================================

-- Drop and recreate patient self-management policies to ensure they exist
DROP POLICY IF EXISTS "patients_own_select" ON public.patients;
CREATE POLICY "patients_own_select"
ON public.patients
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "patients_own_update" ON public.patients;
CREATE POLICY "patients_own_update"
ON public.patients
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Service role has full access
DROP POLICY IF EXISTS "patients_service_role_all" ON public.patients;
CREATE POLICY "patients_service_role_all"
ON public.patients
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
