-- =============================================================================
-- Activity Logs: append-only audit trail for patient activity
-- =============================================================================

-- 1. Create activity_logs table
CREATE TABLE public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id   UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  actor_id    UUID NOT NULL,
  actor_role  TEXT NOT NULL CHECK (actor_role IN ('patient', 'clinic_admin', 'practitioner', 'system')),
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id   UUID,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexes
CREATE INDEX idx_activity_logs_patient_time ON public.activity_logs (patient_id, created_at DESC);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs (entity_id, created_at ASC);
CREATE INDEX idx_activity_logs_clinic_patient ON public.activity_logs (clinic_id, patient_id, created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 4. Patient can read own logs
CREATE POLICY "patients_read_own_logs" ON public.activity_logs
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE auth_user_id = auth.uid()
    )
  );

-- 5. Patient can insert own logs
CREATE POLICY "patients_insert_own_logs" ON public.activity_logs
  FOR INSERT WITH CHECK (
    patient_id IN (
      SELECT id FROM public.patients WHERE auth_user_id = auth.uid()
    )
  );

-- 6. Clinic admin can read booking logs for their clinic
CREATE POLICY "clinic_admins_read_logs" ON public.activity_logs
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM public.clinic_admins WHERE auth_user_id = auth.uid()
    )
    AND action_type NOT IN ('password_changed', 'profile_updated')
  );

-- 7. Clinic admin can insert booking logs
CREATE POLICY "clinic_admins_insert_logs" ON public.activity_logs
  FOR INSERT WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM public.clinic_admins WHERE auth_user_id = auth.uid()
    )
  );

-- 8. Practitioner can read booking logs for their clinic
CREATE POLICY "practitioners_read_logs" ON public.activity_logs
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM public.practitioners WHERE auth_user_id = auth.uid() AND is_active = true
    )
    AND action_type NOT IN ('password_changed', 'profile_updated')
  );

-- 9. Practitioner can insert booking logs
CREATE POLICY "practitioners_insert_logs" ON public.activity_logs
  FOR INSERT WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM public.practitioners WHERE auth_user_id = auth.uid() AND is_active = true
    )
  );

-- 10. Update pg_cron auto no-show to also insert activity logs
SELECT cron.unschedule('auto-no-show-detection');
SELECT cron.schedule(
  'auto-no-show-detection',
  '*/5 * * * *',
  $$
  WITH updated AS (
    UPDATE public.appointments
    SET status = 'no-show', updated_at = now()
    WHERE status = 'confirmed'
      AND (
        appointment_date < CURRENT_DATE
        OR (
          appointment_date = CURRENT_DATE
          AND appointment_time + INTERVAL '30 minutes' < CURRENT_TIME
        )
      )
    RETURNING id, patient_id, clinic_id
  )
  INSERT INTO public.activity_logs (patient_id, clinic_id, actor_id, actor_role, action_type, entity_type, entity_id, metadata)
  SELECT patient_id, clinic_id, '00000000-0000-0000-0000-000000000000', 'system', 'appointment_no_show', 'appointment', id, '{"source": "auto"}'::jsonb
  FROM updated;
  $$
);
