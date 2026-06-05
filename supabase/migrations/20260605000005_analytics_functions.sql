-- =============================================================================
-- Phase 3: BI Dashboard — SQL analytics functions
-- =============================================================================

-- 1. Practitioner performance metrics (utilization, revenue, cancellation rate)
CREATE OR REPLACE FUNCTION public.get_practitioner_metrics(
  p_clinic_id uuid,
  p_start_date date,
  p_end_date date,
  p_practitioner_id uuid DEFAULT NULL
)
RETURNS TABLE(
  practitioner_id uuid,
  practitioner_name text,
  appointment_count bigint,
  completed_count bigint,
  cancelled_count bigint,
  no_show_count bigint,
  cancellation_rate numeric,
  revenue numeric,
  booked_minutes numeric,
  available_minutes_per_day numeric,
  utilization_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_business_days integer;
BEGIN
  -- Count business days in range (Mon-Fri approximation)
  v_business_days := GREATEST(1,
    (p_end_date - p_start_date + 1) -
    2 * ((p_end_date - p_start_date + 1) / 7) -
    CASE WHEN EXTRACT(DOW FROM p_start_date) = 0 THEN 1 ELSE 0 END -
    CASE WHEN EXTRACT(DOW FROM p_end_date) = 6 THEN 1 ELSE 0 END
  );

  RETURN QUERY
  WITH practitioners_filtered AS (
    SELECT p.id, p.name
    FROM practitioners p
    WHERE p.clinic_id = p_clinic_id
      AND p.is_active = true
      AND (p_practitioner_id IS NULL OR p.id = p_practitioner_id)
  ),
  appt_stats AS (
    SELECT
      a.practitioner_id AS pid,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE a.status = 'completed') AS completed,
      COUNT(*) FILTER (WHERE a.status = 'cancelled') AS cancelled,
      COUNT(*) FILTER (WHERE a.status = 'no-show') AS no_shows
    FROM appointments a
    WHERE a.clinic_id = p_clinic_id
      AND a.appointment_date BETWEEN p_start_date AND p_end_date
      AND (p_practitioner_id IS NULL OR a.practitioner_id = p_practitioner_id)
    GROUP BY a.practitioner_id
  ),
  rev AS (
    SELECT
      a.practitioner_id AS pid,
      COALESCE(SUM(cs.price), 0) AS total_revenue
    FROM appointments a
    JOIN clinic_services cs ON cs.id = a.service_id
    WHERE a.clinic_id = p_clinic_id
      AND a.status = 'completed'
      AND a.appointment_date BETWEEN p_start_date AND p_end_date
      AND (p_practitioner_id IS NULL OR a.practitioner_id = p_practitioner_id)
    GROUP BY a.practitioner_id
  ),
  booked AS (
    SELECT
      a.practitioner_id AS pid,
      COALESCE(SUM(cs.duration_minutes), 0) AS total_booked_minutes
    FROM appointments a
    JOIN clinic_services cs ON cs.id = a.service_id
    WHERE a.clinic_id = p_clinic_id
      AND a.status IN ('confirmed', 'completed', 'in-progress')
      AND a.appointment_date BETWEEN p_start_date AND p_end_date
      AND (p_practitioner_id IS NULL OR a.practitioner_id = p_practitioner_id)
    GROUP BY a.practitioner_id
  ),
  avail AS (
    SELECT
      pwh.practitioner_id AS pid,
      SUM(EXTRACT(EPOCH FROM (pwh.end_time - pwh.start_time)) / 60) AS daily_available
    FROM practitioner_working_hours pwh
    JOIN practitioners_filtered pf ON pf.id = pwh.practitioner_id
    WHERE pwh.is_available = true
    GROUP BY pwh.practitioner_id
  )
  SELECT
    pf.id,
    pf.name,
    COALESCE(s.total, 0),
    COALESCE(s.completed, 0),
    COALESCE(s.cancelled, 0),
    COALESCE(s.no_shows, 0),
    CASE WHEN COALESCE(s.total, 0) > 0
      THEN ROUND(COALESCE(s.cancelled, 0)::numeric / s.total * 100, 1)
      ELSE 0
    END,
    COALESCE(r.total_revenue, 0),
    COALESCE(b.total_booked_minutes, 0),
    COALESCE(av.daily_available, 0),
    CASE WHEN COALESCE(av.daily_available, 0) > 0
      THEN ROUND(
        COALESCE(b.total_booked_minutes, 0) /
        (av.daily_available * v_business_days / 7) * 100, 1
      )
      ELSE 0
    END
  FROM practitioners_filtered pf
  LEFT JOIN appt_stats s ON s.pid = pf.id
  LEFT JOIN rev r ON r.pid = pf.id
  LEFT JOIN booked b ON b.pid = pf.id
  LEFT JOIN avail av ON av.pid = pf.id
  ORDER BY COALESCE(s.completed, 0) DESC;
END;
$function$;

-- 2. Patient return rate for a clinic
CREATE OR REPLACE FUNCTION public.get_patient_return_rate(
  p_clinic_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rate numeric;
BEGIN
  SELECT
    CASE WHEN COUNT(DISTINCT patient_id) > 0
      THEN ROUND(
        COUNT(DISTINCT CASE WHEN visit_count >= 2 THEN patient_id END)::numeric /
        COUNT(DISTINCT patient_id) * 100, 1
      )
      ELSE 0
    END INTO v_rate
  FROM (
    SELECT patient_id, COUNT(*) AS visit_count
    FROM appointments
    WHERE clinic_id = p_clinic_id
      AND status = 'completed'
      AND (p_start_date IS NULL OR appointment_date >= p_start_date)
      AND (p_end_date IS NULL OR appointment_date <= p_end_date)
    GROUP BY patient_id
  ) sub;

  RETURN v_rate;
END;
$function$;

-- 3. Total revenue for a clinic in a date range
CREATE OR REPLACE FUNCTION public.get_clinic_revenue(
  p_clinic_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_revenue numeric;
BEGIN
  SELECT COALESCE(SUM(cs.price), 0) INTO v_revenue
  FROM appointments a
  JOIN clinic_services cs ON cs.id = a.service_id
  WHERE a.clinic_id = p_clinic_id
    AND a.status = 'completed'
    AND a.appointment_date BETWEEN p_start_date AND p_end_date;

  RETURN v_revenue;
END;
$function$;
