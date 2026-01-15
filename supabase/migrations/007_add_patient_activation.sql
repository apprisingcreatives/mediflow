-- Migration: 007_add_patient_activation.sql
-- Add account activation status to patients table
-- Allows checking if a patient account has been activated (email verified)

ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;

-- Create index for quick lookup of active/inactive patients
CREATE INDEX IF NOT EXISTS idx_patients_is_active ON patients(is_active);

-- Update existing patients to be active (they already exist, so assume activated)
UPDATE patients SET is_active = true WHERE is_active IS NULL;

-- Alter constraint to ensure is_active is never null
ALTER TABLE patients ALTER COLUMN is_active SET NOT NULL;
