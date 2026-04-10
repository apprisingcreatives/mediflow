-- =============================================================================
-- Create clinic_onboarding_questions table
-- Stores clinic-defined health questions for patient onboarding
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.clinic_onboarding_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('text', 'textarea', 'select', 'multiselect', 'yesno', 'number', 'date')),
  options JSONB,
  is_required BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_clinic_onboarding_questions_clinic_id
  ON public.clinic_onboarding_questions (clinic_id);
CREATE INDEX idx_clinic_onboarding_questions_clinic_active
  ON public.clinic_onboarding_questions (clinic_id, is_active);

-- Enable RLS
ALTER TABLE public.clinic_onboarding_questions ENABLE ROW LEVEL SECURITY;

-- Clinic admins: full CRUD
CREATE POLICY "clinic_onboarding_questions_clinic_admins_select"
  ON public.clinic_onboarding_questions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_admins ca
      WHERE ca.auth_user_id = auth.uid()
        AND ca.clinic_id = clinic_onboarding_questions.clinic_id
        AND ca.is_active = true
    )
  );

CREATE POLICY "clinic_onboarding_questions_clinic_admins_insert"
  ON public.clinic_onboarding_questions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clinic_admins ca
      WHERE ca.auth_user_id = auth.uid()
        AND ca.clinic_id = clinic_onboarding_questions.clinic_id
        AND ca.is_active = true
    )
  );

CREATE POLICY "clinic_onboarding_questions_clinic_admins_update"
  ON public.clinic_onboarding_questions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_admins ca
      WHERE ca.auth_user_id = auth.uid()
        AND ca.clinic_id = clinic_onboarding_questions.clinic_id
        AND ca.is_active = true
    )
  );

CREATE POLICY "clinic_onboarding_questions_clinic_admins_delete"
  ON public.clinic_onboarding_questions FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_admins ca
      WHERE ca.auth_user_id = auth.uid()
        AND ca.clinic_id = clinic_onboarding_questions.clinic_id
        AND ca.is_active = true
    )
  );

-- Practitioners: SELECT only
CREATE POLICY "clinic_onboarding_questions_practitioners_select"
  ON public.clinic_onboarding_questions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.practitioners p
      WHERE p.auth_user_id = auth.uid()
        AND p.clinic_id = clinic_onboarding_questions.clinic_id
        AND p.is_active = true
    )
  );

-- Patients: SELECT active only (via patient_clinics)
CREATE POLICY "clinic_onboarding_questions_patients_select"
  ON public.clinic_onboarding_questions FOR SELECT TO authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.patient_clinics pc
      JOIN public.patients p ON p.id = pc.patient_id
      WHERE p.auth_user_id = auth.uid()
        AND pc.clinic_id = clinic_onboarding_questions.clinic_id
    )
  );

-- Service role: full access
CREATE POLICY "clinic_onboarding_questions_service_role_all"
  ON public.clinic_onboarding_questions FOR ALL TO service_role
  USING (true) WITH CHECK (true);
