-- =============================================================================
-- Appointment Status Flow: booked_by column + auto no-show cron
-- =============================================================================

-- 1. Add booked_by column to track who created the appointment
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS booked_by TEXT NOT NULL DEFAULT 'patient'
  CHECK (booked_by IN ('patient', 'clinic_admin'));

-- 2. Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- 3. Schedule auto no-show detection every 5 minutes
-- Marks confirmed appointments as no-show if 30+ minutes past appointment time
SELECT cron.schedule(
  'auto-no-show-detection',
  '*/5 * * * *',
  $$
  UPDATE public.appointments
  SET status = 'no-show', updated_at = now()
  WHERE status = 'confirmed'
    AND (
      appointment_date < CURRENT_DATE
      OR (
        appointment_date = CURRENT_DATE
        AND appointment_time + INTERVAL '30 minutes' < CURRENT_TIME
      )
    );
  $$
);
