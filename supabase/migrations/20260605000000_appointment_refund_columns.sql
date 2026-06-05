-- =============================================================================
-- Phase 2: Online Payments — Refund support columns
-- =============================================================================

-- 1. Drop old CHECK constraint and add expanded one with refund states
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_payment_status_check;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_payment_status_check
    CHECK (payment_status IN ('pending', 'paid', 'pay_at_clinic', 'waived', 'refunded', 'refund_pending', 'refund_failed'));

-- 2. Add refund tracking columns
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS refund_scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- 3. Index for cron job to find pending refunds efficiently
CREATE INDEX IF NOT EXISTS idx_appointments_refund_pending
  ON public.appointments (refund_scheduled_at)
  WHERE payment_status = 'refund_pending';
