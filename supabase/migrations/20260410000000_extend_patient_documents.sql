-- =============================================================================
-- Extend patient_documents: clinic scoping, verification workflow, file metadata
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Section 1: Add new columns
-- -----------------------------------------------------------------------------

-- Make file_url nullable since new uploads use file_path instead
ALTER TABLE public.patient_documents
  ALTER COLUMN file_url DROP NOT NULL;

ALTER TABLE public.patient_documents
  -- Clinic scoping: ties the document to a specific clinic context
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id),

  -- Links to a clinic-defined required document type
  ADD COLUMN IF NOT EXISTS document_type_id UUID REFERENCES public.clinic_required_documents(id),

  -- File storage metadata
  ADD COLUMN IF NOT EXISTS file_path      TEXT,
  ADD COLUMN IF NOT EXISTS mime_type      TEXT,
  ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,

  -- Verification workflow: tracks the review state of the document
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Who reviewed the document and when
  ADD COLUMN IF NOT EXISTS verified_by   UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS verified_at   TIMESTAMPTZ,

  -- Populated when status = 'rejected'
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,

  -- Mutation timestamp (not present on the original table)
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

COMMENT ON COLUMN public.patient_documents.clinic_id IS
  'Scopes the document to the clinic that requested or received it.';
COMMENT ON COLUMN public.patient_documents.document_type_id IS
  'References the clinic-defined required-document type this upload satisfies.';
COMMENT ON COLUMN public.patient_documents.file_path IS
  'Storage bucket object path used to construct signed URLs server-side.';
COMMENT ON COLUMN public.patient_documents.mime_type IS
  'MIME type reported at upload time (e.g. application/pdf, image/jpeg).';
COMMENT ON COLUMN public.patient_documents.file_size_bytes IS
  'File size in bytes; stored as BIGINT to handle files larger than 2 GB.';
COMMENT ON COLUMN public.patient_documents.status IS
  'Verification state: pending (awaiting review), approved, or rejected.';
COMMENT ON COLUMN public.patient_documents.verified_by IS
  'auth.users.id of the clinic admin or practitioner who reviewed the document.';
COMMENT ON COLUMN public.patient_documents.rejection_reason IS
  'Human-readable explanation provided when a document is rejected.';


-- -----------------------------------------------------------------------------
-- Section 2: Indexes
-- -----------------------------------------------------------------------------

-- Clinic-scoped queries (clinic admin / practitioner dashboards)
CREATE INDEX IF NOT EXISTS idx_patient_documents_clinic
  ON public.patient_documents (clinic_id);

-- Filtering by verification status (e.g. "show me all pending documents")
CREATE INDEX IF NOT EXISTS idx_patient_documents_status
  ON public.patient_documents (status);


-- -----------------------------------------------------------------------------
-- Section 3: Drop superseded clinic admin policies
--
-- The original policies joined through patient_clinics to determine clinic
-- membership. Now that clinic_id is a first-class column on the table, we
-- replace them with simpler, direct-column checks.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "patient_documents_clinic_admins_select" ON public.patient_documents;
DROP POLICY IF EXISTS "patient_documents_clinic_admins_insert"  ON public.patient_documents;
DROP POLICY IF EXISTS "patient_documents_clinic_admins_update"  ON public.patient_documents;


-- -----------------------------------------------------------------------------
-- Section 4: New RLS policies
-- -----------------------------------------------------------------------------

-- ---- Clinic admins ----
-- A clinic admin may read documents of patients who belong to their clinic.
CREATE POLICY "patient_documents_clinic_admins_select" ON public.patient_documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_admins ca
      JOIN public.patient_clinics pc ON pc.clinic_id = ca.clinic_id
      WHERE ca.auth_user_id = auth.uid()
        AND pc.patient_id   = patient_documents.patient_id
        AND ca.is_active    = true
    )
  );

-- A clinic admin may update (approve/reject) documents for their patients.
CREATE POLICY "patient_documents_clinic_admins_update" ON public.patient_documents
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_admins ca
      JOIN public.patient_clinics pc ON pc.clinic_id = ca.clinic_id
      WHERE ca.auth_user_id = auth.uid()
        AND pc.patient_id   = patient_documents.patient_id
        AND ca.is_active    = true
    )
  );

-- ---- Practitioners ----
-- Practitioners may read documents of patients who belong to their clinic.
CREATE POLICY "patient_documents_practitioners_select" ON public.patient_documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.practitioners p
      JOIN public.patient_clinics pc ON pc.clinic_id = p.clinic_id
      WHERE p.auth_user_id = auth.uid()
        AND pc.patient_id  = patient_documents.patient_id
        AND p.is_active    = true
    )
  );

-- Practitioners may update (approve/reject) documents for their patients.
CREATE POLICY "patient_documents_practitioners_update" ON public.patient_documents
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.practitioners p
      JOIN public.patient_clinics pc ON pc.clinic_id = p.clinic_id
      WHERE p.auth_user_id = auth.uid()
        AND pc.patient_id  = patient_documents.patient_id
        AND p.is_active    = true
    )
  );

-- ---- Patients ----
-- Patients may upload their own documents.
CREATE POLICY "patient_documents_patients_insert" ON public.patient_documents
  FOR INSERT TO authenticated
  WITH CHECK (patient_id = get_patient_id_for_user());

-- Patients may delete their own documents only while they are still pending
-- review (prevents deletion after a clinic has already acted on the document).
CREATE POLICY "patient_documents_patients_delete" ON public.patient_documents
  FOR DELETE TO authenticated
  USING (
    patient_id = get_patient_id_for_user()
    AND status = 'pending'
  );
