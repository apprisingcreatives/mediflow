-- =============================================================================
-- Phase 2: Multi-Doctor Stability — Practitioner blocked times / leave
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.practitioner_blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES public.practitioners(id) ON DELETE CASCADE,
  block_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT valid_time_range CHECK (
    (start_time IS NULL AND end_time IS NULL) OR
    (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
  )
);

ALTER TABLE public.practitioner_blocked_times ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_blocked_times_practitioner_date
  ON public.practitioner_blocked_times (practitioner_id, block_date);

-- RLS: clinic admins can manage blocked times for practitioners in their clinic
CREATE POLICY "blocked_times_clinic_admin_all" ON public.practitioner_blocked_times
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM practitioners p
    JOIN clinic_admins ca ON ca.clinic_id = p.clinic_id
    WHERE p.id = practitioner_id AND ca.auth_user_id = auth.uid() AND ca.is_active = true
  ));

-- RLS: practitioners can manage their own blocked times
CREATE POLICY "blocked_times_practitioner_own" ON public.practitioner_blocked_times
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM practitioners p
    WHERE p.id = practitioner_id AND p.auth_user_id = auth.uid()
  ));

-- RLS: service role has full access
CREATE POLICY "blocked_times_service_role" ON public.practitioner_blocked_times
  FOR ALL TO service_role USING (true) WITH CHECK (true);
