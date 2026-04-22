-- =============================================================================
-- Create ai_treatment_predictions table
-- Stores AI-generated health analysis and specialty recommendations
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ai_treatment_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  prediction_data JSONB,
  confidence_score NUMERIC,
  recommended_treatments JSONB,
  risk_factors JSONB,
  predicted_conditions JSONB,
  recommended_specialty TEXT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ai_treatment_predictions_patient_clinic
  ON public.ai_treatment_predictions (patient_id, clinic_id);

-- Enable RLS
ALTER TABLE public.ai_treatment_predictions ENABLE ROW LEVEL SECURITY;

-- Patients: SELECT own predictions
CREATE POLICY "ai_treatment_predictions_patients_select"
  ON public.ai_treatment_predictions FOR SELECT TO authenticated
  USING (
    patient_id = (SELECT id FROM public.patients WHERE auth_user_id = auth.uid())
  );

-- Clinic admins: SELECT + UPDATE (for reviewing)
CREATE POLICY "ai_treatment_predictions_clinic_admins_select"
  ON public.ai_treatment_predictions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_admins ca
      WHERE ca.auth_user_id = auth.uid()
        AND ca.clinic_id = ai_treatment_predictions.clinic_id
        AND ca.is_active = true
    )
  );

CREATE POLICY "ai_treatment_predictions_clinic_admins_update"
  ON public.ai_treatment_predictions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_admins ca
      WHERE ca.auth_user_id = auth.uid()
        AND ca.clinic_id = ai_treatment_predictions.clinic_id
        AND ca.is_active = true
    )
  );

-- Practitioners: SELECT
CREATE POLICY "ai_treatment_predictions_practitioners_select"
  ON public.ai_treatment_predictions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.practitioners p
      WHERE p.auth_user_id = auth.uid()
        AND p.clinic_id = ai_treatment_predictions.clinic_id
        AND p.is_active = true
    )
  );

-- Service role: full access
CREATE POLICY "ai_treatment_predictions_service_role_all"
  ON public.ai_treatment_predictions FOR ALL TO service_role
  USING (true) WITH CHECK (true);
