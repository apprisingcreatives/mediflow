-- =============================================================================
-- PayMongo Payment Integration
-- Renames Stripe columns → PayMongo, adds appointment payment fields,
-- renames twilio_sid → provider_message_id on sms_notifications
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Rename Stripe columns on clinics
-- -----------------------------------------------------------------------------

ALTER TABLE public.clinics
  RENAME COLUMN stripe_customer_id TO paymongo_customer_id;

ALTER TABLE public.clinics
  RENAME COLUMN stripe_subscription_id TO paymongo_checkout_session_id;

-- -----------------------------------------------------------------------------
-- 2. Rename Stripe column on clinic_payments
-- -----------------------------------------------------------------------------

ALTER TABLE public.clinic_payments
  RENAME COLUMN stripe_payment_intent_id TO paymongo_checkout_id;

-- -----------------------------------------------------------------------------
-- 3. Add payment columns to appointments
-- -----------------------------------------------------------------------------

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'pay_at_clinic', 'waived', 'refunded')),
  ADD COLUMN IF NOT EXISTS payment_method TEXT
    CHECK (payment_method IS NULL OR payment_method IN ('gcash', 'grab_pay', 'paymaya', 'card', 'cash')),
  ADD COLUMN IF NOT EXISTS payment_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS paymongo_checkout_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

CREATE INDEX idx_appointments_payment_status ON public.appointments(payment_status);
CREATE INDEX idx_appointments_paymongo_checkout ON public.appointments(paymongo_checkout_id)
  WHERE paymongo_checkout_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 4. Rename twilio_sid → provider_message_id on sms_notifications
-- -----------------------------------------------------------------------------

ALTER TABLE public.sms_notifications
  RENAME COLUMN twilio_sid TO provider_message_id;

-- Also rename the index
DROP INDEX IF EXISTS idx_sms_notifications_twilio_sid;
CREATE INDEX idx_sms_notifications_provider_msg
  ON public.sms_notifications(provider_message_id)
  WHERE provider_message_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 5. Add 'booking_confirmation' to sms_notifications reminder_type
-- -----------------------------------------------------------------------------

ALTER TABLE public.sms_notifications
  DROP CONSTRAINT IF EXISTS sms_notifications_reminder_type_check;

ALTER TABLE public.sms_notifications
  ADD CONSTRAINT sms_notifications_reminder_type_check
  CHECK (reminder_type IN ('24h', '2h', 'rebooking', 'waitlist_booked', 'booking_confirmation', 'custom'));
