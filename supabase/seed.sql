-- =============================================================================
-- Local Development Seed
-- Runs automatically after migrations on supabase start / db reset
-- =============================================================================
-- NOTE: The super admin auth user must be created via the Auth Admin API,
-- not raw SQL, because GoTrue expects specific column defaults that raw
-- inserts don't satisfy. Use this after supabase start:
--
--   curl -s -X POST http://127.0.0.1:54321/auth/v1/admin/users \
--     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
--     -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
--     -H "Content-Type: application/json" \
--     -d '{"email":"admin@mediflow.com","password":"Welcome.1","email_confirm":true,"user_metadata":{"name":"Super Admin"}}'
--
-- Then this seed handles the super_admins table record.
-- The auth_user_id is matched dynamically below.

-- Create super_admins record if the auth user exists
INSERT INTO public.super_admins (email, name, status, auth_user_id)
SELECT 'admin@mediflow.com', 'Super Admin', 'active', id
FROM auth.users
WHERE email = 'admin@mediflow.com'
ON CONFLICT (email) DO NOTHING;
