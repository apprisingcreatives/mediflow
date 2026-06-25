-- =============================================================================
-- Branch Filtering: Add branch_id to clinic_services and clinic_admins
-- Enables per-branch filtering of services and staff assignments.
-- branch_id is nullable for backward compatibility (NULL = clinic-wide).
-- =============================================================================

-- 1. Add branch_id to clinic_services
ALTER TABLE public.clinic_services
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

-- 2. Add branch_id to clinic_admins
ALTER TABLE public.clinic_admins
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

-- 3. Indexes for branch-based filtering
CREATE INDEX IF NOT EXISTS idx_clinic_services_branch ON public.clinic_services(branch_id);
CREATE INDEX IF NOT EXISTS idx_clinic_admins_branch ON public.clinic_admins(branch_id);

-- 4. Backfill: assign existing services to their clinic's default branch
UPDATE public.clinic_services cs
SET branch_id = b.id
FROM public.branches b
WHERE b.clinic_id = cs.clinic_id
  AND b.is_default = true
  AND cs.branch_id IS NULL;

-- 5. Backfill: assign existing staff to their clinic's default branch
UPDATE public.clinic_admins ca
SET branch_id = b.id
FROM public.branches b
WHERE b.clinic_id = ca.clinic_id
  AND b.is_default = true
  AND ca.branch_id IS NULL;
