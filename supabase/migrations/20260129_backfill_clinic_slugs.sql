-- ============================================================================
-- BACKFILL MISSING CLINIC SLUGS
-- ============================================================================
-- This migration adds slugs to any existing clinics that don't have one.
-- Run this after updating your clinic registration to include slug generation.
-- ============================================================================

-- Function to generate slug from clinic name
CREATE OR REPLACE FUNCTION generate_clinic_slug(clinic_name TEXT, clinic_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
  slug_exists BOOLEAN;
BEGIN
  -- Generate base slug
  base_slug := lower(trim(clinic_name));
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '[\s_-]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  
  -- If empty after cleaning, use a default
  IF base_slug = '' THEN
    base_slug := 'clinic';
  END IF;
  
  final_slug := base_slug;
  
  -- Ensure uniqueness (excluding the current clinic_id)
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM clinics 
      WHERE slug = final_slug 
      AND id != clinic_id
    ) INTO slug_exists;
    
    EXIT WHEN NOT slug_exists;
    
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- BACKFILL EXISTING CLINICS WITHOUT SLUGS
-- ============================================================================

DO $$
DECLARE
  clinic_record RECORD;
  generated_slug TEXT;
  updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting clinic slug backfill...';
  
  FOR clinic_record IN 
    SELECT id, name 
    FROM clinics 
    WHERE slug IS NULL OR slug = ''
  LOOP
    -- Generate unique slug for this clinic
    generated_slug := generate_clinic_slug(clinic_record.name, clinic_record.id);
    
    -- Update the clinic
    UPDATE clinics 
    SET slug = generated_slug
    WHERE id = clinic_record.id;
    
    updated_count := updated_count + 1;
    
    RAISE NOTICE '  ✅ Updated clinic "%" with slug: %', 
      clinic_record.name, generated_slug;
  END LOOP;
  
  IF updated_count = 0 THEN
    RAISE NOTICE '✅ No clinics needed slug updates - all good!';
  ELSE
    RAISE NOTICE '✅ Backfill complete! Updated % clinic(s)', updated_count;
  END IF;
END $$;

-- ============================================================================
-- OPTIONAL: Add unique constraint on slug (if not already present)
-- ============================================================================

-- Check if constraint exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'clinics_slug_key'
  ) THEN
    ALTER TABLE clinics ADD CONSTRAINT clinics_slug_key UNIQUE (slug);
    RAISE NOTICE '✅ Added unique constraint on clinics.slug';
  ELSE
    RAISE NOTICE 'ℹ️  Unique constraint on clinics.slug already exists';
  END IF;
END $$;

-- ============================================================================
-- OPTIONAL: Make slug NOT NULL (after backfill completes)
-- ============================================================================

-- Uncomment this after confirming all clinics have slugs
/*
DO $$
BEGIN
  -- Check if any clinics still have NULL slugs
  IF EXISTS (SELECT 1 FROM clinics WHERE slug IS NULL) THEN
    RAISE EXCEPTION 'Cannot make slug NOT NULL - some clinics still have NULL slugs!';
  END IF;
  
  -- Make slug NOT NULL
  ALTER TABLE clinics ALTER COLUMN slug SET NOT NULL;
  RAISE NOTICE '✅ Made clinics.slug NOT NULL';
END $$;
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show all clinics with their slugs
SELECT 
  id,
  name,
  slug,
  email,
  created_at
FROM clinics
ORDER BY created_at DESC;

-- Count clinics by slug status
SELECT 
  COUNT(*) FILTER (WHERE slug IS NOT NULL AND slug != '') as with_slug,
  COUNT(*) FILTER (WHERE slug IS NULL OR slug = '') as without_slug,
  COUNT(*) as total
FROM clinics;

-- ============================================================================
-- CLEANUP
-- ============================================================================

-- Drop the helper function after backfill (optional)
-- DROP FUNCTION IF EXISTS generate_clinic_slug(TEXT, UUID);

COMMENT ON COLUMN clinics.slug IS 
'URL-friendly identifier for the clinic. Auto-generated from clinic name, guaranteed unique.';
