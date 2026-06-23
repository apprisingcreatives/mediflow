-- =============================================================================
-- Phase 3b: Multi-Branch Management
-- =============================================================================

-- 1. Branches table
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_branches_clinic ON public.branches(clinic_id);
CREATE UNIQUE INDEX idx_branches_clinic_default ON public.branches(clinic_id) WHERE is_default = true;

-- 2. Practitioner-branch junction (many-to-many)
CREATE TABLE public.practitioner_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES public.practitioners(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(practitioner_id, branch_id)
);

CREATE INDEX idx_pract_branches_branch ON public.practitioner_branches(branch_id);
CREATE INDEX idx_pract_branches_pract ON public.practitioner_branches(practitioner_id);

-- 3. Add branch_id to appointments (nullable — existing appointments have no branch)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

CREATE INDEX idx_appointments_branch ON public.appointments(branch_id) WHERE branch_id IS NOT NULL;

-- 4. Trigger: create default branch when a clinic is created
CREATE OR REPLACE FUNCTION public.seed_default_branch()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.branches (clinic_id, name, address, city, phone, is_default)
  VALUES (NEW.id, 'Main Branch', NEW.address, NEW.city, NEW.phone, true);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_seed_default_branch
  AFTER INSERT ON public.clinics
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_default_branch();

-- 5. Backfill: create default branch for every existing clinic that has none
INSERT INTO public.branches (clinic_id, name, address, city, phone, is_default)
SELECT c.id, 'Main Branch', c.address, c.city, c.phone, true
FROM public.clinics c
WHERE NOT EXISTS (
  SELECT 1 FROM public.branches b WHERE b.clinic_id = c.id
);

-- 6. Backfill: assign all existing appointments to their clinic's default branch
UPDATE public.appointments a
SET branch_id = b.id
FROM public.branches b
WHERE b.clinic_id = a.clinic_id
  AND b.is_default = true
  AND a.branch_id IS NULL;

-- 7. Backfill: assign all existing practitioners to their clinic's default branch
INSERT INTO public.practitioner_branches (practitioner_id, branch_id)
SELECT p.id, b.id
FROM public.practitioners p
JOIN public.branches b ON b.clinic_id = p.clinic_id AND b.is_default = true
WHERE NOT EXISTS (
  SELECT 1 FROM public.practitioner_branches pb WHERE pb.practitioner_id = p.id AND pb.branch_id = b.id
);

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioner_branches ENABLE ROW LEVEL SECURITY;

-- Branches: clinic staff can read their own clinic's branches
CREATE POLICY "Clinic staff can read own branches"
  ON public.branches FOR SELECT
  USING (clinic_id IN (
    SELECT ca.clinic_id FROM public.clinic_admins ca
    WHERE ca.auth_user_id = auth.uid() AND ca.is_active = true
  ));

-- Branches: service role has full access
CREATE POLICY "Service role full access to branches"
  ON public.branches FOR ALL
  USING (auth.role() = 'service_role');

-- Practitioner branches: clinic staff can read
CREATE POLICY "Clinic staff can read practitioner branches"
  ON public.practitioner_branches FOR SELECT
  USING (branch_id IN (
    SELECT b.id FROM public.branches b
    JOIN public.clinic_admins ca ON ca.clinic_id = b.clinic_id
    WHERE ca.auth_user_id = auth.uid() AND ca.is_active = true
  ));

-- Practitioner branches: service role full access
CREATE POLICY "Service role full access to practitioner branches"
  ON public.practitioner_branches FOR ALL
  USING (auth.role() = 'service_role');

-- Public read for branches (patients need to see branches when booking)
CREATE POLICY "Public can read active branches"
  ON public.branches FOR SELECT
  USING (is_active = true);

-- =============================================================================
-- Update analytics functions with optional branch filtering
-- =============================================================================

-- Drop old overloads (3-param versions) to avoid ambiguity with 4-param DEFAULT NULL versions
DROP FUNCTION IF EXISTS public.get_patient_demographics(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS public.get_service_popularity(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS public.get_revenue_forecast(UUID, INTEGER);

-- Updated: get_patient_demographics with optional branch filter
CREATE OR REPLACE FUNCTION public.get_patient_demographics(
  p_clinic_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_branch_id UUID DEFAULT NULL
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
      AND (p_branch_id IS NULL OR a.branch_id = p_branch_id)
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

-- Updated: get_service_popularity with optional branch filter
CREATE OR REPLACE FUNCTION public.get_service_popularity(
  p_clinic_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_branch_id UUID DEFAULT NULL
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
    AND (p_branch_id IS NULL OR a.branch_id = p_branch_id)
  WHERE cs.clinic_id = p_clinic_id
    AND cs.is_active = true
  GROUP BY cs.id, cs.name
  ORDER BY booking_count DESC;
END;
$$;

-- Updated: get_revenue_forecast with optional branch filter
CREATE OR REPLACE FUNCTION public.get_revenue_forecast(
  p_clinic_id UUID,
  p_months_ahead INTEGER DEFAULT 3,
  p_branch_id UUID DEFAULT NULL
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
    AND (p_branch_id IS NULL OR a.branch_id = p_branch_id)
  GROUP BY date_trunc('month', a.appointment_date)
  ORDER BY date_trunc('month', a.appointment_date);

  RETURN QUERY
  SELECT mr.month_label, mr.revenue, false::boolean
  FROM _monthly_rev mr
  ORDER BY mr.month_label;

  SELECT COUNT(*)::integer INTO v_n FROM _monthly_rev;
  IF v_n < 2 THEN RETURN; END IF;

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

  FOR i IN 1..p_months_ahead LOOP
    RETURN QUERY
    SELECT
      TO_CHAR(CURRENT_DATE + (i || ' months')::interval, 'YYYY-MM'),
      GREATEST(0, v_intercept + v_slope * (v_n + i)),
      true::boolean;
  END LOOP;
END;
$$;

-- New: Branch comparison analytics
CREATE OR REPLACE FUNCTION public.get_branch_comparison(
  p_clinic_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  branch_id UUID,
  branch_name TEXT,
  appointment_count BIGINT,
  completed_count BIGINT,
  cancelled_count BIGINT,
  unique_patients BIGINT,
  revenue NUMERIC,
  avg_daily_appointments NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_days INTEGER;
BEGIN
  v_days := GREATEST(1, p_end_date - p_start_date + 1);

  RETURN QUERY
  SELECT
    b.id,
    b.name,
    COUNT(a.id)::bigint AS appointment_count,
    COUNT(a.id) FILTER (WHERE a.status = 'completed')::bigint AS completed_count,
    COUNT(a.id) FILTER (WHERE a.status = 'cancelled')::bigint AS cancelled_count,
    COUNT(DISTINCT a.patient_id)::bigint AS unique_patients,
    COALESCE(SUM(cs.price) FILTER (WHERE a.status = 'completed'), 0) AS revenue,
    ROUND(COUNT(a.id)::numeric / v_days, 1) AS avg_daily_appointments
  FROM branches b
  LEFT JOIN appointments a
    ON a.branch_id = b.id
    AND a.appointment_date BETWEEN p_start_date AND p_end_date
  LEFT JOIN clinic_services cs
    ON cs.id = a.service_id
  WHERE b.clinic_id = p_clinic_id
    AND b.is_active = true
  GROUP BY b.id, b.name
  ORDER BY appointment_count DESC;
END;
$$;
