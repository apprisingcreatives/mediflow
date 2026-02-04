-- =====================================================
-- Revert to Status Enum as Source of Truth
-- =====================================================
-- This migration:
-- 1. Creates/updates invite_status enum
-- 2. Migrates data from is_active to status
-- 3. Makes status NOT NULL
-- 4. Removes is_active column
-- 5. Adds proper indexes and constraints
-- =====================================================

-- Step 1: Create enum type if it doesn't exist
DO $$
BEGIN
  -- Check if the enum type exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_status') THEN
    CREATE TYPE public.invite_status AS ENUM ('invited', 'active', 'suspended', 'archived');
    RAISE NOTICE '✅ Created invite_status enum type';
  ELSE
    RAISE NOTICE 'ℹ️  invite_status enum type already exists';
  END IF;
END $$;

-- Step 2: Ensure status column exists with correct type
DO $$
BEGIN
  -- Check if status column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'super_admins' 
      AND column_name = 'status'
  ) THEN
    -- Add status column
    ALTER TABLE public.super_admins 
    ADD COLUMN status public.invite_status DEFAULT 'invited';
    RAISE NOTICE '✅ Created status column';
  ELSE
    -- Ensure column is using the enum type
    ALTER TABLE public.super_admins 
    ALTER COLUMN status TYPE public.invite_status 
    USING status::text::public.invite_status;
    RAISE NOTICE 'ℹ️  status column already exists, type verified';
  END IF;
END $$;

-- Step 3: Migrate data from is_active to status
-- Priority: Only update if status is NULL or 'invited'
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  -- Migrate is_active=true to status='active' (only if status is NULL or 'invited')
  UPDATE public.super_admins
  SET status = 'active'::public.invite_status
  WHERE is_active = true 
    AND (status IS NULL OR status = 'invited'::public.invite_status);
  
  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  
  -- Migrate is_active=false to status='invited' (only if status is NULL)
  UPDATE public.super_admins
  SET status = 'invited'::public.invite_status
  WHERE is_active = false 
    AND status IS NULL;
  
  RAISE NOTICE '✅ Migrated % active admins from is_active to status', migrated_count;
END $$;

-- Step 4: Make status NOT NULL with proper default
ALTER TABLE public.super_admins 
ALTER COLUMN status SET DEFAULT 'invited'::public.invite_status;

ALTER TABLE public.super_admins 
ALTER COLUMN status SET NOT NULL;

RAISE NOTICE '✅ Set status as NOT NULL with default value';

-- Step 5: Drop is_active column (after ensuring status is populated)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'super_admins' 
      AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.super_admins DROP COLUMN is_active;
    RAISE NOTICE '✅ Removed is_active column';
  ELSE
    RAISE NOTICE 'ℹ️  is_active column already removed';
  END IF;
END $$;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_super_admins_status 
  ON public.super_admins(status);

-- Partial index for active admins (most common query)
CREATE INDEX IF NOT EXISTS idx_super_admins_active 
  ON public.super_admins(id, email, name) 
  WHERE status = 'active';

-- Index for invited admins (for pending activations)
CREATE INDEX IF NOT EXISTS idx_super_admins_invited 
  ON public.super_admins(email, created_at) 
  WHERE status = 'invited';

RAISE NOTICE '✅ Created performance indexes';

-- Step 7: Add check constraint (belt and suspenders)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'super_admins_status_check'
  ) THEN
    ALTER TABLE public.super_admins 
    ADD CONSTRAINT super_admins_status_check 
    CHECK (status IN ('invited', 'active', 'suspended', 'archived'));
    RAISE NOTICE '✅ Added status check constraint';
  END IF;
END $$;

-- Step 8: Update RLS helper function to use status
CREATE OR REPLACE FUNCTION public.is_active_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.super_admins
    WHERE auth_user_id = auth.uid()
      AND status = 'active'  -- ✅ Changed from is_active to status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_active_super_admin() TO authenticated;

RAISE NOTICE '✅ Updated RLS helper function to use status';

-- Step 9: Create helper function for status checks
CREATE OR REPLACE FUNCTION public.get_super_admin_status()
RETURNS public.invite_status
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_status public.invite_status;
BEGIN
  SELECT status INTO admin_status
  FROM public.super_admins
  WHERE auth_user_id = auth.uid();
  
  RETURN admin_status;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_super_admin_status() TO authenticated;

RAISE NOTICE '✅ Created helper function for status checks';

-- Step 10: Verification
DO $$
DECLARE
  invited_count INTEGER;
  active_count INTEGER;
  suspended_count INTEGER;
  archived_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invited_count FROM public.super_admins WHERE status = 'invited';
  SELECT COUNT(*) INTO active_count FROM public.super_admins WHERE status = 'active';
  SELECT COUNT(*) INTO suspended_count FROM public.super_admins WHERE status = 'suspended';
  SELECT COUNT(*) INTO archived_count FROM public.super_admins WHERE status = 'archived';
  SELECT COUNT(*) INTO total_count FROM public.super_admins;
  
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '📊 Super Admins Status Distribution:';
  RAISE NOTICE '  - Invited:   % (%% of total)', invited_count, ROUND((invited_count::DECIMAL / NULLIF(total_count, 0)) * 100, 1);
  RAISE NOTICE '  - Active:    % (%% of total)', active_count, ROUND((active_count::DECIMAL / NULLIF(total_count, 0)) * 100, 1);
  RAISE NOTICE '  - Suspended: % (%% of total)', suspended_count, ROUND((suspended_count::DECIMAL / NULLIF(total_count, 0)) * 100, 1);
  RAISE NOTICE '  - Archived:  % (%% of total)', archived_count, ROUND((archived_count::DECIMAL / NULLIF(total_count, 0)) * 100, 1);
  RAISE NOTICE '  - TOTAL:     %', total_count;
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '✅ Migration complete! Status is now the source of truth';
  
  -- Sanity check
  IF total_count > 0 AND active_count = 0 AND invited_count = 0 THEN
    RAISE WARNING '⚠️  No admins in invited or active state - please verify data migration';
  END IF;
END $$;
