#!/bin/bash
# Run pending Supabase migrations against the local instance
# Usage: npm run migrate

set -e

MIGRATIONS_DIR="supabase/migrations"
TRACKING_TABLE="public.schema_migrations"

# Ensure tracking table exists
npx supabase db execute --sql "
  CREATE TABLE IF NOT EXISTS $TRACKING_TABLE (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT now()
  );
"

# Get list of already-applied migrations
APPLIED=$(npx supabase db execute --sql "SELECT version FROM $TRACKING_TABLE;" 2>/dev/null || echo "")

APPLIED_COUNT=0
PENDING_COUNT=0

for file in $(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
  filename=$(basename "$file")
  version="${filename%.sql}"

  if echo "$APPLIED" | grep -q "$version"; then
    APPLIED_COUNT=$((APPLIED_COUNT + 1))
    continue
  fi

  echo "Applying: $filename"
  npx supabase db execute -f "$file"
  npx supabase db execute --sql "INSERT INTO $TRACKING_TABLE (version) VALUES ('$version');"
  PENDING_COUNT=$((PENDING_COUNT + 1))
  echo "  ✓ Done"
done

if [ $PENDING_COUNT -eq 0 ]; then
  echo "No pending migrations. ($APPLIED_COUNT already applied)"
else
  echo ""
  echo "Applied $PENDING_COUNT migration(s). ($APPLIED_COUNT were already applied)"
fi
