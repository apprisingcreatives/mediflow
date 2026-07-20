-- =============================================================================
-- Super Admin Write Policies for Clinics and Clinic Services
-- Allows super admins with status 'active' to manage clinics and their services
-- =============================================================================

-- Helper function: Check if current user is an active super admin
CREATE OR REPLACE FUNCTION public.is_active_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.super_admins
    WHERE auth_user_id = auth.uid()
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- CLINICS — Super Admin Policies
-- =============================================================================

-- INSERT
CREATE POLICY "super_admin_clinics_insert"
  ON public.clinics
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_super_admin());

-- UPDATE
CREATE POLICY "super_admin_clinics_update"
  ON public.clinics
  FOR UPDATE
  TO authenticated
  USING (public.is_active_super_admin())
  WITH CHECK (public.is_active_super_admin());

-- DELETE
CREATE POLICY "super_admin_clinics_delete"
  ON public.clinics
  FOR DELETE
  TO authenticated
  USING (public.is_active_super_admin());

-- SELECT (super admins can see ALL clinics, including inactive)
CREATE POLICY "super_admin_clinics_select_all"
  ON public.clinics
  FOR SELECT
  TO authenticated
  USING (public.is_active_super_admin());

-- =============================================================================
-- CLINIC_SERVICES — Super Admin Policies
-- =============================================================================

-- INSERT
CREATE POLICY "super_admin_clinic_services_insert"
  ON public.clinic_services
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_super_admin());

-- UPDATE
CREATE POLICY "super_admin_clinic_services_update"
  ON public.clinic_services
  FOR UPDATE
  TO authenticated
  USING (public.is_active_super_admin())
  WITH CHECK (public.is_active_super_admin());

-- DELETE
CREATE POLICY "super_admin_clinic_services_delete"
  ON public.clinic_services
  FOR DELETE
  TO authenticated
  USING (public.is_active_super_admin());
