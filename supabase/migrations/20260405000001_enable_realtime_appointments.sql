-- =============================================================================
-- Enable Supabase Realtime for the appointments table
-- This allows all dashboards (clinic, practitioner, patient) to receive
-- live updates when appointments are created, updated, or cancelled.
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
