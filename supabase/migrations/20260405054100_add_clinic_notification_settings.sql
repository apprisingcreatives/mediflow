-- Add notification setting columns to clinics table
ALTER TABLE public.clinics
  ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true,
  ADD COLUMN appointment_reminders_enabled BOOLEAN DEFAULT true;

-- Update notify_appointment_email() to check email_notifications_enabled
CREATE OR REPLACE FUNCTION public.notify_appointment_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_notification_type TEXT;
    v_should_notify BOOLEAN := FALSE;
    v_email_enabled BOOLEAN;
    v_edge_function_url TEXT;
BEGIN
    v_edge_function_url := current_setting('app.settings.edge_function_url', true);
    IF v_edge_function_url IS NULL THEN
        v_edge_function_url := 'https://kandwedeqpguuupzqpcc.supabase.co/functions/v1/send-appointment-email';
    END IF;

    -- Check if clinic has email notifications enabled
    SELECT email_notifications_enabled INTO v_email_enabled
    FROM clinics WHERE id = NEW.clinic_id;

    IF v_email_enabled IS DISTINCT FROM TRUE THEN
        RETURN NEW;
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

-- Update check_24hr_reminders() to check appointment_reminders_enabled
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
        JOIN clinics c ON c.id = a.clinic_id
        WHERE a.notification_24hr_sent = FALSE
          AND a.status IN ('scheduled', 'confirmed')
          AND c.appointment_reminders_enabled = TRUE
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

-- Update check_appointment_start_notifications() to check appointment_reminders_enabled
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
        JOIN clinics c ON c.id = a.clinic_id
        WHERE a.notification_start_sent = FALSE
          AND a.status IN ('scheduled', 'confirmed')
          AND c.appointment_reminders_enabled = TRUE
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
