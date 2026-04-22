-- =============================================================================
-- Create patient_question_responses table
-- Stores patient answers to clinic-specific onboarding questions
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.patient_question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.clinic_onboarding_questions(id) ON DELETE CASCADE,
  response_value TEXT,
  response_options JSONB,
  responded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(patient_id, question_id)
);

-- Indexes
CREATE INDEX idx_patient_question_responses_patient_clinic
  ON public.patient_question_responses (patient_id, clinic_id);

-- Enable RLS
ALTER TABLE public.patient_question_responses ENABLE ROW LEVEL SECURITY;

-- Patients: read/write own responses
CREATE POLICY "patient_question_responses_patients_select"
  ON public.patient_question_responses FOR SELECT TO authenticated
  USING (
    patient_id = (SELECT id FROM public.patients WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "patient_question_responses_patients_insert"
  ON public.patient_question_responses FOR INSERT TO authenticated
  WITH CHECK (
    patient_id = (SELECT id FROM public.patients WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "patient_question_responses_patients_update"
  ON public.patient_question_responses FOR UPDATE TO authenticated
  USING (
    patient_id = (SELECT id FROM public.patients WHERE auth_user_id = auth.uid())
  );

-- Clinic admins: SELECT (via patient_clinics)
CREATE POLICY "patient_question_responses_clinic_admins_select"
  ON public.patient_question_responses FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_admins ca
      WHERE ca.auth_user_id = auth.uid()
        AND ca.clinic_id = patient_question_responses.clinic_id
        AND ca.is_active = true
    )
  );

-- Practitioners: SELECT (via patient_clinics)
CREATE POLICY "patient_question_responses_practitioners_select"
  ON public.patient_question_responses FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.practitioners p
      WHERE p.auth_user_id = auth.uid()
        AND p.clinic_id = patient_question_responses.clinic_id
        AND p.is_active = true
    )
  );

-- Service role: full access
CREATE POLICY "patient_question_responses_service_role_all"
  ON public.patient_question_responses FOR ALL TO service_role
  USING (true) WITH CHECK (true);
