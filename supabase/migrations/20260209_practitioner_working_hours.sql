-- ============================================================================
-- PRACTITIONER WORKING HOURS TABLE
-- Defines regular weekly schedules for practitioners
-- ============================================================================

-- Create the practitioner_working_hours table
CREATE TABLE IF NOT EXISTS public.practitioner_working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_practitioner_day UNIQUE(practitioner_id, day_of_week),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_practitioner_working_hours_practitioner 
ON public.practitioner_working_hours USING btree (practitioner_id);

CREATE INDEX IF NOT EXISTS idx_practitioner_working_hours_day 
ON public.practitioner_working_hours USING btree (day_of_week);

-- ============================================================================
-- FUNCTION: Auto-create default working hours when practitioner is created
-- Default: Monday-Friday, 9:00 AM - 5:00 PM (Manila time)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_default_working_hours()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default working hours for Monday (1) through Friday (5)
  INSERT INTO public.practitioner_working_hours (practitioner_id, day_of_week, start_time, end_time, is_available)
  VALUES
    (NEW.id, 1, '09:00:00', '17:00:00', true), -- Monday
    (NEW.id, 2, '09:00:00', '17:00:00', true), -- Tuesday
    (NEW.id, 3, '09:00:00', '17:00:00', true), -- Wednesday
    (NEW.id, 4, '09:00:00', '17:00:00', true), -- Thursday
    (NEW.id, 5, '09:00:00', '17:00:00', true); -- Friday
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create working hours
DROP TRIGGER IF EXISTS trigger_create_default_working_hours ON public.practitioners;
CREATE TRIGGER trigger_create_default_working_hours
AFTER INSERT ON public.practitioners
FOR EACH ROW
EXECUTE FUNCTION public.create_default_working_hours();

-- ============================================================================
-- RLS POLICIES FOR PRACTITIONER_WORKING_HOURS
-- ============================================================================

ALTER TABLE public.practitioner_working_hours ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "working_hours_service_role_all"
ON public.practitioner_working_hours
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Clinic admins can view working hours for practitioners in their clinic
CREATE POLICY "working_hours_clinic_admins_select"
ON public.practitioner_working_hours
FOR SELECT
TO authenticated
USING (
  practitioner_id IN (
    SELECT p.id 
    FROM practitioners p
    JOIN clinic_admins ca ON p.clinic_id = ca.clinic_id
    WHERE ca.auth_user_id = auth.uid()
  )
);

-- Clinic admins can manage working hours for practitioners in their clinic
CREATE POLICY "working_hours_clinic_admins_insert"
ON public.practitioner_working_hours
FOR INSERT
TO authenticated
WITH CHECK (
  practitioner_id IN (
    SELECT p.id 
    FROM practitioners p
    JOIN clinic_admins ca ON p.clinic_id = ca.clinic_id
    WHERE ca.auth_user_id = auth.uid()
  )
);

CREATE POLICY "working_hours_clinic_admins_update"
ON public.practitioner_working_hours
FOR UPDATE
TO authenticated
USING (
  practitioner_id IN (
    SELECT p.id 
    FROM practitioners p
    JOIN clinic_admins ca ON p.clinic_id = ca.clinic_id
    WHERE ca.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  practitioner_id IN (
    SELECT p.id 
    FROM practitioners p
    JOIN clinic_admins ca ON p.clinic_id = ca.clinic_id
    WHERE ca.auth_user_id = auth.uid()
  )
);

CREATE POLICY "working_hours_clinic_admins_delete"
ON public.practitioner_working_hours
FOR DELETE
TO authenticated
USING (
  practitioner_id IN (
    SELECT p.id 
    FROM practitioners p
    JOIN clinic_admins ca ON p.clinic_id = ca.clinic_id
    WHERE ca.auth_user_id = auth.uid()
  )
);

-- Patients can view working hours (for booking purposes)
CREATE POLICY "working_hours_patients_select"
ON public.practitioner_working_hours
FOR SELECT
TO authenticated
USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practitioner_working_hours TO authenticated;
GRANT ALL ON public.practitioner_working_hours TO service_role;

-- ============================================================================
-- FUNCTION: Check appointment availability (no double booking)
-- Returns true if the time slot is available
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_appointment_availability(
  p_practitioner_id UUID,
  p_appointment_date DATE,
  p_appointment_time TIME,
  p_duration_minutes INTEGER,
  p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_day_of_week INTEGER;
  v_end_time TIME;
  v_buffer_minutes INTEGER := 10;
  v_working_hours RECORD;
  v_conflict_count INTEGER;
BEGIN
  -- Calculate end time including buffer
  v_end_time := p_appointment_time + (p_duration_minutes || ' minutes')::INTERVAL;
  
  -- Get day of week (0=Sunday in PostgreSQL's EXTRACT)
  v_day_of_week := EXTRACT(DOW FROM p_appointment_date)::INTEGER;
  
  -- Check if practitioner is available on this day
  SELECT * INTO v_working_hours
  FROM practitioner_working_hours
  WHERE practitioner_id = p_practitioner_id
    AND day_of_week = v_day_of_week
    AND is_available = true;
  
  IF NOT FOUND THEN
    RETURN false; -- Practitioner doesn't work on this day
  END IF;
  
  -- Check if appointment time is within working hours
  IF p_appointment_time < v_working_hours.start_time OR v_end_time > v_working_hours.end_time THEN
    RETURN false; -- Outside working hours
  END IF;
  
  -- Check for overlapping appointments (with 10-minute buffer)
  SELECT COUNT(*) INTO v_conflict_count
  FROM appointments a
  JOIN clinic_services cs ON a.service_id = cs.id
  WHERE a.practitioner_id = p_practitioner_id
    AND a.appointment_date = p_appointment_date
    AND a.status NOT IN ('cancelled', 'no-show')
    AND (p_exclude_appointment_id IS NULL OR a.id != p_exclude_appointment_id)
    AND (
      -- New appointment starts during existing appointment (including buffer)
      (p_appointment_time >= a.appointment_time 
       AND p_appointment_time < (a.appointment_time + ((cs.duration_minutes + v_buffer_minutes) || ' minutes')::INTERVAL))
      OR
      -- New appointment ends during existing appointment (including buffer)
      (v_end_time > a.appointment_time 
       AND v_end_time <= (a.appointment_time + ((cs.duration_minutes + v_buffer_minutes) || ' minutes')::INTERVAL))
      OR
      -- New appointment completely contains existing appointment
      (p_appointment_time <= a.appointment_time 
       AND v_end_time >= (a.appointment_time + ((cs.duration_minutes + v_buffer_minutes) || ' minutes')::INTERVAL))
    );
  
  RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Get available time slots for a practitioner on a specific date
-- Returns available time slots in 30-minute intervals
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_available_time_slots(
  p_practitioner_id UUID,
  p_date DATE,
  p_service_duration_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (
  time_slot TIME,
  is_available BOOLEAN
) AS $$
DECLARE
  v_day_of_week INTEGER;
  v_working_hours RECORD;
  v_current_time TIME;
  v_slot_interval INTERVAL := '30 minutes';
BEGIN
  -- Get day of week
  v_day_of_week := EXTRACT(DOW FROM p_date)::INTEGER;
  
  -- Get working hours for this day
  SELECT * INTO v_working_hours
  FROM practitioner_working_hours pwh
  WHERE pwh.practitioner_id = p_practitioner_id
    AND pwh.day_of_week = v_day_of_week
    AND pwh.is_available = true;
  
  IF NOT FOUND THEN
    RETURN; -- No working hours for this day
  END IF;
  
  -- Generate time slots
  v_current_time := v_working_hours.start_time;
  
  WHILE v_current_time + (p_service_duration_minutes || ' minutes')::INTERVAL <= v_working_hours.end_time LOOP
    time_slot := v_current_time;
    is_available := public.check_appointment_availability(
      p_practitioner_id,
      p_date,
      v_current_time,
      p_service_duration_minutes
    );
    RETURN NEXT;
    v_current_time := v_current_time + v_slot_interval;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.check_appointment_availability TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_time_slots TO authenticated;
