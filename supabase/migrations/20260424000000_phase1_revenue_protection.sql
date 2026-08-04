-- =============================================================================
-- Phase 1: Revenue Protection
-- New tables: patient_notification_preferences, sms_notifications, appointment_waitlist
-- New columns on appointments: sms_24hr_sent, sms_2hr_sent, rebooking_source, cancelled_appointment_id
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Patient Notification Preferences
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.patient_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  phone_e164 TEXT,
  sms_enabled BOOLEAN DEFAULT true,
  sms_opted_out BOOLEAN DEFAULT false,
  opted_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (patient_id)
);

ALTER TABLE public.patient_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patients_own_notification_prefs_select"
  ON public.patient_notification_preferences FOR SELECT TO authenticated
  USING (patient_id = get_patient_id_for_user());

CREATE POLICY "patients_own_notification_prefs_insert"
  ON public.patient_notification_preferences FOR INSERT TO authenticated
  WITH CHECK (patient_id = get_patient_id_for_user());

CREATE POLICY "patients_own_notification_prefs_update"
  ON public.patient_notification_preferences FOR UPDATE TO authenticated
  USING (patient_id = get_patient_id_for_user());

CREATE POLICY "notification_prefs_clinic_admin_select"
  ON public.patient_notification_preferences FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_admins ca
      JOIN public.patient_clinics pc ON pc.clinic_id = ca.clinic_id
      WHERE ca.auth_user_id = auth.uid()
        AND pc.patient_id = patient_notification_preferences.patient_id
        AND ca.is_active = true
    )
  );

CREATE INDEX idx_patient_notification_prefs_patient
  ON public.patient_notification_preferences(patient_id);

CREATE INDEX idx_patient_notification_prefs_phone
  ON public.patient_notification_preferences(phone_e164)
  WHERE phone_e164 IS NOT NULL;


-- -----------------------------------------------------------------------------
-- 2. SMS Notifications (tracking table)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sms_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id),
  phone_e164 TEXT NOT NULL,
  message_body TEXT NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '2h', 'rebooking', 'waitlist_booked', 'custom')),
  twilio_sid TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'undelivered')),
  idempotency_key TEXT UNIQUE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sms_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sms_notifications_clinic_admin_select"
  ON public.sms_notifications FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_admins ca
      WHERE ca.auth_user_id = auth.uid()
        AND ca.clinic_id = sms_notifications.clinic_id
        AND ca.is_active = true
    )
  );

CREATE POLICY "sms_notifications_practitioner_select"
  ON public.sms_notifications FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.practitioners p
      WHERE p.auth_user_id = auth.uid()
        AND p.clinic_id = sms_notifications.clinic_id
        AND p.is_active = true
    )
  );

CREATE INDEX idx_sms_notifications_appointment ON public.sms_notifications(appointment_id);
CREATE INDEX idx_sms_notifications_status ON public.sms_notifications(status);
CREATE INDEX idx_sms_notifications_idempotency ON public.sms_notifications(idempotency_key);
CREATE INDEX idx_sms_notifications_twilio_sid ON public.sms_notifications(twilio_sid) WHERE twilio_sid IS NOT NULL;


-- -----------------------------------------------------------------------------
-- 3. Appointment Waitlist
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.appointment_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id),
  practitioner_id UUID REFERENCES public.practitioners(id),
  service_id UUID REFERENCES public.clinic_services(id),
  preferred_date_start DATE NOT NULL,
  preferred_date_end DATE NOT NULL,
  preferred_time_start TIME,
  preferred_time_end TIME,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'booked', 'expired', 'cancelled')),
  booked_appointment_id UUID REFERENCES public.appointments(id),
  notes TEXT,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (preferred_date_end >= preferred_date_start)
);

ALTER TABLE public.appointment_waitlist ENABLE ROW LEVEL SECURITY;

-- Patients can manage their own entries
CREATE POLICY "waitlist_patients_select"
  ON public.appointment_waitlist FOR SELECT TO authenticated
  USING (patient_id = get_patient_id_for_user());

CREATE POLICY "waitlist_patients_insert"
  ON public.appointment_waitlist FOR INSERT TO authenticated
  WITH CHECK (patient_id = get_patient_id_for_user());

CREATE POLICY "waitlist_patients_update"
  ON public.appointment_waitlist FOR UPDATE TO authenticated
  USING (patient_id = get_patient_id_for_user());

-- Clinic admins can view and manage for their clinic
CREATE POLICY "waitlist_clinic_admin_select"
  ON public.appointment_waitlist FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_admins ca
      WHERE ca.auth_user_id = auth.uid()
        AND ca.clinic_id = appointment_waitlist.clinic_id
        AND ca.is_active = true
    )
  );

CREATE POLICY "waitlist_clinic_admin_update"
  ON public.appointment_waitlist FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_admins ca
      WHERE ca.auth_user_id = auth.uid()
        AND ca.clinic_id = appointment_waitlist.clinic_id
        AND ca.is_active = true
    )
  );

CREATE POLICY "waitlist_clinic_admin_insert"
  ON public.appointment_waitlist FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clinic_admins ca
      WHERE ca.auth_user_id = auth.uid()
        AND ca.clinic_id = appointment_waitlist.clinic_id
        AND ca.is_active = true
    )
  );

-- Practitioners can view waitlist for their clinic
CREATE POLICY "waitlist_practitioner_select"
  ON public.appointment_waitlist FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.practitioners p
      WHERE p.auth_user_id = auth.uid()
        AND p.clinic_id = appointment_waitlist.clinic_id
        AND p.is_active = true
    )
  );

CREATE INDEX idx_waitlist_status_clinic ON public.appointment_waitlist(clinic_id, status);
CREATE INDEX idx_waitlist_practitioner ON public.appointment_waitlist(practitioner_id, status);
CREATE INDEX idx_waitlist_expires ON public.appointment_waitlist(expires_at) WHERE status = 'waiting';
CREATE INDEX idx_waitlist_patient ON public.appointment_waitlist(patient_id, status);


-- -----------------------------------------------------------------------------
-- 4. New columns on appointments
-- -----------------------------------------------------------------------------

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS sms_24hr_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_2hr_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS rebooking_source TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_appointment_id UUID REFERENCES public.appointments(id);
