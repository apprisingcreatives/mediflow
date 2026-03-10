-- Enable RLS on appointments table
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "appointments_select_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_policy" ON public.appointments;

-- ============================================================================
-- SELECT POLICIES
-- ============================================================================

-- Policy: Service role can read all appointments
DROP POLICY IF EXISTS "appointments_service_role_all" ON public.appointments;
CREATE POLICY "appointments_service_role_all"
ON public.appointments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Patients can read their own appointments
DROP POLICY IF EXISTS "appointments_patients_read_own" ON public.appointments;
CREATE POLICY "appointments_patients_read_own"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT id 
    FROM patients 
    WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Clinic admins can read appointments for their clinic
DROP POLICY IF EXISTS "appointments_clinic_admins_read" ON public.appointments;
CREATE POLICY "appointments_clinic_admins_read"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id 
    FROM clinic_admins 
    WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Practitioners can read appointments assigned to them
DROP POLICY IF EXISTS "appointments_practitioners_read_own" ON public.appointments;
CREATE POLICY "appointments_practitioners_read_own"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  practitioner_id IN (
    SELECT id 
    FROM practitioners 
    WHERE auth_user_id = auth.uid()
  )
);

-- ============================================================================
-- INSERT POLICIES
-- ============================================================================

-- Policy: Authenticated users can create appointments for themselves as patients
DROP POLICY IF EXISTS "appointments_patients_insert_own" ON public.appointments;
CREATE POLICY "appointments_patients_insert_own"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  patient_id IN (
    SELECT id 
    FROM patients 
    WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Clinic admins can create appointments for their clinic
DROP POLICY IF EXISTS "appointments_clinic_admins_insert" ON public.appointments;
CREATE POLICY "appointments_clinic_admins_insert"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id 
    FROM clinic_admins 
    WHERE auth_user_id = auth.uid()
  )
);

-- ============================================================================
-- UPDATE POLICIES
-- ============================================================================

-- Policy: Patients can update their own appointments (limited fields)
-- Note: This should be more restrictive - patients typically can only cancel
DROP POLICY IF EXISTS "appointments_patients_update_own" ON public.appointments;
CREATE POLICY "appointments_patients_update_own"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  patient_id IN (
    SELECT id 
    FROM patients 
    WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  patient_id IN (
    SELECT id 
    FROM patients 
    WHERE auth_user_id = auth.uid()
  )
  -- Patient can only update status to 'cancelled'
  AND (status = 'cancelled' OR status = OLD.status)
);

-- Policy: Clinic admins can update appointments for their clinic
DROP POLICY IF EXISTS "appointments_clinic_admins_update" ON public.appointments;
CREATE POLICY "appointments_clinic_admins_update"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id 
    FROM clinic_admins 
    WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id 
    FROM clinic_admins 
    WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Practitioners can update their own appointments
DROP POLICY IF EXISTS "appointments_practitioners_update_own" ON public.appointments;
CREATE POLICY "appointments_practitioners_update_own"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  practitioner_id IN (
    SELECT id 
    FROM practitioners 
    WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  practitioner_id IN (
    SELECT id 
    FROM practitioners 
    WHERE auth_user_id = auth.uid()
  )
);

-- ============================================================================
-- DELETE POLICIES
-- ============================================================================

-- Policy: Clinic admins can delete appointments for their clinic
DROP POLICY IF EXISTS "appointments_clinic_admins_delete" ON public.appointments;
CREATE POLICY "appointments_clinic_admins_delete"
ON public.appointments
FOR DELETE
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id 
    FROM clinic_admins 
    WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Super admins can delete any appointment
DROP POLICY IF EXISTS "appointments_super_admins_delete" ON public.appointments;
CREATE POLICY "appointments_super_admins_delete"
ON public.appointments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM super_admins 
    WHERE auth_user_id = auth.uid()
  )
);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT ON public.appointments TO authenticated;
GRANT UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;

-- ============================================================================
-- HELPFUL QUERIES FOR TESTING
-- ============================================================================

-- Test query: Check if current user can read appointments
-- SELECT * FROM appointments WHERE patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid());

-- Test query: Check if current user is a clinic admin
-- SELECT clinic_id FROM clinic_admins WHERE auth_user_id = auth.uid();

-- Test query: Verify RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'appointments';
