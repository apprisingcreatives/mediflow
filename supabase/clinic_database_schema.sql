-- Clinic-Specific Database Schema
-- This file contains the schema to be applied to each clinic's individual Supabase project
-- Run this after creating a new Supabase project for a clinic

-- ============================================
-- PATIENTS AND PROFILES
-- ============================================

CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL, -- From clinic's Auth
  email TEXT UNIQUE NOT NULL,
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
  is_active BOOLEAN DEFAULT false,
  activated_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patients_auth_user ON patients(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_is_active ON patients(is_active);

-- ============================================
-- PRACTITIONERS AND SERVICES
-- ============================================

CREATE TABLE IF NOT EXISTS practitioners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialization TEXT,
  email TEXT,
  phone TEXT,
  bio TEXT,
  qualifications TEXT,
  experience_years INTEGER,
  is_active BOOLEAN DEFAULT true,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinic_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 30,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'PHP',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS practitioner_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES clinic_services(id) ON DELETE CASCADE,
  can_provide BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(practitioner_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_practitioner_services_practitioner ON practitioner_services(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_practitioner_services_service ON practitioner_services(service_id);

-- ============================================
-- APPOINTMENTS AND SCHEDULING
-- ============================================

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID REFERENCES practitioners(id) ON DELETE SET NULL,
  service_id UUID REFERENCES clinic_services(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled, no-show, rescheduled
  notes TEXT,
  ai_recommended BOOLEAN DEFAULT false,
  ai_recommendation_reason TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_practitioner ON appointments(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- ============================================
-- DOCUMENTS AND RECORDS
-- ============================================

CREATE TABLE IF NOT EXISTS patient_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_patient_documents_patient ON patient_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_type ON patient_documents(document_type);

-- ============================================
-- ONBOARDING AND QUESTIONNAIRES
-- ============================================

CREATE TABLE IF NOT EXISTS onboarding_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('text', 'textarea', 'select', 'multiselect', 'yesno', 'number', 'date')),
  options JSONB, -- For select/multiselect questions
  is_required BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL,
  category VARCHAR(100), -- e.g., 'Medical History', 'Current Symptoms', 'Lifestyle'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS required_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_name VARCHAR(255) NOT NULL,
  document_description TEXT,
  is_required BOOLEAN DEFAULT true,
  allowed_file_types VARCHAR(255), -- e.g., 'pdf,jpg,png'
  max_file_size_mb INTEGER DEFAULT 10,
  display_order INTEGER NOT NULL,
  category VARCHAR(100), -- e.g., 'Identification', 'Medical Records', 'Insurance'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES onboarding_questions(id) ON DELETE CASCADE,
  response_value TEXT,
  response_options JSONB, -- For multiselect responses
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(patient_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_patient_responses_patient ON patient_question_responses(patient_id);

-- ============================================
-- AI AND ANALYTICS
-- ============================================

CREATE TABLE IF NOT EXISTS ai_treatment_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  document_id UUID REFERENCES patient_documents(id) ON DELETE SET NULL,
  prediction_text TEXT,
  confidence_score DECIMAL(3,2),
  specialty_recommended VARCHAR(255),
  urgency_level VARCHAR(50),
  analysis_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_predictions_patient ON ai_treatment_predictions(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_specialty ON ai_treatment_predictions(specialty_recommended);

-- ============================================
-- SECURITY AND AUDIT
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'view', 'create', 'update', 'delete', 'download'
  entity_type TEXT NOT NULL, -- 'patient', 'document', 'appointment'
  entity_id UUID,
  performed_by UUID,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_patient ON audit_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs(created_at);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID UNIQUE NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  email_appointments BOOLEAN DEFAULT true,
  sms_appointments BOOLEAN DEFAULT true,
  email_reminders BOOLEAN DEFAULT true,
  sms_reminders BOOLEAN DEFAULT true,
  email_health_updates BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  recipient TEXT NOT NULL, -- email or phone
  subject TEXT,
  content TEXT,
  status TEXT DEFAULT 'sent', -- sent, failed, bounced
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sent_notifications_patient ON sent_notifications(patient_id);
