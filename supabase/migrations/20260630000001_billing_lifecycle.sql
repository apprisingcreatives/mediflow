-- Billing lifecycle columns for renewal reminders and grace period tracking
-- Note: trial_end_date already exists from initial schema

ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS pending_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_count INTEGER NOT NULL DEFAULT 0;
