-- ============================================================================
-- PATIENTS RLS POLICY FOR PRACTITIONERS
-- Allows practitioners to view patients who have appointments assigned to them
-- ============================================================================

-- Helper function: check if a patient has an appointment with the current practitioner
-- Uses SECURITY DEFINER to bypass RLS and avoid recursion
CREATE OR REPLACE FUNCTION public.patient_has_appointment_with_practitioner(check_patient_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM appointments a
    INNER JOIN practitioners p ON p.id = a.practitioner_id
    WHERE a.patient_id = check_patient_id
      AND p.auth_user_id = auth.uid()
      AND p.is_active = true
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.patient_has_appointment_with_practitioner(uuid) TO authenticated;

-- Practitioners can view patients who have appointments with them
CREATE POLICY "patients_practitioners_select"
ON public.patients
FOR SELECT
TO authenticated
USING (
  public.patient_has_appointment_with_practitioner(id)
);
