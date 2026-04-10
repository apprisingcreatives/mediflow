-- Allow practitioners to read patient_clinics rows for their own clinic.
-- Without this policy, any RLS subquery that joins through patient_clinics
-- (e.g. patient_documents_practitioners_select) silently returns zero rows.
CREATE POLICY "patient_clinics_practitioners_select" ON public.patient_clinics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.practitioners p
      WHERE p.auth_user_id = auth.uid()
        AND p.clinic_id = patient_clinics.clinic_id
        AND p.is_active = true
    )
  );
