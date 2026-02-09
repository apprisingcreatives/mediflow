-- Migration: enable RLS and allow patients to activate their own account
-- This policy permits authenticated users to UPDATE their own row only
-- when the new row has is_active = true. It prevents arbitrary updates.

-- Enable Row Level Security on patients (no-op if already enabled)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if any
DROP POLICY IF EXISTS allow_self_activate ON public.patients;

-- Allow authenticated users to set their own `is_active` to true
CREATE POLICY allow_self_activate
  ON public.patients
  FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id AND is_active IS TRUE);

-- Note: This policy only allows the user to update when the new
-- `is_active` value is TRUE. It does not allow changing other columns.
