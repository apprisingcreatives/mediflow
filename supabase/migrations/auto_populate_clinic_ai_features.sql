-- ============================================================================
-- AUTO-POPULATE CLINIC AI FEATURES ON CLINIC CREATION
-- ============================================================================
-- This migration creates a database trigger that automatically populates
-- the clinic_ai_features table when a new clinic is created with is_active = true.
-- Non-premium features (is_premium = false) are automatically enabled.
-- Premium features remain disabled until manually enabled by super admin.
-- ============================================================================

-- Drop existing trigger and function if they exist (for re-running)
DROP TRIGGER IF EXISTS trigger_populate_clinic_ai_features ON clinics;
DROP FUNCTION IF EXISTS populate_clinic_ai_features();

-- ============================================================================
-- FUNCTION: populate_clinic_ai_features()
-- ============================================================================
-- This function is called by the trigger after a new clinic is inserted.
-- It creates clinic_ai_features records for all available AI features.

CREATE OR REPLACE FUNCTION populate_clinic_ai_features()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the new clinic is active
  IF NEW.is_active = true THEN
    
    -- Insert all AI features for this clinic
    -- Non-premium features are enabled by default, premium features are disabled
    INSERT INTO clinic_ai_features (
      clinic_id,
      feature_id,
      is_enabled,
      enabled_by,
      enabled_at,
      created_at,
      updated_at
    )
    SELECT
      NEW.id,                                      -- clinic_id (the new clinic)
      af.id,                                       -- feature_id (from ai_features)
      NOT af.is_premium,                           -- is_enabled (true if NOT premium, false if premium)
      NULL,                                        -- enabled_by (NULL for auto-enabled features)
      CASE 
        WHEN NOT af.is_premium THEN NOW() 
        ELSE NULL 
      END,                                         -- enabled_at (set for non-premium features only)
      NOW(),                                       -- created_at
      NOW()                                        -- updated_at
    FROM ai_features af
    -- Prevent duplicates if function is called multiple times
    WHERE NOT EXISTS (
      SELECT 1 
      FROM clinic_ai_features caf 
      WHERE caf.clinic_id = NEW.id 
      AND caf.feature_id = af.id
    );

    -- Log the action
    RAISE NOTICE 'Auto-populated AI features for clinic: % (id: %)', NEW.name, NEW.id;
    
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: trigger_populate_clinic_ai_features
-- ============================================================================
-- Fires after a new clinic is inserted into the clinics table

CREATE TRIGGER trigger_populate_clinic_ai_features
  AFTER INSERT ON clinics
  FOR EACH ROW
  EXECUTE FUNCTION populate_clinic_ai_features();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Function and trigger created successfully';
  RAISE NOTICE '📋 Function: populate_clinic_ai_features()';
  RAISE NOTICE '🔔 Trigger: trigger_populate_clinic_ai_features on clinics table';
END $$;

-- ============================================================================
-- TEST THE TRIGGER (OPTIONAL - UNCOMMENT TO TEST)
-- ============================================================================

/*
-- 1. Check existing AI features
SELECT 
  id, 
  name, 
  slug, 
  is_premium,
  category
FROM ai_features
ORDER BY is_premium DESC, name;

-- 2. Create a test clinic
INSERT INTO clinics (
  name, 
  email, 
  phone, 
  city, 
  is_active, 
  subscription_plan
) VALUES (
  'Test Clinic for Auto-Populate',
  'test-autopop@example.com',
  '555-1234',
  'Test City',
  true,
  'starter'
)
RETURNING id, name, is_active;

-- 3. Verify clinic_ai_features were auto-created
-- Replace 'TEST_CLINIC_ID' with the ID from step 2
SELECT 
  caf.id,
  c.name as clinic_name,
  af.name as feature_name,
  af.is_premium,
  caf.is_enabled,
  caf.enabled_at,
  caf.created_at
FROM clinic_ai_features caf
JOIN clinics c ON c.id = caf.clinic_id
JOIN ai_features af ON af.id = caf.feature_id
WHERE c.email = 'test-autopop@example.com'
ORDER BY af.is_premium DESC, af.name;

-- Expected results:
-- - All AI features should be present for the test clinic
-- - Non-premium features should have is_enabled = true and enabled_at set
-- - Premium features should have is_enabled = false and enabled_at = NULL

-- 4. Clean up test data (OPTIONAL)
-- DELETE FROM clinics WHERE email = 'test-autopop@example.com';
-- The cascade will automatically delete associated clinic_ai_features records
*/

-- ============================================================================
-- BACKFILL EXISTING CLINICS (OPTIONAL - RUN MANUALLY IF NEEDED)
-- ============================================================================

/*
-- This will populate AI features for existing active clinics that don't have any features yet
DO $$
DECLARE
  clinic_record RECORD;
  features_added INTEGER;
  total_clinics INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting backfill of clinic AI features...';
  
  FOR clinic_record IN 
    SELECT id, name, is_active 
    FROM clinics 
    WHERE is_active = true
  LOOP
    total_clinics := total_clinics + 1;
    
    -- Insert features for this clinic
    INSERT INTO clinic_ai_features (
      clinic_id,
      feature_id,
      is_enabled,
      enabled_by,
      enabled_at,
      created_at,
      updated_at
    )
    SELECT
      clinic_record.id,
      af.id,
      NOT af.is_premium,
      NULL,
      CASE 
        WHEN NOT af.is_premium THEN NOW() 
        ELSE NULL 
      END,
      NOW(),
      NOW()
    FROM ai_features af
    WHERE NOT EXISTS (
      SELECT 1 
      FROM clinic_ai_features caf 
      WHERE caf.clinic_id = clinic_record.id 
      AND caf.feature_id = af.id
    );
    
    GET DIAGNOSTICS features_added = ROW_COUNT;
    
    IF features_added > 0 THEN
      RAISE NOTICE '  ✅ Added % features for clinic: % (id: %)', 
        features_added, clinic_record.name, clinic_record.id;
    ELSE
      RAISE NOTICE '  ⏭️  Skipped clinic: % (features already exist)', clinic_record.name;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Backfill complete! Processed % clinics', total_clinics;
END $$;
*/

-- ============================================================================
-- NOTES
-- ============================================================================

-- Behavior:
-- 1. Trigger fires AFTER INSERT on clinics table
-- 2. Only processes clinics with is_active = true
-- 3. Creates clinic_ai_features for ALL ai_features in the database
-- 4. Premium features (is_premium = true) are auto-enabled
-- 5. Non-premium features are created but disabled (super admin can enable them)
-- 6. Duplicate prevention: checks if features already exist before inserting

-- What happens to features:
-- ✅ Non-premium features (free/basic):
--    - is_enabled = true
--    - enabled_at = NOW()
--    - enabled_by = NULL (auto-enabled, not by admin)
--
-- ⭐ Premium features (paid):
--    - is_enabled = false
--    - enabled_at = NULL
--    - enabled_by = NULL (must be enabled manually by super admin)

-- Edge cases handled:
-- ✅ If clinic is created with is_active = false, no features are added
-- ✅ If features are manually added, they won't be duplicated
-- ✅ If new AI features are added later, they won't auto-populate (only on clinic creation)

-- To manually add new features to existing clinics, use the backfill script above

COMMENT ON FUNCTION populate_clinic_ai_features() IS 
'Automatically populates clinic_ai_features when a new active clinic is created. Non-premium features are enabled by default, premium features require manual activation.';

COMMENT ON TRIGGER trigger_populate_clinic_ai_features ON clinics IS 
'Triggers after clinic insertion to auto-populate AI features. Non-premium features are enabled by default, premium features require manual activation.';
