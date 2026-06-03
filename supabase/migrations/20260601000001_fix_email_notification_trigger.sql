-- =============================================================================
-- Fix email notification trigger:
-- 1. Remove appointment_created email (API route handles it with proper content)
-- 2. Add cancellation email
-- 3. Add confirmation email
-- 4. Fix appointment_updated to include real email body instead of placeholder
-- =============================================================================

CREATE OR REPLACE FUNCTION public.notify_appointment_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_notification_type TEXT;
    v_should_notify BOOLEAN := FALSE;
    v_email_enabled BOOLEAN;
    v_patient RECORD;
    v_clinic_name TEXT;
    v_service_name TEXT;
    v_subject TEXT;
    v_body TEXT;
    v_html_body TEXT;
    v_date_formatted TEXT;
    v_time_formatted TEXT;
BEGIN
    SELECT email_notifications_enabled INTO v_email_enabled
    FROM clinics WHERE id = NEW.clinic_id;

    IF v_email_enabled IS DISTINCT FROM TRUE THEN
        RETURN NEW;
    END IF;

    -- Determine notification type
    IF TG_OP = 'INSERT' THEN
        -- appointment_created is handled by the API route with full context
        -- so we skip it here to avoid duplicates
        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Cancellation
        IF OLD.status IS DISTINCT FROM 'cancelled' AND NEW.status = 'cancelled' THEN
            v_notification_type := 'appointment_cancelled';
            v_should_notify := TRUE;

        -- Confirmation
        ELSIF OLD.status IS DISTINCT FROM 'confirmed' AND NEW.status = 'confirmed' THEN
            v_notification_type := 'appointment_confirmed';
            v_should_notify := TRUE;

        -- Rescheduled (date or time changed)
        ELSIF (OLD.appointment_date != NEW.appointment_date OR OLD.appointment_time != NEW.appointment_time)
           AND NEW.status IN ('scheduled', 'confirmed')
           AND NEW.notification_updated_sent = FALSE THEN
            v_notification_type := 'appointment_updated';
            v_should_notify := TRUE;
            NEW.notification_24hr_sent := FALSE;
            NEW.notification_start_sent := FALSE;
        END IF;
    END IF;

    IF NOT v_should_notify OR v_notification_type IS NULL THEN
        RETURN NEW;
    END IF;

    -- Fetch patient, clinic, service info for email content
    SELECT p.email, p.first_name, p.last_name
    INTO v_patient
    FROM patients p WHERE p.id = NEW.patient_id;

    IF v_patient IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT c.name INTO v_clinic_name FROM clinics c WHERE c.id = NEW.clinic_id;
    SELECT cs.name INTO v_service_name FROM clinic_services cs WHERE cs.id = NEW.service_id;

    -- Format date as "June 30, 2026" and time as "2:30 PM"
    v_date_formatted := to_char(NEW.appointment_date, 'FMMonth DD, YYYY');
    v_time_formatted := to_char(NEW.appointment_time, 'FMHH12:MI AM');

    -- Build email content based on notification type
    IF v_notification_type = 'appointment_cancelled' THEN
        v_subject := 'Appointment Cancelled - MediFlow';
        v_body := format(
            'Dear %s, Your appointment on %s at %s at %s has been cancelled.',
            v_patient.first_name, v_date_formatted, v_time_formatted,
            COALESCE(v_clinic_name, 'the clinic')
        );
        v_html_body := format(
            '<h1>Appointment Cancelled</h1><p>Dear %s,</p><p>Your appointment has been cancelled:</p><ul><li><strong>Date:</strong> %s</li><li><strong>Time:</strong> %s</li><li><strong>Clinic:</strong> %s</li>%s</ul><p>If this was a mistake, please book a new appointment.</p>',
            v_patient.first_name, v_date_formatted, v_time_formatted,
            COALESCE(v_clinic_name, 'N/A'),
            CASE WHEN v_service_name IS NOT NULL THEN format('<li><strong>Service:</strong> %s</li>', v_service_name) ELSE '' END
        );

    ELSIF v_notification_type = 'appointment_confirmed' THEN
        v_subject := 'Appointment Confirmed - MediFlow';
        v_body := format(
            'Dear %s, Your appointment on %s at %s at %s has been confirmed. Please arrive 15 minutes early.',
            v_patient.first_name, v_date_formatted, v_time_formatted,
            COALESCE(v_clinic_name, 'the clinic')
        );
        v_html_body := format(
            '<h1>Appointment Confirmed</h1><p>Dear %s,</p><p>Your appointment has been confirmed:</p><ul><li><strong>Date:</strong> %s</li><li><strong>Time:</strong> %s</li><li><strong>Clinic:</strong> %s</li>%s</ul><p>Please arrive 15 minutes before your appointment time.</p>',
            v_patient.first_name, v_date_formatted, v_time_formatted,
            COALESCE(v_clinic_name, 'N/A'),
            CASE WHEN v_service_name IS NOT NULL THEN format('<li><strong>Service:</strong> %s</li>', v_service_name) ELSE '' END
        );

    ELSIF v_notification_type = 'appointment_updated' THEN
        v_subject := 'Appointment Rescheduled - MediFlow';
        v_body := format(
            'Dear %s, Your appointment has been rescheduled to %s at %s at %s.',
            v_patient.first_name, v_date_formatted, v_time_formatted,
            COALESCE(v_clinic_name, 'the clinic')
        );
        v_html_body := format(
            '<h1>Appointment Rescheduled</h1><p>Dear %s,</p><p>Your appointment has been rescheduled:</p><ul><li><strong>New Date:</strong> %s</li><li><strong>New Time:</strong> %s</li><li><strong>Clinic:</strong> %s</li>%s</ul><p>Please arrive 15 minutes before your appointment time.</p>',
            v_patient.first_name, v_date_formatted, v_time_formatted,
            COALESCE(v_clinic_name, 'N/A'),
            CASE WHEN v_service_name IS NOT NULL THEN format('<li><strong>Service:</strong> %s</li>', v_service_name) ELSE '' END
        );
    END IF;

    INSERT INTO email_notifications (
        recipient_email, recipient_name, recipient_type, subject, body, html_body,
        notification_type, related_entity_type, related_entity_id, status, metadata
    ) VALUES (
        v_patient.email,
        v_patient.first_name || ' ' || v_patient.last_name,
        'patient',
        v_subject,
        v_body,
        v_html_body,
        v_notification_type,
        'appointment',
        NEW.id,
        'queued',
        jsonb_build_object('appointment_id', NEW.id, 'notification_type', v_notification_type, 'triggered_at', now())
    );

    IF v_notification_type = 'appointment_updated' THEN
        NEW.notification_updated_sent := TRUE;
    END IF;

    RETURN NEW;
END;
$function$;
