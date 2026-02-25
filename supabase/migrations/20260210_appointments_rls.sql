-- ============================================================================
-- APPOINTMENTS TABLE RLS POLICIES
-- Clinic admins can CRUD appointments for their own clinic
-- Patients can create appointments for themselves at any clinic
-- Patients can view/update/cancel their own appointments
-- ============================================================================

-- Enable RLS on appointments table
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "appointments_clinic_admins_select" ON public.appointments;
DROP POLICY IF EXISTS "appointments_clinic_admins_insert" ON public.appointments;
DROP POLICY IF EXISTS "appointments_clinic_admins_update" ON public.appointments;
DROP POLICY IF EXISTS "appointments_clinic_admins_delete" ON public.appointments;
DROP POLICY IF EXISTS "appointments_patients_select" ON public.appointments;
DROP POLICY IF EXISTS "appointments_patients_insert" ON public.appointments;
DROP POLICY IF EXISTS "appointments_patients_update" ON public.appointments;
DROP POLICY IF EXISTS "appointments_service_role_all" ON public.appointments;

-- ============================================================================
-- CLINIC ADMIN POLICIES
-- ============================================================================

-- Clinic admins can view all appointments for their clinic
CREATE POLICY "appointments_clinic_admins_select"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM clinic_admins ca 
    WHERE ca.auth_user_id = auth.uid()
      AND ca.clinic_id = appointments.clinic_id
      AND ca.is_active = true
  )
);

-- Clinic admins can create appointments for their clinic
CREATE POLICY "appointments_clinic_admins_insert"
ON public.appointments
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

-- Clinic admins can update appointments for their clinic
CREATE POLICY "appointments_clinic_admins_update"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM clinic_admins ca 
    WHERE ca.auth_user_id = auth.uid()
      AND ca.clinic_id = appointments.clinic_id
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

-- Clinic admins can delete appointments for their clinic
CREATE POLICY "appointments_clinic_admins_delete"
ON public.appointments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM clinic_admins ca 
    WHERE ca.auth_user_id = auth.uid()
      AND ca.clinic_id = appointments.clinic_id
      AND ca.is_active = true
  )
);

-- ============================================================================
-- PATIENT POLICIES
-- ============================================================================

-- Patients can view their own appointments
CREATE POLICY "appointments_patients_select"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT p.id 
    FROM patients p 
    WHERE p.auth_user_id = auth.uid()
  )
);

-- Patients can create appointments for themselves at any clinic
CREATE POLICY "appointments_patients_insert"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  -- The patient_id must belong to the authenticated user
  patient_id IN (
    SELECT p.id 
    FROM patients p 
    WHERE p.auth_user_id = auth.uid()
      AND p.is_active = true
  )
);

-- Patients can update (reschedule/cancel) their own appointments
-- They can only change: appointment_date, appointment_time, status, notes
CREATE POLICY "appointments_patients_update"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  patient_id IN (
    SELECT p.id 
    FROM patients p 
    WHERE p.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  patient_id IN (
    SELECT p.id 
    FROM patients p 
    WHERE p.auth_user_id = auth.uid()
  )
);

-- ============================================================================
-- PRACTITIONER POLICIES (for future use when practitioners have logins)
-- ============================================================================

-- Practitioners can view appointments assigned to them
CREATE POLICY "appointments_practitioners_select"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  practitioner_id IN (
    SELECT pr.id 
    FROM practitioners pr 
    WHERE pr.auth_user_id = auth.uid()
      AND pr.is_active = true
  )
);

-- ============================================================================
-- SERVICE ROLE POLICY
-- ============================================================================

-- Service role has full access (for API routes)
CREATE POLICY "appointments_service_role_all"
ON public.appointments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
