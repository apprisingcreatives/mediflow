-- Add clinic_id to patients table to make patient registration clinic-specific
ALTER TABLE patients ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_patients_clinic ON patients(clinic_id);

-- Update existing patients to be associated with clinics based on their appointments
-- This is a one-time migration to associate existing patients with clinics
UPDATE patients
SET clinic_id = (
  SELECT clinic_id
  FROM appointments
  WHERE appointments.patient_id = patients.id
  ORDER BY appointments.created_at DESC
  LIMIT 1
)
WHERE clinic_id IS NULL;