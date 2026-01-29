-- ============================================================================
-- FIX SUPER_ADMINS INVITED_BY FOREIGN KEY
-- ============================================================================
-- The invited_by column should reference super_admins.id, not auth.users.id
-- Because one super admin invites another super admin.
-- ============================================================================

-- Drop the incorrect foreign key constraint
ALTER TABLE super_admins 
DROP CONSTRAINT IF EXISTS super_admins_invited_by_fkey;

-- Add the correct foreign key constraint
-- invited_by should reference super_admins.id (not auth.users.id)
ALTER TABLE super_admins 
ADD CONSTRAINT super_admins_invited_by_fkey 
FOREIGN KEY (invited_by) REFERENCES super_admins (id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_super_admins_invited_by 
ON super_admins (invited_by);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show the corrected constraint
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as references_table,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'super_admins_invited_by_fkey';

-- Show the table structure
\d super_admins;

RAISE NOTICE '✅ Fixed invited_by foreign key constraint';
RAISE NOTICE '   Now references: super_admins(id)';
RAISE NOTICE '   Previously referenced: auth.users(id)';
