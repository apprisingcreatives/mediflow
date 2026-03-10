-- Migration: activate patient when user confirms email (safe version)
-- Creates a public RPC `activate_patient_for_current_user` that sets
-- patients.is_active = true for the currently authenticated user.
-- This avoids creating objects in the `auth` schema which requires elevated
-- privileges and causes the "permission denied for schema auth" error.

create or replace function public.activate_patient_for_current_user()
returns void
language plpgsql
as $$
begin
  update public.patients
  set is_active = true,
      updated_at = now()
  where auth_user_id = auth.uid();
end;
$$;

grant execute on function public.activate_patient_for_current_user() to authenticated;

comment on function public.activate_patient_for_current_user() is
  'Sets patients.is_active=true for the current authenticated user (uses auth.uid()).';
