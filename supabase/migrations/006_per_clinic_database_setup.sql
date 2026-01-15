-- Migration: 006_per_clinic_database_setup.sql
-- This migration prepares the central database for per-clinic database architecture

-- Add clinic database credentials to clinics table
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS supabase_url TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS supabase_anon_key TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS supabase_service_key TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS database_created_at TIMESTAMPTZ;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS database_status TEXT DEFAULT 'pending'; -- pending, created, active, error

-- Create clinic database reference table (for data federation if needed)
CREATE TABLE IF NOT EXISTS clinic_database_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID UNIQUE REFERENCES clinics(id) ON DELETE CASCADE,
  supabase_project_id TEXT NOT NULL,
  supabase_url TEXT NOT NULL,
  anon_key TEXT NOT NULL,
  service_role_key TEXT NOT NULL,
  database_size_mb INTEGER DEFAULT 500,
  backup_retention_days INTEGER DEFAULT 7,
  last_backed_up TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create clinic configuration table for settings like timezone, language, etc
CREATE TABLE IF NOT EXISTS clinic_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID UNIQUE REFERENCES clinics(id) ON DELETE CASCADE,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  appointment_buffer_minutes INTEGER DEFAULT 15,
  max_advance_booking_days INTEGER DEFAULT 90,
  allow_online_bookings BOOLEAN DEFAULT true,
  allow_walk_ins BOOLEAN DEFAULT false,
  require_insurance_info BOOLEAN DEFAULT true,
  require_emergency_contact BOOLEAN DEFAULT true,
  max_daily_appointments INTEGER DEFAULT 50,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create clinic user mappings for multi-database user management
CREATE TABLE IF NOT EXISTS clinic_patient_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  central_auth_user_id UUID NOT NULL, -- Auth user ID from central system
  clinic_patient_id UUID NOT NULL, -- Patient ID in clinic's database
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, central_auth_user_id),
  UNIQUE(clinic_id, clinic_patient_id)
);

CREATE INDEX IF NOT EXISTS idx_clinic_patient_refs_clinic ON clinic_patient_references(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_patient_refs_auth_user ON clinic_patient_references(central_auth_user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_patient_refs_email ON clinic_patient_references(email);

-- Mark existing patients for migration
ALTER TABLE patients ADD COLUMN IF NOT EXISTS migrated_to_clinic_db BOOLEAN DEFAULT false;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinic_database_patient_id UUID;

-- Add audit log for database operations
CREATE TABLE IF NOT EXISTS clinic_database_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  operation TEXT NOT NULL, -- 'create', 'migrate', 'backup', 'restore', 'error'
  operation_details JSONB,
  status TEXT NOT NULL, -- 'pending', 'success', 'failed'
  error_message TEXT,
  performed_by UUID REFERENCES super_admins(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinic_db_audit_clinic ON clinic_database_audit_log(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_db_audit_status ON clinic_database_audit_log(status);
