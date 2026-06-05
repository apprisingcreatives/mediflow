-- =============================================================================
-- Phase 2: Multi-Doctor Stability — Max daily appointments per practitioner
-- =============================================================================

ALTER TABLE public.practitioners
  ADD COLUMN IF NOT EXISTS max_daily_appointments INTEGER;

-- Function to check if a practitioner has reached their daily limit
CREATE OR REPLACE FUNCTION public.check_daily_appointment_limit(
  p_practitioner_id uuid,
  p_date date
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_max INTEGER;
  v_current_count INTEGER;
  v_total_working_minutes NUMERIC;
  v_avg_duration NUMERIC;
BEGIN
  -- Get explicit max or auto-calculate
  SELECT max_daily_appointments INTO v_max
  FROM practitioners WHERE id = p_practitioner_id;

  IF v_max IS NULL THEN
    -- Auto-calculate from working hours
    SELECT COALESCE(SUM(
      EXTRACT(EPOCH FROM (pwh.end_time - pwh.start_time)) / 60
    ), 0) INTO v_total_working_minutes
    FROM practitioner_working_hours pwh
    WHERE pwh.practitioner_id = p_practitioner_id
      AND pwh.day_of_week = EXTRACT(DOW FROM p_date)::INTEGER
      AND pwh.is_available = true;

    IF v_total_working_minutes = 0 THEN
      RETURN false;
    END IF;

    -- Average service duration for the clinic
    SELECT COALESCE(AVG(cs.duration_minutes), 30) INTO v_avg_duration
    FROM clinic_services cs
    JOIN practitioners p ON p.clinic_id = cs.clinic_id
    WHERE p.id = p_practitioner_id AND cs.is_active = true;

    v_max := FLOOR(v_total_working_minutes / v_avg_duration);
  END IF;

  -- Count active appointments for this date
  SELECT COUNT(*) INTO v_current_count
  FROM appointments
  WHERE practitioner_id = p_practitioner_id
    AND appointment_date = p_date
    AND status NOT IN ('cancelled', 'no-show');

  RETURN v_current_count < v_max;
END;
$function$;
