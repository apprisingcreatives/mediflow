-- Remove unused columns from patient_documents
-- The approve/reject workflow has been removed; documents are simply uploaded and viewed.

-- Drop RLS policies that reference removed columns
DROP POLICY IF EXISTS "patient_documents_patients_delete" ON public.patient_documents;
DROP POLICY IF EXISTS "patient_documents_clinic_admins_update" ON public.patient_documents;
DROP POLICY IF EXISTS "patient_documents_practitioners_update" ON public.patient_documents;

-- Drop indexes on removed columns
DROP INDEX IF EXISTS idx_patient_documents_clinic;
DROP INDEX IF EXISTS idx_patient_documents_status;

-- Drop columns
ALTER TABLE public.patient_documents
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS verified_by,
  DROP COLUMN IF EXISTS verified_at,
  DROP COLUMN IF EXISTS rejection_reason,
  DROP COLUMN IF EXISTS document_type_id,
  DROP COLUMN IF EXISTS clinic_id;

-- Recreate patient delete policy without status check
CREATE POLICY "patient_documents_patients_delete" ON public.patient_documents
  FOR DELETE TO authenticated
  USING (patient_id = get_patient_id_for_user());
