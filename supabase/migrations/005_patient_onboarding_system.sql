-- Patient Onboarding System with Clinic-Specific Questions and Documents
-- Migration: 005_patient_onboarding_system.sql

-- Table for clinic-specific onboarding questions
CREATE TABLE IF NOT EXISTS clinic_onboarding_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
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

-- Table for clinic-specific required documents
CREATE TABLE IF NOT EXISTS clinic_required_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
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

-- Table for patient responses to onboarding questions
CREATE TABLE IF NOT EXISTS patient_question_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES clinic_onboarding_questions(id) ON DELETE CASCADE,
  response_value TEXT,
  response_options JSONB, -- For multiselect responses
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(patient_id, question_id)
);

-- Table for patient uploaded documents
CREATE TABLE IF NOT EXISTS patient_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  document_type_id UUID NOT NULL REFERENCES clinic_required_documents(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_by UUID REFERENCES clinic_admins(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for AI treatment predictions
CREATE TABLE IF NOT EXISTS ai_treatment_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  prediction_data JSONB NOT NULL, -- AI model predictions
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  recommended_treatments JSONB, -- Array of recommended treatments
  risk_factors JSONB, -- Identified risk factors
  predicted_conditions JSONB, -- Predicted conditions
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID REFERENCES clinic_admins(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clinic_questions_clinic ON clinic_onboarding_questions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_questions_active ON clinic_onboarding_questions(clinic_id, is_active);
CREATE INDEX IF NOT EXISTS idx_clinic_documents_clinic ON clinic_required_documents(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_documents_active ON clinic_required_documents(clinic_id, is_active);
CREATE INDEX IF NOT EXISTS idx_patient_responses_patient ON patient_question_responses(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_responses_clinic ON patient_question_responses(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient ON patient_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_clinic ON patient_documents(clinic_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_patient ON ai_treatment_predictions(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_clinic ON ai_treatment_predictions(clinic_id);

-- Update patients table to track onboarding completion
ALTER TABLE patients ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Insert some default questions for clinics (optional - clinics can customize)
-- This is just sample data that clinics can modify
INSERT INTO clinic_onboarding_questions (clinic_id, question_text, question_type, is_required, display_order, category)
SELECT
  c.id as clinic_id,
  q.question_text,
  q.question_type,
  q.is_required,
  q.display_order,
  q.category
FROM clinics c
CROSS JOIN (
  VALUES
    ('What is your current age?', 'number', true, 1, 'Demographics'),
    ('What is your gender?', 'select', true, 2, 'Demographics'),
    ('Do you have any known allergies?', 'textarea', true, 3, 'Medical History'),
    ('Are you currently taking any medications?', 'textarea', true, 4, 'Medical History'),
    ('Do you have any chronic conditions (diabetes, hypertension, etc.)?', 'textarea', true, 5, 'Medical History'),
    ('Have you had any surgeries in the past?', 'textarea', false, 6, 'Medical History'),
    ('Do you smoke or use tobacco products?', 'yesno', true, 7, 'Lifestyle'),
    ('How often do you exercise?', 'select', false, 8, 'Lifestyle'),
    ('What brings you to the clinic today?', 'textarea', true, 9, 'Current Visit'),
    ('How would you rate your current health?', 'select', true, 10, 'Current Visit')
) AS q(question_text, question_type, is_required, display_order, category)
ON CONFLICT DO NOTHING;

-- Insert some default document requirements
INSERT INTO clinic_required_documents (clinic_id, document_name, document_description, is_required, allowed_file_types, display_order, category)
SELECT
  c.id as clinic_id,
  d.document_name,
  d.document_description,
  d.is_required,
  d.allowed_file_types,
  d.display_order,
  d.category
FROM clinics c
CROSS JOIN (
  VALUES
    ('Government ID', 'Valid government-issued ID (passport, driver''s license, etc.)', true, 'pdf,jpg,png', 1, 'Identification'),
    ('Medical Insurance Card', 'Current health insurance information', false, 'pdf,jpg,png', 2, 'Insurance'),
    ('Previous Medical Records', 'Any relevant medical records from other healthcare providers', false, 'pdf,jpg,png', 3, 'Medical Records'),
    ('Emergency Contact Information', 'Contact details for emergency situations', true, 'pdf,doc,docx', 4, 'Emergency')
) AS d(document_name, document_description, is_required, allowed_file_types, display_order, category)
ON CONFLICT DO NOTHING;</content>
<parameter name="filePath">d:\projects\booking-system\mediflow\supabase\migrations\005_patient_onboarding_system.sql