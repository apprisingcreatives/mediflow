-- =============================================================================
-- Phase 3a: Advanced Analytics Functions
-- =============================================================================

-- 1. Patient Demographics (age groups, gender, city)
CREATE OR REPLACE FUNCTION public.get_patient_demographics(
  p_clinic_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  age_group TEXT,
  gender TEXT,
  city TEXT,
  patient_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH clinic_patients AS (
    SELECT DISTINCT a.patient_id
    FROM appointments a
    WHERE a.clinic_id = p_clinic_id
      AND a.status = 'completed'
      AND a.appointment_date BETWEEN p_start_date AND p_end_date
      AND a.patient_id IS NOT NULL
  )
  SELECT
    CASE
      WHEN p.date_of_birth IS NULL THEN 'Unknown'
      WHEN EXTRACT(YEAR FROM age(p.date_of_birth::date)) < 18 THEN '0-17'
      WHEN EXTRACT(YEAR FROM age(p.date_of_birth::date)) < 31 THEN '18-30'
      WHEN EXTRACT(YEAR FROM age(p.date_of_birth::date)) < 46 THEN '31-45'
      WHEN EXTRACT(YEAR FROM age(p.date_of_birth::date)) < 61 THEN '46-60'
      ELSE '60+'
    END AS age_group,
    COALESCE(p.gender, 'Unknown') AS gender,
    COALESCE(p.city, 'Unknown') AS city,
    COUNT(*)::bigint AS patient_count
  FROM clinic_patients cp
  JOIN patients p ON p.id = cp.patient_id
  GROUP BY 1, 2, 3;
END;
$$;

-- 2. Service Popularity (bookings, completions, revenue per service)
CREATE OR REPLACE FUNCTION public.get_service_popularity(
  p_clinic_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  service_id UUID,
  service_name TEXT,
  booking_count BIGINT,
  completed_count BIGINT,
  completion_rate NUMERIC,
  revenue NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.id,
    cs.name,
    COUNT(a.id)::bigint AS booking_count,
    COUNT(a.id) FILTER (WHERE a.status = 'completed')::bigint AS completed_count,
    CASE WHEN COUNT(a.id) > 0
      THEN ROUND(
        COUNT(a.id) FILTER (WHERE a.status = 'completed')::numeric
        / COUNT(a.id) * 100, 1
      )
      ELSE 0
    END AS completion_rate,
    COALESCE(SUM(cs.price) FILTER (WHERE a.status = 'completed'), 0) AS revenue
  FROM clinic_services cs
  LEFT JOIN appointments a
    ON a.service_id = cs.id
    AND a.clinic_id = p_clinic_id
    AND a.appointment_date BETWEEN p_start_date AND p_end_date
  WHERE cs.clinic_id = p_clinic_id
    AND cs.is_active = true
  GROUP BY cs.id, cs.name
  ORDER BY booking_count DESC;
END;
$$;

-- 3. Revenue Forecast (linear regression on last 6 months + projection)
CREATE OR REPLACE FUNCTION public.get_revenue_forecast(
  p_clinic_id UUID,
  p_months_ahead INTEGER DEFAULT 3
)
RETURNS TABLE(
  month_label TEXT,
  revenue NUMERIC,
  is_forecast BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_slope NUMERIC;
  v_intercept NUMERIC;
  v_n INTEGER;
  v_sum_x NUMERIC;
  v_sum_y NUMERIC;
  v_sum_xy NUMERIC;
  v_sum_x2 NUMERIC;
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS _monthly_rev (
    x BIGINT,
    month_label TEXT,
    revenue NUMERIC
  ) ON COMMIT DROP;

  TRUNCATE _monthly_rev;

  INSERT INTO _monthly_rev (x, month_label, revenue)
  SELECT
    ROW_NUMBER() OVER (ORDER BY date_trunc('month', a.appointment_date)),
    TO_CHAR(date_trunc('month', a.appointment_date), 'YYYY-MM'),
    COALESCE(SUM(cs.price), 0)
  FROM appointments a
  JOIN clinic_services cs ON cs.id = a.service_id
  WHERE a.clinic_id = p_clinic_id
    AND a.status = 'completed'
    AND a.appointment_date >= (CURRENT_DATE - INTERVAL '6 months')
  GROUP BY date_trunc('month', a.appointment_date)
  ORDER BY date_trunc('month', a.appointment_date);

  -- Return historical data
  RETURN QUERY
  SELECT mr.month_label, mr.revenue, false::boolean
  FROM _monthly_rev mr
  ORDER BY mr.month_label;

  -- Need at least 2 data points for linear regression
  SELECT COUNT(*)::integer INTO v_n FROM _monthly_rev;
  IF v_n < 2 THEN RETURN; END IF;

  -- Linear regression: y = mx + b
  SELECT
    SUM(x)::numeric,
    SUM(revenue)::numeric,
    SUM(x * revenue)::numeric,
    SUM(x * x)::numeric
  INTO v_sum_x, v_sum_y, v_sum_xy, v_sum_x2
  FROM _monthly_rev;

  v_slope := (v_n * v_sum_xy - v_sum_x * v_sum_y)
    / NULLIF(v_n * v_sum_x2 - v_sum_x * v_sum_x, 0);
  v_intercept := (v_sum_y - v_slope * v_sum_x) / v_n;

  IF v_slope IS NULL THEN RETURN; END IF;

  -- Project future months
  FOR i IN 1..p_months_ahead LOOP
    RETURN QUERY
    SELECT
      TO_CHAR(CURRENT_DATE + (i || ' months')::interval, 'YYYY-MM'),
      GREATEST(0, v_intercept + v_slope * (v_n + i)),
      true::boolean;
  END LOOP;
END;
$$;
