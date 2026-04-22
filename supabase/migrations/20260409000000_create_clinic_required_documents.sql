-- =============================================================================
-- Create clinic_required_documents table
-- Defines document types that clinics can require from patients
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.clinic_required_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  allowed_file_types TEXT,
  max_file_size_mb INTEGER NOT NULL DEFAULT 10,
  display_order INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinic_required_documents_clinic
  ON public.clinic_required_documents (clinic_id);

-- RLS
ALTER TABLE public.clinic_required_documents ENABLE ROW LEVEL SECURITY;

-- Clinic admins: full CRUD on their clinic's document types
CREATE POLICY "clinic_required_documents_clinic_admins_all" ON public.clinic_required_documents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_admins ca
      WHERE ca.auth_user_id = auth.uid()
        AND ca.clinic_id = clinic_required_documents.clinic_id
        AND ca.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clinic_admins ca
      WHERE ca.auth_user_id = auth.uid()
        AND ca.clinic_id = clinic_required_documents.clinic_id
        AND ca.is_active = true
    )
  );

-- Practitioners: read document types for their clinic
CREATE POLICY "clinic_required_documents_practitioners_select" ON public.clinic_required_documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.practitioners p
      WHERE p.auth_user_id = auth.uid()
        AND p.clinic_id = clinic_required_documents.clinic_id
        AND p.is_active = true
    )
  );

-- Patients: read active document types for clinics they belong to
CREATE POLICY "clinic_required_documents_patients_select" ON public.clinic_required_documents
  FOR SELECT TO authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.patient_clinics pc
      JOIN public.patients p ON p.id = pc.patient_id
      WHERE p.auth_user_id = auth.uid()
        AND pc.clinic_id = clinic_required_documents.clinic_id
    )
  );

-- Service role: full access
CREATE POLICY "clinic_required_documents_service_role_all" ON public.clinic_required_documents
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
