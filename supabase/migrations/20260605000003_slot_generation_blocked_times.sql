-- =============================================================================
-- Phase 2: Multi-Doctor Stability — Filter blocked times from slot generation
-- =============================================================================

-- Replace the 3-param version
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
  v_has_full_day_block BOOLEAN;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date)::INTEGER;

  -- Check for full-day block
  SELECT EXISTS (
    SELECT 1 FROM practitioner_blocked_times bt
    WHERE bt.practitioner_id = p_practitioner_id
      AND bt.block_date = p_date
      AND bt.start_time IS NULL
      AND bt.end_time IS NULL
  ) INTO v_has_full_day_block;

  IF v_has_full_day_block THEN
    RETURN;
  END IF;

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
      -- Check if this slot overlaps with any time-range block
      IF NOT EXISTS (
        SELECT 1 FROM practitioner_blocked_times bt
        WHERE bt.practitioner_id = p_practitioner_id
          AND bt.block_date = p_date
          AND bt.start_time IS NOT NULL
          AND bt.end_time IS NOT NULL
          AND v_current_time < bt.end_time
          AND (v_current_time + (p_service_duration_minutes || ' minutes')::INTERVAL) > bt.start_time
      ) THEN
        time_slot := v_current_time;
        is_available := public.check_appointment_availability(
          p_practitioner_id, p_date, v_current_time, p_service_duration_minutes, NULL
        );
        RETURN NEXT;
      END IF;

      v_current_time := v_current_time + v_slot_interval;
    END LOOP;
  END LOOP;

  RETURN;
END;
$function$;

-- Replace the 4-param version (with exclude appointment)
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
  v_has_full_day_block BOOLEAN;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date)::INTEGER;

  -- Check for full-day block
  SELECT EXISTS (
    SELECT 1 FROM practitioner_blocked_times bt
    WHERE bt.practitioner_id = p_practitioner_id
      AND bt.block_date = p_date
      AND bt.start_time IS NULL
      AND bt.end_time IS NULL
  ) INTO v_has_full_day_block;

  IF v_has_full_day_block THEN
    RETURN;
  END IF;

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
      -- Check if this slot overlaps with any time-range block
      IF NOT EXISTS (
        SELECT 1 FROM practitioner_blocked_times bt
        WHERE bt.practitioner_id = p_practitioner_id
          AND bt.block_date = p_date
          AND bt.start_time IS NOT NULL
          AND bt.end_time IS NOT NULL
          AND v_current_time < bt.end_time
          AND (v_current_time + (p_service_duration_minutes || ' minutes')::INTERVAL) > bt.start_time
      ) THEN
        time_slot := v_current_time;
        is_available := public.check_appointment_availability(
          p_practitioner_id, p_date, v_current_time, p_service_duration_minutes, p_exclude_appointment_id
        );
        RETURN NEXT;
      END IF;

      v_current_time := v_current_time + v_slot_interval;
    END LOOP;
  END LOOP;

  RETURN;
END;
$function$;
