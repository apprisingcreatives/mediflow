-- Remove the automatic working hours trigger.
-- Working hours are now created explicitly in the invite practitioner API route,
-- which allows per-clinic customization (e.g. weekend hours) and keeps the
-- behavior visible in application code.
DROP TRIGGER IF EXISTS trigger_create_default_working_hours ON public.practitioners;
DROP FUNCTION IF EXISTS public.create_default_working_hours();
