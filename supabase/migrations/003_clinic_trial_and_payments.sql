-- Add trial and payment fields to clinics table
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS is_trial_active BOOLEAN DEFAULT true;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS is_subscription_active BOOLEAN DEFAULT true;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'trial';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create payment history table
CREATE TABLE IF NOT EXISTS clinic_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'PHP',
  payment_method TEXT,
  status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  description TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create email notifications table
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  recipient_type TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  html_body TEXT,
  notification_type TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  html_body TEXT,
  variables JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default email templates
INSERT INTO email_templates (name, subject, body, html_body, variables) VALUES
('welcome_patient', 'Welcome to MediFlow', 'Dear {{patient_name}}, Welcome to MediFlow! Your account has been created successfully.', '<h1>Welcome to MediFlow</h1><p>Dear {{patient_name}},</p><p>Welcome to MediFlow! Your account has been created successfully.</p>', '["patient_name"]'),
('appointment_confirmation', 'Appointment Confirmed', 'Dear {{patient_name}}, Your appointment with {{doctor_name}} at {{clinic_name}} has been confirmed for {{date}} at {{time}}.', '<h1>Appointment Confirmed</h1><p>Dear {{patient_name}},</p><p>Your appointment with {{doctor_name}} at {{clinic_name}} has been confirmed for {{date}} at {{time}}.</p>', '["patient_name", "doctor_name", "clinic_name", "date", "time"]'),
('appointment_reminder', 'Appointment Reminder', 'Dear {{patient_name}}, This is a reminder for your upcoming appointment with {{doctor_name}} on {{date}} at {{time}}.', '<h1>Appointment Reminder</h1><p>Dear {{patient_name}},</p><p>This is a reminder for your upcoming appointment with {{doctor_name}} on {{date}} at {{time}}.</p>', '["patient_name", "doctor_name", "date", "time"]'),
('trial_ending', 'Your Trial is Ending Soon', 'Dear {{clinic_name}}, Your 14-day free trial will end on {{end_date}}. Subscribe now to continue using all features.', '<h1>Your Trial is Ending Soon</h1><p>Dear {{clinic_name}},</p><p>Your 14-day free trial will end on {{end_date}}. Subscribe now to continue using all features.</p>', '["clinic_name", "end_date"]'),
('trial_expired', 'Your Trial Has Expired', 'Dear {{clinic_name}}, Your free trial has expired. Some features are now disabled. Subscribe to restore full access.', '<h1>Your Trial Has Expired</h1><p>Dear {{clinic_name}},</p><p>Your free trial has expired. Some features are now disabled. Subscribe to restore full access.</p>', '["clinic_name"]'),
('payment_success', 'Payment Successful', 'Dear {{clinic_name}}, Your payment of {{amount}} has been processed successfully. Thank you!', '<h1>Payment Successful</h1><p>Dear {{clinic_name}},</p><p>Your payment of {{amount}} has been processed successfully. Thank you!</p>', '["clinic_name", "amount"]'),
('clinic_welcome', 'Welcome to MediFlow - Your 14 Day Trial Has Started', 'Dear {{admin_name}}, Welcome to MediFlow! Your clinic {{clinic_name}} has been registered. Your 14-day free trial starts today.', '<h1>Welcome to MediFlow!</h1><p>Dear {{admin_name}},</p><p>Your clinic <strong>{{clinic_name}}</strong> has been registered successfully.</p><p>Your 14-day free trial starts today and will end on {{trial_end_date}}.</p><p>Enjoy all premium features during your trial period!</p>', '["admin_name", "clinic_name", "trial_end_date"]')
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_clinic_payments_clinic ON clinic_payments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_recipient ON email_notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);
