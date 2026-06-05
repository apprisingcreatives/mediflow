-- =============================================================================
-- Phase 2: Multi-Doctor Stability — Prevent double-bookings at DB level
-- =============================================================================

-- Partial unique index: only one active appointment per practitioner per slot
-- Cancelled and no-show appointments are excluded so the slot becomes available again
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_practitioner_slot
  ON public.appointments (practitioner_id, appointment_date, appointment_time)
  WHERE status NOT IN ('cancelled', 'no-show');
