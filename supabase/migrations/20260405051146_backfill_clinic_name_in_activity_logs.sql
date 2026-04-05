-- Backfill clinic_name into existing activity_logs metadata for appointment_created entries
UPDATE activity_logs
SET metadata = metadata || jsonb_build_object('clinic_name', c.name)
FROM clinics c
WHERE activity_logs.clinic_id = c.id
  AND activity_logs.action_type = 'appointment_created'
  AND (activity_logs.metadata->>'clinic_name' IS NULL OR activity_logs.metadata->>'clinic_name' = '');
