-- Create the private storage bucket for patient documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the patient-documents bucket

-- Patients can upload files to their own folder
CREATE POLICY "patients_upload_own_documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'patient-documents'
  AND (storage.foldername(name))[1] = (
    SELECT id::text FROM public.patients WHERE auth_user_id = auth.uid()
  )
);

-- Patients can read their own files
CREATE POLICY "patients_read_own_documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'patient-documents'
  AND (storage.foldername(name))[1] = (
    SELECT id::text FROM public.patients WHERE auth_user_id = auth.uid()
  )
);

-- Patients can delete their own files
CREATE POLICY "patients_delete_own_documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'patient-documents'
  AND (storage.foldername(name))[1] = (
    SELECT id::text FROM public.patients WHERE auth_user_id = auth.uid()
  )
);

-- Clinic admins can read documents of patients at their clinic
CREATE POLICY "clinic_admins_read_patient_documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'patient-documents'
  AND EXISTS (
    SELECT 1 FROM public.clinic_admins ca
    JOIN public.patient_clinics pc ON pc.clinic_id = ca.clinic_id
    WHERE ca.auth_user_id = auth.uid()
      AND ca.is_active = true
      AND pc.patient_id::text = (storage.foldername(name))[1]
  )
);

-- Practitioners can read documents of patients at their clinic
CREATE POLICY "practitioners_read_patient_documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'patient-documents'
  AND EXISTS (
    SELECT 1 FROM public.practitioners p
    JOIN public.patient_clinics pc ON pc.clinic_id = p.clinic_id
    WHERE p.auth_user_id = auth.uid()
      AND p.is_active = true
      AND pc.patient_id::text = (storage.foldername(name))[1]
  )
);

-- Service role has full access (used by API routes via supabaseAdmin)
CREATE POLICY "service_role_full_access_patient_documents"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'patient-documents')
WITH CHECK (bucket_id = 'patient-documents');
