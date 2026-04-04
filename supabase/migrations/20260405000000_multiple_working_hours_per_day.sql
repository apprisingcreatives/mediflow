-- =============================================================================
-- Allow multiple working hour slots per day for practitioners
-- e.g. 11am-12pm, 2pm-3pm, 4pm-5pm on the same day
-- =============================================================================

-- 1. Drop the unique constraint that limits to one slot per day
ALTER TABLE public.practitioner_working_hours
  DROP CONSTRAINT IF EXISTS practitioner_working_hours_practitioner_id_day_of_week_key;

-- 2. Add a composite index for efficient lookups (replaces the unique index)
CREATE INDEX IF NOT EXISTS idx_practitioner_working_hours_practitioner_day
  ON public.practitioner_working_hours (practitioner_id, day_of_week);

-- 3. Update check_appointment_availability to support multiple slots per day
CREATE OR REPLACE FUNCTION public.check_appointment_availability(
  p_practitioner_id uuid,
  p_appointment_date date,
  p_appointment_time time,
  p_duration_minutes integer,
  p_exclude_appointment_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_day_of_week INTEGER;
  v_end_time TIME;
  v_fits_in_slot BOOLEAN := false;
  v_conflict_count INTEGER;
BEGIN
  v_end_time := p_appointment_time + (p_duration_minutes || ' minutes')::INTERVAL;
  v_day_of_week := EXTRACT(DOW FROM p_appointment_date)::INTEGER;

  -- Check if appointment fits within ANY working hour slot for this day
  SELECT EXISTS (
    SELECT 1
    FROM practitioner_working_hours
    WHERE practitioner_id = p_practitioner_id
      AND day_of_week = v_day_of_week
      AND is_available = true
      AND p_appointment_time >= start_time
      AND v_end_time <= end_time
  ) INTO v_fits_in_slot;

  IF NOT v_fits_in_slot THEN RETURN false; END IF;

  -- Check for conflicts with existing appointments
  SELECT COUNT(*) INTO v_conflict_count
  FROM appointments a
  JOIN clinic_services cs ON a.service_id = cs.id
  WHERE a.practitioner_id = p_practitioner_id
    AND a.appointment_date = p_appointment_date
    AND a.status NOT IN ('cancelled', 'no-show')
    AND (p_exclude_appointment_id IS NULL OR a.id != p_exclude_appointment_id)
    AND (
      (p_appointment_time >= a.appointment_time
       AND p_appointment_time < (a.appointment_time + (cs.duration_minutes || ' minutes')::INTERVAL))
      OR
      (v_end_time > a.appointment_time
       AND v_end_time <= (a.appointment_time + (cs.duration_minutes || ' minutes')::INTERVAL))
      OR
      (p_appointment_time <= a.appointment_time
       AND v_end_time >= (a.appointment_time + (cs.duration_minutes || ' minutes')::INTERVAL))
    );

  RETURN v_conflict_count = 0;
END;
$function$;

-- 4. Update get_available_time_slots (3-param) to iterate over all slots per day
CREATE OR REPLACE FUNCTION public.get_available_time_slots(
  p_practitioner_id uuid,
  p_date date,
  p_service_duration_minutes integer DEFAULT 30
)
RETURNS TABLE(time_slot time, is_available boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_day_of_week INTEGER;
  v_working_hours RECORD;
  v_current_time TIME;
  v_slot_interval INTERVAL := '30 minutes';
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date)::INTEGER;

  -- Loop through ALL working hour slots for this day
  FOR v_working_hours IN
    SELECT pwh.start_time, pwh.end_time
    FROM practitioner_working_hours pwh
    WHERE pwh.practitioner_id = p_practitioner_id
      AND pwh.day_of_week = v_day_of_week
      AND pwh.is_available = true
    ORDER BY pwh.start_time
  LOOP
    v_current_time := v_working_hours.start_time;

    WHILE v_current_time + (p_service_duration_minutes || ' minutes')::INTERVAL <= v_working_hours.end_time LOOP
      time_slot := v_current_time;
      is_available := public.check_appointment_availability(
        p_practitioner_id, p_date, v_current_time, p_service_duration_minutes, NULL
      );
      RETURN NEXT;
      v_current_time := v_current_time + v_slot_interval;
    END LOOP;
  END LOOP;

  RETURN;
END;
$function$;

-- 5. Update get_available_time_slots (4-param with exclude) to iterate over all slots per day
CREATE OR REPLACE FUNCTION public.get_available_time_slots(
  p_practitioner_id uuid,
  p_date date,
  p_service_duration_minutes integer,
  p_exclude_appointment_id uuid DEFAULT NULL
)
RETURNS TABLE(time_slot time, is_available boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_day_of_week INTEGER;
  v_working_hours RECORD;
  v_current_time TIME;
  v_slot_interval INTERVAL := '30 minutes';
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date)::INTEGER;

  -- Loop through ALL working hour slots for this day
  FOR v_working_hours IN
    SELECT pwh.start_time, pwh.end_time
    FROM practitioner_working_hours pwh
    WHERE pwh.practitioner_id = p_practitioner_id
      AND pwh.day_of_week = v_day_of_week
      AND pwh.is_available = true
    ORDER BY pwh.start_time
  LOOP
    v_current_time := v_working_hours.start_time;

    WHILE v_current_time + (p_service_duration_minutes || ' minutes')::INTERVAL <= v_working_hours.end_time LOOP
      time_slot := v_current_time;
      is_available := public.check_appointment_availability(
        p_practitioner_id, p_date, v_current_time, p_service_duration_minutes, p_exclude_appointment_id
      );
      RETURN NEXT;
      v_current_time := v_current_time + v_slot_interval;
    END LOOP;
  END LOOP;

  RETURN;
END;
$function$;
