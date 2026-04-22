-- Drop the old onboarding completion trigger that forced is_active=false
-- when profile fields were incomplete. In the open booking model,
-- patients are always active after email verification, and profile
-- completion is optional.

DROP TRIGGER IF EXISTS trigger_check_patient_onboarding ON patients;
DROP FUNCTION IF EXISTS check_patient_onboarding_completion();

-- Fix any existing patients stuck with is_active=false
UPDATE patients SET is_active = true WHERE is_active = false;

-- Set default to true so new patients are active on creation
ALTER TABLE patients ALTER COLUMN is_active SET DEFAULT true;
