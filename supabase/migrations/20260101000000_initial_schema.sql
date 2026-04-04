-- =============================================================================
-- MediFlow Initial Schema - Replicated from Production
-- Generated: 2026-04-03
-- =============================================================================

-- =============================================================================
-- 1. ENUM TYPES
-- =============================================================================

CREATE TYPE public.invite_status AS ENUM ('invited', 'active', 'suspended');

-- =============================================================================
-- 2. TABLES (dependency order)
-- =============================================================================

-- super_admins (no FK dependencies on other public tables)
CREATE TABLE public.super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  auth_user_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT false,
  invited_by UUID REFERENCES public.super_admins(id),
  status public.invite_status
);

-- clinics
CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  city TEXT,
  logo_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  subscription_plan TEXT DEFAULT 'starter'::text,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  trial_start_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  is_trial_active BOOLEAN DEFAULT true,
  is_subscription_active BOOLEAN DEFAULT true,
  payment_status TEXT DEFAULT 'trial'::text,
  last_payment_date TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  slug TEXT UNIQUE
);
COMMENT ON COLUMN public.clinics.slug IS 'URL-friendly identifier for the clinic. Auto-generated from clinic name, guaranteed unique.';

-- clinic_admins
CREATE TABLE public.clinic_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin'::text,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id)
);

-- clinic_services
CREATE TABLE public.clinic_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 30,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'PHP'::text,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ai_features
CREATE TABLE public.ai_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- clinic_ai_features
CREATE TABLE public.clinic_ai_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id),
  feature_id UUID REFERENCES public.ai_features(id),
  is_enabled BOOLEAN DEFAULT false,
  enabled_by UUID REFERENCES public.super_admins(id),
  enabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (clinic_id, feature_id)
);
COMMENT ON TABLE public.clinic_ai_features IS 'Stores which AI features are enabled for each clinic. RLS: Super admins have full access, clinic admins have read-only access to their clinic.';

-- practitioners
CREATE TABLE public.practitioners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id),
  name TEXT NOT NULL,
  email TEXT,
  specialization TEXT,
  bio TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id),
  role TEXT DEFAULT 'practitioner'::text
);

-- patients
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  city TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  blood_type TEXT,
  allergies TEXT[],
  chronic_conditions TEXT[],
  current_medications TEXT,
  medical_notes TEXT,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT false
);

-- patient_documents
CREATE TABLE public.patient_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  document_type TEXT,
  description TEXT,
  ai_analysis TEXT,
  ai_recommended_specialty TEXT,
  ai_summary TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- patient_clinics
CREATE TABLE public.patient_clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  first_visit_at TIMESTAMPTZ,
  last_visit_at TIMESTAMPTZ,
  is_primary BOOLEAN DEFAULT false,
  UNIQUE (patient_id, clinic_id)
);

-- clinic_payments
CREATE TABLE public.clinic_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'PHP'::text,
  payment_method TEXT,
  status TEXT DEFAULT 'pending'::text,
  stripe_payment_intent_id TEXT,
  description TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- practitioner_working_hours
CREATE TABLE public.practitioner_working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID REFERENCES public.practitioners(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (practitioner_id, day_of_week)
);

-- appointments
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id),
  clinic_id UUID REFERENCES public.clinics(id),
  practitioner_id UUID REFERENCES public.practitioners(id),
  service_id UUID REFERENCES public.clinic_services(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT DEFAULT 'scheduled'::text,
  notes TEXT,
  ai_recommended BOOLEAN DEFAULT false,
  ai_recommendation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  patient_clinic_id UUID REFERENCES public.patient_clinics(id),
  notification_created_sent BOOLEAN DEFAULT false,
  notification_updated_sent BOOLEAN DEFAULT false,
  notification_24hr_sent BOOLEAN DEFAULT false,
  notification_start_sent BOOLEAN DEFAULT false,
  checkin_token UUID,
  checkin_token_expires_at TIMESTAMPTZ
);

-- email_notifications
CREATE TABLE public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  recipient_type TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  html_body TEXT,
  notification_type TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  status TEXT DEFAULT 'pending'::text,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.email_notifications IS 'Stores all email notifications sent by the system. notification_type values: appointment_created, appointment_updated, appointment_reminder_24hr, appointment_start';

-- email_templates
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  html_body TEXT,
  variables JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 3. INDEXES
-- =============================================================================

CREATE INDEX idx_appointments_clinic ON public.appointments USING btree (clinic_id);
CREATE INDEX idx_appointments_date ON public.appointments USING btree (appointment_date);
CREATE INDEX idx_appointments_patient ON public.appointments USING btree (patient_id);
CREATE INDEX idx_appointments_practitioner ON public.appointments USING btree (practitioner_id);
CREATE INDEX idx_appointments_notification_24hr ON public.appointments USING btree (appointment_date, appointment_time) WHERE ((notification_24hr_sent = false) AND (status = ANY (ARRAY['scheduled'::text, 'confirmed'::text])));
CREATE INDEX idx_appointments_notification_start ON public.appointments USING btree (appointment_date, appointment_time) WHERE ((notification_start_sent = false) AND (status = ANY (ARRAY['scheduled'::text, 'confirmed'::text])));

CREATE INDEX idx_clinic_admins_clinic ON public.clinic_admins USING btree (clinic_id);

CREATE INDEX idx_clinic_ai_features_clinic ON public.clinic_ai_features USING btree (clinic_id);

CREATE INDEX idx_clinic_payments_clinic ON public.clinic_payments USING btree (clinic_id);

CREATE INDEX idx_clinic_services_clinic ON public.clinic_services USING btree (clinic_id);

CREATE INDEX idx_email_notifications_recipient ON public.email_notifications USING btree (recipient_email);
CREATE INDEX idx_email_notifications_status ON public.email_notifications USING btree (status);

CREATE INDEX idx_patient_clinics_clinic ON public.patient_clinics USING btree (clinic_id);
CREATE INDEX idx_patient_clinics_patient ON public.patient_clinics USING btree (patient_id);

CREATE INDEX idx_patient_documents_patient ON public.patient_documents USING btree (patient_id);

CREATE INDEX idx_patients_auth_user ON public.patients USING btree (auth_user_id);
CREATE INDEX idx_patients_email ON public.patients USING btree (email);

CREATE INDEX idx_practitioner_working_hours_day ON public.practitioner_working_hours USING btree (day_of_week);
CREATE INDEX idx_practitioner_working_hours_practitioner ON public.practitioner_working_hours USING btree (practitioner_id);

CREATE INDEX idx_practitioners_auth_user ON public.practitioners USING btree (auth_user_id);
CREATE INDEX idx_practitioners_clinic ON public.practitioners USING btree (clinic_id);

-- =============================================================================
-- 4. FUNCTIONS
-- =============================================================================

-- Helper: Check if current user is an active super admin
CREATE OR REPLACE FUNCTION public.is_active_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.super_admins
    WHERE auth_user_id = auth.uid()
      AND is_active = true
  );
END;
$function$;

-- Helper: Check if current user is an active clinic admin
CREATE OR REPLACE FUNCTION public.is_active_clinic_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM clinic_admins ca
    WHERE ca.auth_user_id = auth.uid()
      AND ca.is_active = true
  );
$function$;

-- Helper: Check if current user is clinic admin for a specific clinic
CREATE OR REPLACE FUNCTION public.is_clinic_admin_for_clinic(check_clinic_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM clinic_admins ca
    WHERE ca.auth_user_id = auth.uid()
      AND ca.clinic_id = check_clinic_id
      AND ca.is_active = true
  );
$function$;

-- Helper: Get clinic_id for current clinic admin
CREATE OR REPLACE FUNCTION public.get_clinic_admin_clinic_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT ca.clinic_id
  FROM clinic_admins ca
  WHERE ca.auth_user_id = auth.uid()
    AND ca.is_active = true
  LIMIT 1;
$function$;

-- Helper: Get patient_id for current user
CREATE OR REPLACE FUNCTION public.get_patient_id_for_user()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.id
  FROM patients p
  WHERE p.auth_user_id = auth.uid()
  LIMIT 1;
$function$;

-- Helper: Get practitioner_id for current user
CREATE OR REPLACE FUNCTION public.get_practitioner_id_for_user()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id FROM practitioners WHERE auth_user_id = auth.uid() LIMIT 1;
$function$;

-- Helper: Get practitioner_id for current user at a specific clinic
CREATE OR REPLACE FUNCTION public.get_practitioner_id_for_clinic(p_clinic_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id FROM practitioners WHERE auth_user_id = auth.uid() AND clinic_id = p_clinic_id LIMIT 1;
$function$;

-- Helper: Check if patient has appointment at admin's clinic
CREATE OR REPLACE FUNCTION public.patient_has_appointment_at_admin_clinic(check_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM appointments a
    INNER JOIN clinic_admins ca ON ca.clinic_id = a.clinic_id
    WHERE a.patient_id = check_patient_id
      AND ca.auth_user_id = auth.uid()
      AND ca.is_active = true

    UNION

    SELECT 1
    FROM patient_clinics pc
    INNER JOIN clinic_admins ca ON ca.clinic_id = pc.clinic_id
    WHERE pc.patient_id = check_patient_id
      AND ca.auth_user_id = auth.uid()
      AND ca.is_active = true
  );
$function$;

-- Helper: Check if patient has appointment with practitioner
CREATE OR REPLACE FUNCTION public.patient_has_appointment_with_practitioner(check_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM appointments a
    INNER JOIN practitioners p ON p.id = a.practitioner_id
    WHERE a.patient_id = check_patient_id
      AND p.auth_user_id = auth.uid()
      AND p.is_active = true
  );
$function$;

-- Activate patient for current user
CREATE OR REPLACE FUNCTION public.activate_patient_for_current_user()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.patients
  SET is_active = true,
      updated_at = now()
  WHERE auth_user_id = auth.uid();
END;
$function$;

-- Check patient onboarding completion (trigger function)
CREATE OR REPLACE FUNCTION public.check_patient_onboarding_completion()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF
    NEW.email IS NOT NULL AND NEW.email <> '' AND
    NEW.first_name IS NOT NULL AND NEW.first_name <> '' AND
    NEW.last_name IS NOT NULL AND NEW.last_name <> '' AND
    NEW.phone IS NOT NULL AND NEW.phone <> '' AND
    NEW.date_of_birth IS NOT NULL AND
    NEW.gender IS NOT NULL AND NEW.gender <> '' AND
    NEW.address IS NOT NULL AND NEW.address <> '' AND
    NEW.city IS NOT NULL AND NEW.city <> '' AND
    NEW.emergency_contact_name IS NOT NULL AND NEW.emergency_contact_name <> '' AND
    NEW.emergency_contact_phone IS NOT NULL AND NEW.emergency_contact_phone <> ''
  THEN
    NEW.onboarding_completed := true;
    NEW.is_active := true;
  ELSE
    NEW.onboarding_completed := false;
    NEW.is_active := false;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

-- Slug generation
CREATE OR REPLACE FUNCTION public.slugify(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT lower(
    trim(
      regexp_replace(
        regexp_replace(value, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+',
        '-',
        'g'
      )
    )
  );
$function$;

CREATE OR REPLACE FUNCTION public.generate_clinic_slug(clinic_name text, clinic_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
  slug_exists BOOLEAN;
BEGIN
  base_slug := lower(trim(clinic_name));
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '[\s_-]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');

  IF base_slug = '' THEN
    base_slug := 'clinic';
  END IF;

  final_slug := base_slug;

  LOOP
    SELECT EXISTS(
      SELECT 1 FROM clinics
      WHERE slug = final_slug
      AND id != clinic_id
    ) INTO slug_exists;

    EXIT WHEN NOT slug_exists;

    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  RETURN final_slug;
END;
$function$;

-- Populate clinic AI features on clinic creation
CREATE OR REPLACE FUNCTION public.populate_clinic_ai_features()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.is_active = true THEN
    INSERT INTO clinic_ai_features (
      clinic_id, feature_id, is_enabled, enabled_by, enabled_at, created_at, updated_at
    )
    SELECT
      NEW.id, af.id, NOT af.is_premium, NULL,
      CASE WHEN NOT af.is_premium THEN NOW() ELSE NULL END,
      NOW(), NOW()
    FROM ai_features af
    WHERE NOT EXISTS (
      SELECT 1 FROM clinic_ai_features caf
      WHERE caf.clinic_id = NEW.id AND caf.feature_id = af.id
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Create default working hours for new practitioners
CREATE OR REPLACE FUNCTION public.create_default_working_hours()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.practitioner_working_hours (practitioner_id, day_of_week, start_time, end_time, is_available)
  VALUES
    (NEW.id, 1, '09:00:00', '17:00:00', true),
    (NEW.id, 2, '09:00:00', '17:00:00', true),
    (NEW.id, 3, '09:00:00', '17:00:00', true),
    (NEW.id, 4, '09:00:00', '17:00:00', true),
    (NEW.id, 5, '09:00:00', '17:00:00', true);
  RETURN NEW;
END;
$function$;

-- Check appointment availability
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
  v_working_hours RECORD;
  v_conflict_count INTEGER;
BEGIN
  v_end_time := p_appointment_time + (p_duration_minutes || ' minutes')::INTERVAL;
  v_day_of_week := EXTRACT(DOW FROM p_appointment_date)::INTEGER;

  SELECT * INTO v_working_hours
  FROM practitioner_working_hours
  WHERE practitioner_id = p_practitioner_id
    AND day_of_week = v_day_of_week
    AND is_available = true;

  IF NOT FOUND THEN RETURN false; END IF;

  IF p_appointment_time < v_working_hours.start_time OR v_end_time > v_working_hours.end_time THEN
    RETURN false;
  END IF;

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

-- Get available time slots (3-param version)
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

  SELECT * INTO v_working_hours
  FROM practitioner_working_hours pwh
  WHERE pwh.practitioner_id = p_practitioner_id
    AND pwh.day_of_week = v_day_of_week
    AND pwh.is_available = true;

  IF NOT FOUND THEN RETURN; END IF;

  v_current_time := v_working_hours.start_time;

  WHILE v_current_time + (p_service_duration_minutes || ' minutes')::INTERVAL <= v_working_hours.end_time LOOP
    time_slot := v_current_time;
    is_available := public.check_appointment_availability(
      p_practitioner_id, p_date, v_current_time, p_service_duration_minutes, NULL
    );
    RETURN NEXT;
    v_current_time := v_current_time + v_slot_interval;
  END LOOP;

  RETURN;
END;
$function$;

-- Get available time slots (4-param version with exclude)
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

  SELECT * INTO v_working_hours
  FROM practitioner_working_hours pwh
  WHERE pwh.practitioner_id = p_practitioner_id
    AND pwh.day_of_week = v_day_of_week
    AND pwh.is_available = true;

  IF NOT FOUND THEN RETURN; END IF;

  v_current_time := v_working_hours.start_time;

  WHILE v_current_time + (p_service_duration_minutes || ' minutes')::INTERVAL <= v_working_hours.end_time LOOP
    time_slot := v_current_time;
    is_available := public.check_appointment_availability(
      p_practitioner_id, p_date, v_current_time, p_service_duration_minutes, p_exclude_appointment_id
    );
    RETURN NEXT;
    v_current_time := v_current_time + v_slot_interval;
  END LOOP;

  RETURN;
END;
$function$;

-- Generate checkin token
CREATE OR REPLACE FUNCTION public.generate_checkin_token(p_appointment_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_token UUID;
BEGIN
    v_token := gen_random_uuid();
    UPDATE appointments
    SET checkin_token = v_token,
        checkin_token_expires_at = (appointment_date + appointment_time)::timestamptz + INTERVAL '2 hours'
    WHERE id = p_appointment_id;
    RETURN v_token;
END;
$function$;

-- Notification functions
CREATE OR REPLACE FUNCTION public.notify_appointment_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_notification_type TEXT;
    v_should_notify BOOLEAN := FALSE;
    v_edge_function_url TEXT;
BEGIN
    v_edge_function_url := current_setting('app.settings.edge_function_url', true);
    IF v_edge_function_url IS NULL THEN
        v_edge_function_url := 'https://kandwedeqpguuupzqpcc.supabase.co/functions/v1/send-appointment-email';
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF NEW.status IN ('scheduled', 'confirmed') AND NEW.notification_created_sent = FALSE THEN
            v_notification_type := 'appointment_created';
            v_should_notify := TRUE;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF (OLD.appointment_date != NEW.appointment_date OR OLD.appointment_time != NEW.appointment_time)
           AND NEW.status IN ('scheduled', 'confirmed')
           AND NEW.notification_updated_sent = FALSE THEN
            v_notification_type := 'appointment_updated';
            v_should_notify := TRUE;
            NEW.notification_24hr_sent := FALSE;
            NEW.notification_start_sent := FALSE;
        END IF;
    END IF;

    IF v_should_notify AND v_notification_type IS NOT NULL THEN
        INSERT INTO email_notifications (
            recipient_email, recipient_name, recipient_type, subject, body,
            notification_type, related_entity_type, related_entity_id, status, metadata
        )
        SELECT
            p.email, p.first_name || ' ' || p.last_name, 'patient',
            'Appointment Notification', 'Pending processing',
            v_notification_type, 'appointment', NEW.id, 'queued',
            jsonb_build_object('appointment_id', NEW.id, 'notification_type', v_notification_type, 'triggered_at', now())
        FROM patients p WHERE p.id = NEW.patient_id;

        IF v_notification_type = 'appointment_created' THEN
            NEW.notification_created_sent := TRUE;
        ELSIF v_notification_type = 'appointment_updated' THEN
            NEW.notification_updated_sent := TRUE;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_24hr_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_count INTEGER := 0;
    v_appointment RECORD;
    v_reminder_window_start TIMESTAMPTZ;
    v_reminder_window_end TIMESTAMPTZ;
BEGIN
    v_reminder_window_start := now() + INTERVAL '23 hours';
    v_reminder_window_end := now() + INTERVAL '25 hours';

    FOR v_appointment IN
        SELECT a.id, a.patient_id, p.email, p.first_name, p.last_name
        FROM appointments a
        JOIN patients p ON p.id = a.patient_id
        WHERE a.notification_24hr_sent = FALSE
          AND a.status IN ('scheduled', 'confirmed')
          AND (a.appointment_date + a.appointment_time)::timestamptz >= v_reminder_window_start
          AND (a.appointment_date + a.appointment_time)::timestamptz <= v_reminder_window_end
    LOOP
        INSERT INTO email_notifications (
            recipient_email, recipient_name, recipient_type, subject, body,
            notification_type, related_entity_type, related_entity_id, status, metadata
        ) VALUES (
            v_appointment.email, v_appointment.first_name || ' ' || v_appointment.last_name,
            'patient', '24-Hour Reminder', 'Pending processing',
            'appointment_reminder_24hr', 'appointment', v_appointment.id, 'queued',
            jsonb_build_object('appointment_id', v_appointment.id, 'notification_type', 'appointment_reminder_24hr', 'triggered_at', now())
        );
        UPDATE appointments SET notification_24hr_sent = TRUE WHERE id = v_appointment.id;
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_appointment_start_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_count INTEGER := 0;
    v_appointment RECORD;
    v_start_window_start TIMESTAMPTZ;
    v_start_window_end TIMESTAMPTZ;
BEGIN
    v_start_window_start := now() + INTERVAL '5 minutes';
    v_start_window_end := now() + INTERVAL '15 minutes';

    FOR v_appointment IN
        SELECT a.id, a.patient_id, p.email, p.first_name, p.last_name
        FROM appointments a
        JOIN patients p ON p.id = a.patient_id
        WHERE a.notification_start_sent = FALSE
          AND a.status IN ('scheduled', 'confirmed')
          AND (a.appointment_date + a.appointment_time)::timestamptz >= v_start_window_start
          AND (a.appointment_date + a.appointment_time)::timestamptz <= v_start_window_end
    LOOP
        INSERT INTO email_notifications (
            recipient_email, recipient_name, recipient_type, subject, body,
            notification_type, related_entity_type, related_entity_id, status, metadata
        ) VALUES (
            v_appointment.email, v_appointment.first_name || ' ' || v_appointment.last_name,
            'patient', 'Appointment Starting', 'Pending processing',
            'appointment_start', 'appointment', v_appointment.id, 'queued',
            jsonb_build_object('appointment_id', v_appointment.id, 'notification_type', 'appointment_start', 'triggered_at', now())
        );
        UPDATE appointments SET notification_start_sent = TRUE WHERE id = v_appointment.id;
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.call_process_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_response_id bigint;
BEGIN
    SELECT net.http_post(
        url := 'https://kandwedeqpguuupzqpcc.supabase.co/functions/v1/process-notifications',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := '{}'::jsonb
    ) INTO v_response_id;
    RAISE NOTICE 'Called process-notifications, request id: %', v_response_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_notifications_direct()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_24hr_count INTEGER;
    v_start_count INTEGER;
    v_queued_count INTEGER;
BEGIN
    SELECT check_24hr_reminders() INTO v_24hr_count;
    SELECT check_appointment_start_notifications() INTO v_start_count;
    SELECT COUNT(*) INTO v_queued_count FROM email_notifications WHERE status = 'queued';

    RETURN jsonb_build_object(
        'reminder_24hr_queued', v_24hr_count,
        'appointment_start_queued', v_start_count,
        'total_queued', v_queued_count,
        'processed_at', now()
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_queued_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_processed INTEGER := 0;
    v_notification RECORD;
BEGIN
    FOR v_notification IN
        SELECT id, related_entity_id, notification_type
        FROM email_notifications
        WHERE status = 'queued'
        ORDER BY created_at ASC
        LIMIT 50
    LOOP
        UPDATE email_notifications SET status = 'processing' WHERE id = v_notification.id;
        v_processed := v_processed + 1;
    END LOOP;
    RETURN v_processed;
END;
$function$;

-- =============================================================================
-- 5. TRIGGERS
-- =============================================================================

CREATE TRIGGER trigger_check_patient_onboarding
  BEFORE INSERT OR UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.check_patient_onboarding_completion();

CREATE TRIGGER trigger_populate_clinic_ai_features
  AFTER INSERT ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.populate_clinic_ai_features();

CREATE TRIGGER trigger_create_default_working_hours
  AFTER INSERT ON public.practitioners
  FOR EACH ROW EXECUTE FUNCTION public.create_default_working_hours();

CREATE TRIGGER trigger_appointment_created_notification
  BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_email();

CREATE TRIGGER trigger_appointment_updated_notification
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_email();

-- =============================================================================
-- 6. ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_ai_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioner_working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 7. RLS POLICIES
-- =============================================================================

-- ---- super_admins ----
CREATE POLICY "Admins can read own record" ON public.super_admins
  FOR SELECT TO anon, authenticated USING (auth.uid() = auth_user_id);

CREATE POLICY "Active super admins can insert new super admins" ON public.super_admins
  FOR INSERT TO authenticated, service_role WITH CHECK (is_active_super_admin());

-- ---- clinics ----
CREATE POLICY "Enable read access for all users" ON public.clinics
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.clinics
  FOR INSERT TO service_role WITH CHECK (true);

-- ---- clinic_admins ----
CREATE POLICY "clinic_admins_select_own" ON public.clinic_admins
  FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

CREATE POLICY "clinic_admins_update_own" ON public.clinic_admins
  FOR UPDATE TO authenticated USING (auth_user_id = auth.uid()) WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "clinic_admins_super_admin_read" ON public.clinic_admins
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM super_admins WHERE auth_user_id = auth.uid()));

CREATE POLICY "clinic_admins_super_admin_update" ON public.clinic_admins
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins WHERE auth_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM super_admins WHERE auth_user_id = auth.uid()));

CREATE POLICY "clinic_admins_service_role_all" ON public.clinic_admins
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- clinic_services ----
CREATE POLICY "Enable read access for all users" ON public.clinic_services
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Clinic admins can insert services for their clinic" ON public.clinic_services
  FOR INSERT TO authenticated WITH CHECK (is_clinic_admin_for_clinic(clinic_id));

CREATE POLICY "Clinic admins can update services for their clinic" ON public.clinic_services
  FOR UPDATE TO authenticated USING (is_clinic_admin_for_clinic(clinic_id)) WITH CHECK (is_clinic_admin_for_clinic(clinic_id));

CREATE POLICY "Clinic admins can delete services for their clinic" ON public.clinic_services
  FOR DELETE TO authenticated USING (is_clinic_admin_for_clinic(clinic_id));

-- ---- ai_features ----
CREATE POLICY "Enable read access for all users" ON public.ai_features
  FOR SELECT TO anon, authenticated USING (true);

-- ---- clinic_ai_features ----
CREATE POLICY "Super admins have full access to clinic AI features" ON public.clinic_ai_features
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins WHERE super_admins.auth_user_id = auth.uid() AND super_admins.status = 'active'::invite_status))
  WITH CHECK (EXISTS (SELECT 1 FROM super_admins WHERE super_admins.auth_user_id = auth.uid() AND super_admins.status = 'active'::invite_status));

CREATE POLICY "Clinic admins can view their clinic's AI features" ON public.clinic_ai_features
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM clinic_admins WHERE clinic_admins.auth_user_id = auth.uid() AND clinic_admins.clinic_id = clinic_ai_features.clinic_id AND clinic_admins.is_active = true));

-- ---- practitioners ----
CREATE POLICY "practitioners_public_select" ON public.practitioners
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "practitioners_own_select" ON public.practitioners
  FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

CREATE POLICY "practitioners_own_update" ON public.practitioners
  FOR UPDATE TO authenticated USING (auth_user_id = auth.uid()) WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "practitioners_clinic_admins_select" ON public.practitioners
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM clinic_admins ca WHERE ca.auth_user_id = auth.uid() AND ca.clinic_id = practitioners.clinic_id AND ca.is_active = true));

CREATE POLICY "practitioners_clinic_admins_insert" ON public.practitioners
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM clinic_admins ca WHERE ca.auth_user_id = auth.uid() AND ca.clinic_id = ca.clinic_id AND ca.is_active = true));

CREATE POLICY "practitioners_clinic_admins_update" ON public.practitioners
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM clinic_admins ca WHERE ca.auth_user_id = auth.uid() AND ca.clinic_id = practitioners.clinic_id AND ca.is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM clinic_admins ca WHERE ca.auth_user_id = auth.uid() AND ca.clinic_id = ca.clinic_id AND ca.is_active = true));

CREATE POLICY "practitioners_clinic_admins_delete" ON public.practitioners
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM clinic_admins ca WHERE ca.auth_user_id = auth.uid() AND ca.clinic_id = practitioners.clinic_id AND ca.is_active = true));

CREATE POLICY "practitioners_service_role_all" ON public.practitioners
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- patients ----
CREATE POLICY "patients_own_select" ON public.patients
  FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

CREATE POLICY "patients_own_update" ON public.patients
  FOR UPDATE TO authenticated USING (auth_user_id = auth.uid()) WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "patients_self_insert" ON public.patients
  FOR INSERT TO authenticated WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "patients_clinic_admins_select" ON public.patients
  FOR SELECT TO authenticated USING (patient_has_appointment_at_admin_clinic(id));

CREATE POLICY "patients_clinic_admins_update" ON public.patients
  FOR UPDATE TO authenticated USING (patient_has_appointment_at_admin_clinic(id)) WITH CHECK (patient_has_appointment_at_admin_clinic(id));

CREATE POLICY "patients_clinic_admins_insert" ON public.patients
  FOR INSERT TO authenticated WITH CHECK (is_active_clinic_admin() AND auth_user_id IS NULL);

CREATE POLICY "patients_practitioners_select" ON public.patients
  FOR SELECT TO authenticated USING (patient_has_appointment_with_practitioner(id));

CREATE POLICY "patients_service_role_all" ON public.patients
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- patient_documents ----
CREATE POLICY "patient_documents_patients_select" ON public.patient_documents
  FOR SELECT TO authenticated USING (patient_id = get_patient_id_for_user());

CREATE POLICY "patient_documents_clinic_admins_select" ON public.patient_documents
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM patient_clinics pc JOIN clinic_admins ca ON ca.clinic_id = pc.clinic_id WHERE pc.patient_id = patient_documents.patient_id AND ca.auth_user_id = auth.uid() AND ca.is_active = true));

CREATE POLICY "patient_documents_clinic_admins_insert" ON public.patient_documents
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM patient_clinics pc JOIN clinic_admins ca ON ca.clinic_id = pc.clinic_id WHERE pc.patient_id = patient_documents.patient_id AND ca.auth_user_id = auth.uid() AND ca.is_active = true));

CREATE POLICY "patient_documents_clinic_admins_update" ON public.patient_documents
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM patient_clinics pc JOIN clinic_admins ca ON ca.clinic_id = pc.clinic_id WHERE pc.patient_id = patient_documents.patient_id AND ca.auth_user_id = auth.uid() AND ca.is_active = true));

CREATE POLICY "patient_documents_service_role_all" ON public.patient_documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- patient_clinics ----
CREATE POLICY "patient_clinics_patients_select" ON public.patient_clinics
  FOR SELECT TO authenticated USING (patient_id = get_patient_id_for_user());

CREATE POLICY "patient_clinics_patients_update" ON public.patient_clinics
  FOR UPDATE TO authenticated USING (patient_id = get_patient_id_for_user()) WITH CHECK (patient_id = get_patient_id_for_user());

CREATE POLICY "patient_clinics_patients_insert" ON public.patient_clinics
  FOR INSERT TO authenticated WITH CHECK (patient_id = get_patient_id_for_user());

CREATE POLICY "patient_clinics_clinic_admins_select" ON public.patient_clinics
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM clinic_admins ca WHERE ca.auth_user_id = auth.uid() AND ca.clinic_id = patient_clinics.clinic_id AND ca.is_active = true));

CREATE POLICY "patient_clinics_clinic_admins_insert" ON public.patient_clinics
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM clinic_admins ca WHERE ca.auth_user_id = auth.uid() AND ca.clinic_id = patient_clinics.clinic_id AND ca.is_active = true));

CREATE POLICY "patient_clinics_clinic_admins_update" ON public.patient_clinics
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM clinic_admins ca WHERE ca.auth_user_id = auth.uid() AND ca.clinic_id = patient_clinics.clinic_id AND ca.is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM clinic_admins ca WHERE ca.auth_user_id = auth.uid() AND ca.clinic_id = patient_clinics.clinic_id AND ca.is_active = true));

CREATE POLICY "patient_clinics_clinic_admins_delete" ON public.patient_clinics
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM clinic_admins ca WHERE ca.auth_user_id = auth.uid() AND ca.clinic_id = patient_clinics.clinic_id AND ca.is_active = true));

CREATE POLICY "patient_clinics_service_role_all" ON public.patient_clinics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- clinic_payments ----
CREATE POLICY "clinic_payments_clinic_admins_select" ON public.clinic_payments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM clinic_admins ca WHERE ca.auth_user_id = auth.uid() AND ca.clinic_id = clinic_payments.clinic_id AND ca.is_active = true));

CREATE POLICY "clinic_payments_service_role_all" ON public.clinic_payments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- practitioner_working_hours ----
CREATE POLICY "working_hours_patients_select" ON public.practitioner_working_hours
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "working_hours_practitioners_select" ON public.practitioner_working_hours
  FOR SELECT TO authenticated
  USING (practitioner_id IN (SELECT id FROM practitioners WHERE auth_user_id = auth.uid()));

CREATE POLICY "working_hours_practitioners_insert" ON public.practitioner_working_hours
  FOR INSERT TO authenticated
  WITH CHECK (practitioner_id IN (SELECT id FROM practitioners WHERE auth_user_id = auth.uid()));

CREATE POLICY "working_hours_practitioners_update" ON public.practitioner_working_hours
  FOR UPDATE TO authenticated
  USING (practitioner_id IN (SELECT id FROM practitioners WHERE auth_user_id = auth.uid()))
  WITH CHECK (practitioner_id IN (SELECT id FROM practitioners WHERE auth_user_id = auth.uid()));

CREATE POLICY "working_hours_practitioners_delete" ON public.practitioner_working_hours
  FOR DELETE TO authenticated
  USING (practitioner_id IN (SELECT id FROM practitioners WHERE auth_user_id = auth.uid()));

CREATE POLICY "working_hours_clinic_admins_select" ON public.practitioner_working_hours
  FOR SELECT TO authenticated
  USING (practitioner_id IN (SELECT p.id FROM practitioners p JOIN clinic_admins ca ON p.clinic_id = ca.clinic_id WHERE ca.auth_user_id = auth.uid()));

CREATE POLICY "working_hours_clinic_admins_insert" ON public.practitioner_working_hours
  FOR INSERT TO authenticated
  WITH CHECK (practitioner_id IN (SELECT p.id FROM practitioners p JOIN clinic_admins ca ON p.clinic_id = ca.clinic_id WHERE ca.auth_user_id = auth.uid()));

CREATE POLICY "working_hours_clinic_admins_update" ON public.practitioner_working_hours
  FOR UPDATE TO authenticated
  USING (practitioner_id IN (SELECT p.id FROM practitioners p JOIN clinic_admins ca ON p.clinic_id = ca.clinic_id WHERE ca.auth_user_id = auth.uid()))
  WITH CHECK (practitioner_id IN (SELECT p.id FROM practitioners p JOIN clinic_admins ca ON p.clinic_id = ca.clinic_id WHERE ca.auth_user_id = auth.uid()));

CREATE POLICY "working_hours_clinic_admins_delete" ON public.practitioner_working_hours
  FOR DELETE TO authenticated
  USING (practitioner_id IN (SELECT p.id FROM practitioners p JOIN clinic_admins ca ON p.clinic_id = ca.clinic_id WHERE ca.auth_user_id = auth.uid()));

CREATE POLICY "working_hours_service_role_all" ON public.practitioner_working_hours
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- appointments ----
CREATE POLICY "appointments_patients_select" ON public.appointments
  FOR SELECT TO authenticated USING (patient_id = get_patient_id_for_user());

CREATE POLICY "appointments_patients_insert" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (patient_id = get_patient_id_for_user());

CREATE POLICY "appointments_patients_update" ON public.appointments
  FOR UPDATE TO authenticated USING (patient_id = get_patient_id_for_user()) WITH CHECK (patient_id = get_patient_id_for_user());

CREATE POLICY "appointments_clinic_admins_select" ON public.appointments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM clinic_admins ca WHERE ca.auth_user_id = auth.uid() AND ca.clinic_id = appointments.clinic_id AND ca.is_active = true));

CREATE POLICY "appointments_clinic_admins_insert" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM clinic_admins ca WHERE ca.auth_user_id = auth.uid() AND ca.clinic_id = ca.clinic_id AND ca.is_active = true));

CREATE POLICY "appointments_clinic_admins_update" ON public.appointments
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM clinic_admins ca WHERE ca.auth_user_id = auth.uid() AND ca.clinic_id = appointments.clinic_id AND ca.is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM clinic_admins ca WHERE ca.auth_user_id = auth.uid() AND ca.clinic_id = ca.clinic_id AND ca.is_active = true));

CREATE POLICY "appointments_clinic_admins_delete" ON public.appointments
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM clinic_admins ca WHERE ca.auth_user_id = auth.uid() AND ca.clinic_id = appointments.clinic_id AND ca.is_active = true));

CREATE POLICY "appointments_practitioners_select" ON public.appointments
  FOR SELECT TO authenticated
  USING (practitioner_id IN (SELECT pr.id FROM practitioners pr WHERE pr.auth_user_id = auth.uid() AND pr.is_active = true));

CREATE POLICY "appointments_practitioners_update" ON public.appointments
  FOR UPDATE TO authenticated
  USING (practitioner_id IN (SELECT id FROM practitioners WHERE auth_user_id = auth.uid() AND is_active = true))
  WITH CHECK (practitioner_id IN (SELECT id FROM practitioners WHERE auth_user_id = auth.uid() AND is_active = true));

CREATE POLICY "appointments_service_role_all" ON public.appointments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- email_notifications ----
CREATE POLICY "Patients can view their own notifications" ON public.email_notifications
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM patients p WHERE p.auth_user_id = auth.uid() AND p.email = email_notifications.recipient_email));

CREATE POLICY "Clinic admins can view their clinic notifications" ON public.email_notifications
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clinic_admins ca
    WHERE ca.auth_user_id = auth.uid() AND ca.is_active = true
    AND (
      (email_notifications.related_entity_type = 'appointment' AND EXISTS (
        SELECT 1 FROM appointments a WHERE a.id = email_notifications.related_entity_id AND a.clinic_id = ca.clinic_id
      ))
      OR ((email_notifications.metadata ->> 'clinic_id')::uuid = ca.clinic_id)
    )
  ));

CREATE POLICY "Service role has full access to email_notifications" ON public.email_notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- email_templates ----
CREATE POLICY "Anyone can read email templates" ON public.email_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can modify email templates" ON public.email_templates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- 8. GRANTS
-- =============================================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
