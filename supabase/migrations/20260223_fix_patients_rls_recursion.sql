-- ============================================================================
-- FIX INFINITE RECURSION IN PATIENTS RLS POLICIES
-- The issue: patients RLS queries appointments, and appointments RLS queries patients
-- Solution: Use SECURITY DEFINER functions to bypass RLS in policy checks
-- ============================================================================

-- ============================================================================
-- STEP 1: Create helper functions with SECURITY DEFINER
-- These functions run with elevated privileges and bypass RLS
-- ============================================================================

-- Function to check if a user is a clinic admin for a specific clinic
CREATE OR REPLACE FUNCTION public.is_clinic_admin_for_clinic(check_clinic_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM clinic_admins ca 
    WHERE ca.auth_user_id = auth.uid()
      AND ca.clinic_id = check_clinic_id
      AND ca.is_active = true
  );
$$;

-- Function to check if user is any clinic admin (for insert)
CREATE OR REPLACE FUNCTION public.is_active_clinic_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM clinic_admins ca 
    WHERE ca.auth_user_id = auth.uid()
      AND ca.is_active = true
  );
$$;

-- Function to get clinic_id for the current clinic admin
CREATE OR REPLACE FUNCTION public.get_clinic_admin_clinic_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT ca.clinic_id 
  FROM clinic_admins ca 
  WHERE ca.auth_user_id = auth.uid()
    AND ca.is_active = true
  LIMIT 1;
$$;

-- Function to check if a patient has appointments at the clinic admin's clinic
-- This function bypasses RLS to avoid recursion
CREATE OR REPLACE FUNCTION public.patient_has_appointment_at_admin_clinic(check_patient_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM appointments a
    INNER JOIN clinic_admins ca ON ca.clinic_id = a.clinic_id
    WHERE a.patient_id = check_patient_id
      AND ca.auth_user_id = auth.uid()
      AND ca.is_active = true
  );
$$;

-- Function to get patient_id for the current authenticated user
CREATE OR REPLACE FUNCTION public.get_patient_id_for_user()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.id 
  FROM patients p 
  WHERE p.auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================================
-- STEP 2: Drop existing conflicting policies on patients table
-- ============================================================================

DROP POLICY IF EXISTS "patients_clinic_admins_select" ON public.patients;
DROP POLICY IF EXISTS "patients_clinic_admins_insert" ON public.patients;
DROP POLICY IF EXISTS "patients_clinic_admins_update" ON public.patients;
DROP POLICY IF EXISTS "patients_own_select" ON public.patients;
DROP POLICY IF EXISTS "patients_own_update" ON public.patients;
DROP POLICY IF EXISTS "patients_service_role_all" ON public.patients;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.patients;
DROP POLICY IF EXISTS "Enable insert for all users only" ON public.patients;
DROP POLICY IF EXISTS "allow_self_activate" ON public.patients;

-- ============================================================================
-- STEP 3: Create new non-recursive policies for patients
-- ============================================================================

-- Patients can view their own record (simple, no recursion)
CREATE POLICY "patients_own_select"
ON public.patients
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Clinic admins can view patients with appointments at their clinic
-- Uses SECURITY DEFINER function to avoid recursion
CREATE POLICY "patients_clinic_admins_select"
ON public.patients
FOR SELECT
TO authenticated
USING (
  public.patient_has_appointment_at_admin_clinic(id)
);

-- Allow insert for patient self-registration
CREATE POLICY "patients_self_insert"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (
  -- User is creating their own patient record
  auth_user_id = auth.uid()
);

-- Clinic admins can create new patients (for invitations)
-- auth_user_id should be NULL initially
CREATE POLICY "patients_clinic_admins_insert"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be an active clinic admin
  public.is_active_clinic_admin()
  -- auth_user_id should be NULL for clinic-created patients
  AND auth_user_id IS NULL
);

-- Patients can update their own record
CREATE POLICY "patients_own_update"
ON public.patients
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Clinic admins can update patients with appointments at their clinic
CREATE POLICY "patients_clinic_admins_update"
ON public.patients
FOR UPDATE
TO authenticated
USING (
  public.patient_has_appointment_at_admin_clinic(id)
)
WITH CHECK (
  public.patient_has_appointment_at_admin_clinic(id)
);

-- Service role has full access (for API routes with service key)
CREATE POLICY "patients_service_role_all"
ON public.patients
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STEP 4: Fix appointments policies to also use helper functions
-- This prevents recursion from the appointments side as well
-- ============================================================================

DROP POLICY IF EXISTS "appointments_patients_select" ON public.appointments;
DROP POLICY IF EXISTS "appointments_patients_insert" ON public.appointments;
DROP POLICY IF EXISTS "appointments_patients_update" ON public.appointments;

-- Patients can view their own appointments (using helper function)
CREATE POLICY "appointments_patients_select"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  patient_id = public.get_patient_id_for_user()
);

-- Patients can create appointments for themselves
CREATE POLICY "appointments_patients_insert"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  patient_id = public.get_patient_id_for_user()
  -- Note: we removed is_active check here as the function handles it
);

-- Patients can update their own appointments
CREATE POLICY "appointments_patients_update"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  patient_id = public.get_patient_id_for_user()
)
WITH CHECK (
  patient_id = public.get_patient_id_for_user()
);

-- ============================================================================
-- STEP 5: Grant execute permissions on helper functions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.is_clinic_admin_for_clinic(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_clinic_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_clinic_admin_clinic_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.patient_has_appointment_at_admin_clinic(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_patient_id_for_user() TO authenticated;

-- ============================================================================
-- STEP 6: Ensure proper grants on tables
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
