CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  logo_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  subscription_plan TEXT DEFAULT 'starter',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinic_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinic_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 30,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'PHP',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinic_ai_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES ai_features(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false,
  enabled_by UUID REFERENCES super_admins(id),
  enabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, feature_id)
);

CREATE TABLE IF NOT EXISTS practitioners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  specialization TEXT,
  bio TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO ai_features (name, slug, description, category, is_premium) VALUES
  ('AI-Powered Patient Intake', 'ai-intake', 'Intelligent forms that adapt questions based on patient responses', 'Patient Management', false),
  ('Smart Appointment Scheduling', 'smart-scheduling', 'AI optimizes appointment slots based on practitioner availability and patient preferences', 'Scheduling', false),
  ('Automated Appointment Reminders', 'auto-reminders', 'Send personalized SMS and email reminders to reduce no-shows', 'Communication', false),
  ('AI Triage & Symptom Analysis', 'ai-triage', 'Pre-appointment symptom assessment with AI-powered recommendations', 'Clinical', true),
  ('Predictive No-Show Detection', 'no-show-prediction', 'ML model predicts likelihood of patient no-shows', 'Analytics', true),
  ('AI-Generated Visit Summaries', 'visit-summaries', 'Automatically generate patient visit summaries from notes', 'Documentation', true),
  ('Intelligent Queue Management', 'queue-management', 'Real-time queue optimization based on appointment durations', 'Operations', false),
  ('Voice-to-Text Documentation', 'voice-to-text', 'Convert voice recordings to structured medical notes', 'Documentation', true),
  ('Patient Sentiment Analysis', 'sentiment-analysis', 'Analyze patient feedback and reviews for insights', 'Analytics', true),
  ('Automated Follow-up Scheduling', 'auto-followup', 'AI suggests and schedules follow-up appointments', 'Scheduling', false)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO super_admins (email, password_hash, name) VALUES
  ('admin@mediflow.com', '$2b$10$rQZ8K5YxK5YxK5YxK5YxK.5YxK5YxK5YxK5YxK5YxK5YxK5YxK5Yx', 'Super Admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO clinics (id, name, email, phone, address, city, description, subscription_plan) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Manila Medical Center', 'info@manilamedical.ph', '+63 2 8123 4567', '123 Rizal Avenue', 'Manila', 'A premier healthcare facility offering comprehensive medical services', 'professional'),
  ('22222222-2222-2222-2222-222222222222', 'Quezon City Health Clinic', 'contact@qchealth.ph', '+63 2 8987 6543', '456 Commonwealth Ave', 'Quezon City', 'Family-focused healthcare with modern facilities', 'starter'),
  ('33333333-3333-3333-3333-333333333333', 'Makati Wellness Hub', 'hello@makatiwellness.ph', '+63 2 8555 1234', '789 Ayala Avenue', 'Makati', 'Premium wellness and preventive healthcare services', 'professional')
ON CONFLICT (email) DO NOTHING;

INSERT INTO clinic_admins (clinic_id, email, password_hash, name, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@manilamedical.ph', '$2b$10$rQZ8K5YxK5YxK5YxK5YxK.5YxK5YxK5YxK5YxK5YxK5YxK5YxK5Yx', 'Dr. Maria Santos', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'admin@qchealth.ph', '$2b$10$rQZ8K5YxK5YxK5YxK5YxK.5YxK5YxK5YxK5YxK5YxK5YxK5YxK5Yx', 'Dr. Juan Dela Cruz', 'admin'),
  ('33333333-3333-3333-3333-333333333333', 'admin@makatiwellness.ph', '$2b$10$rQZ8K5YxK5YxK5YxK5YxK.5YxK5YxK5YxK5YxK5YxK5YxK5YxK5Yx', 'Dr. Anna Reyes', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO clinic_services (clinic_id, name, description, duration_minutes, price) VALUES
  ('11111111-1111-1111-1111-111111111111', 'General Consultation', 'Standard doctor consultation', 30, 500.00),
  ('11111111-1111-1111-1111-111111111111', 'Complete Physical Exam', 'Comprehensive health check-up', 60, 2500.00),
  ('11111111-1111-1111-1111-111111111111', 'Vaccination', 'Various vaccines available', 15, 800.00),
  ('22222222-2222-2222-2222-222222222222', 'Family Consultation', 'General family medicine consultation', 30, 400.00),
  ('22222222-2222-2222-2222-222222222222', 'Pediatric Check-up', 'Child health assessment', 45, 600.00),
  ('22222222-2222-2222-2222-222222222222', 'Prenatal Care', 'Pregnancy monitoring and care', 45, 1000.00),
  ('33333333-3333-3333-3333-333333333333', 'Executive Health Package', 'Premium comprehensive screening', 120, 8000.00),
  ('33333333-3333-3333-3333-333333333333', 'Wellness Consultation', 'Holistic health assessment', 60, 1500.00),
  ('33333333-3333-3333-3333-333333333333', 'Nutrition Counseling', 'Personalized diet planning', 45, 1200.00);

INSERT INTO clinic_ai_features (clinic_id, feature_id, is_enabled)
SELECT c.id, f.id, 
  CASE 
    WHEN f.is_premium = false THEN true
    WHEN c.subscription_plan = 'professional' AND f.slug IN ('ai-triage', 'visit-summaries') THEN true
    ELSE false
  END
FROM clinics c
CROSS JOIN ai_features f
ON CONFLICT (clinic_id, feature_id) DO NOTHING;

INSERT INTO practitioners (clinic_id, name, email, specialization, bio) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Dr. Maria Santos', 'maria.santos@manilamedical.ph', 'Internal Medicine', '15 years of experience in internal medicine'),
  ('11111111-1111-1111-1111-111111111111', 'Dr. Jose Garcia', 'jose.garcia@manilamedical.ph', 'Cardiology', 'Board-certified cardiologist'),
  ('22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'juan.delacruz@qchealth.ph', 'Family Medicine', 'Dedicated to family healthcare'),
  ('22222222-2222-2222-2222-222222222222', 'Dr. Lisa Tan', 'lisa.tan@qchealth.ph', 'Pediatrics', 'Specializing in child health'),
  ('33333333-3333-3333-3333-333333333333', 'Dr. Anna Reyes', 'anna.reyes@makatiwellness.ph', 'Preventive Medicine', 'Expert in wellness and prevention'),
  ('33333333-3333-3333-3333-333333333333', 'Dr. Michael Lim', 'michael.lim@makatiwellness.ph', 'Sports Medicine', 'Athletes health specialist');

CREATE INDEX IF NOT EXISTS idx_clinic_admins_clinic ON clinic_admins(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_services_clinic ON clinic_services(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_ai_features_clinic ON clinic_ai_features(clinic_id);
CREATE INDEX IF NOT EXISTS idx_practitioners_clinic ON practitioners(clinic_id);
