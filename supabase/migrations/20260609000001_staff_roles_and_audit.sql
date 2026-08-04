-- =============================================================================
-- Phase 3a: Staff Roles & Permissions + Audit Trail
-- =============================================================================

-- 1. Add staff_role column to clinic_admins
ALTER TABLE public.clinic_admins
  ADD COLUMN IF NOT EXISTS staff_role TEXT
  DEFAULT 'admin'
  CHECK (staff_role IN ('owner', 'admin', 'receptionist', 'viewer'));

-- 2. Backfill: first admin per clinic (by created_at) becomes owner
WITH first_admins AS (
  SELECT DISTINCT ON (clinic_id) id
  FROM public.clinic_admins
  ORDER BY clinic_id, created_at ASC
)
UPDATE public.clinic_admins
SET staff_role = 'owner'
WHERE id IN (SELECT id FROM first_admins);

-- 3. Set remaining NULLs to 'admin'
UPDATE public.clinic_admins
SET staff_role = 'admin'
WHERE staff_role IS NULL;

-- 4. Make NOT NULL
ALTER TABLE public.clinic_admins
  ALTER COLUMN staff_role SET NOT NULL;

-- 5. Unique constraint: prevent duplicate email per clinic (invitation collision guard)
ALTER TABLE public.clinic_admins
  ADD CONSTRAINT uq_clinic_admins_clinic_email UNIQUE (clinic_id, email);

-- 6. Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_clinic_admins_staff_role
  ON public.clinic_admins (clinic_id, staff_role);

-- =============================================================================
-- Staff Audit Logs Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.staff_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('clinic_admin', 'practitioner', 'system')),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_audit_clinic_time
  ON public.staff_audit_logs (clinic_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_staff_audit_actor
  ON public.staff_audit_logs (actor_id, created_at DESC);

-- =============================================================================
-- RLS for staff_audit_logs
-- =============================================================================

ALTER TABLE public.staff_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic staff can read own audit logs"
  ON public.staff_audit_logs FOR SELECT
  USING (
    clinic_id IN (
      SELECT ca.clinic_id
      FROM public.clinic_admins ca
      WHERE ca.auth_user_id = auth.uid()
        AND ca.is_active = true
    )
  );

CREATE POLICY "Service role full access to audit logs"
  ON public.staff_audit_logs FOR ALL
  USING (auth.role() = 'service_role');
