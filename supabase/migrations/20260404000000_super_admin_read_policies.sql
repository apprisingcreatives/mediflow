-- =============================================================================
-- Super Admin Read Policies
-- Allow super admins to read data needed for dashboard and onboarding
-- =============================================================================

-- clinic_admins
CREATE POLICY "clinic_admins_super_admin_select" ON public.clinic_admins
  FOR SELECT TO authenticated USING (is_active_super_admin());

-- clinic_services
CREATE POLICY "clinic_services_super_admin_select" ON public.clinic_services
  FOR SELECT TO authenticated USING (is_active_super_admin());

-- practitioners
CREATE POLICY "practitioners_super_admin_select" ON public.practitioners
  FOR SELECT TO authenticated USING (is_active_super_admin());

-- practitioner_working_hours
CREATE POLICY "practitioner_working_hours_super_admin_select" ON public.practitioner_working_hours
  FOR SELECT TO authenticated USING (is_active_super_admin());

-- patient_clinics
CREATE POLICY "patient_clinics_super_admin_select" ON public.patient_clinics
  FOR SELECT TO authenticated USING (is_active_super_admin());

-- patients
CREATE POLICY "patients_super_admin_select" ON public.patients
  FOR SELECT TO authenticated USING (is_active_super_admin());

-- clinics (select - super admins may not have a read policy yet)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clinics' AND policyname = 'clinics_super_admin_select'
  ) THEN
    CREATE POLICY "clinics_super_admin_select" ON public.clinics
      FOR SELECT TO authenticated USING (is_active_super_admin());
  END IF;
END $$;
