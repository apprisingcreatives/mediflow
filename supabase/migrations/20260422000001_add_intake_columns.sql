-- Add intake_required to clinics
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS intake_required BOOLEAN DEFAULT false;

-- Add intake_status to appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS intake_status TEXT DEFAULT 'none'
  CHECK (intake_status IN ('none', 'pending', 'completed'));

-- Link question responses to specific appointments (nullable = general profile responses)
ALTER TABLE public.patient_question_responses
  ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE;

-- Drop old unique constraint (patient_id, question_id) — responses can now exist per-appointment
ALTER TABLE public.patient_question_responses
  DROP CONSTRAINT IF EXISTS patient_question_responses_patient_id_question_id_key;

-- New unique constraint: one response per question per appointment (or per patient if no appointment)
CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_question_responses_unique
  ON public.patient_question_responses (patient_id, question_id, COALESCE(appointment_id, '00000000-0000-0000-0000-000000000000'));

-- Index for looking up responses by appointment
CREATE INDEX IF NOT EXISTS idx_patient_question_responses_appointment
  ON public.patient_question_responses (appointment_id)
  WHERE appointment_id IS NOT NULL;
