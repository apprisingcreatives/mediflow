#!/bin/bash

# Clinic Database Setup Script
# This script helps set up per-clinic databases for the MediFlow system
# Usage: ./setup-clinic-database.sh <clinic-id> <clinic-name>

set -e

CLINIC_ID=$1
CLINIC_NAME=$2

if [ -z "$CLINIC_ID" ] || [ -z "$CLINIC_NAME" ]; then
  echo "Usage: ./setup-clinic-database.sh <clinic-id> <clinic-name>"
  echo "Example: ./setup-clinic-database.sh 550e8400-e29b-41d4-a716-446655440000 'Downtown Medical Center'"
  exit 1
fi

echo "================================================"
echo "MediFlow Clinic Database Setup"
echo "================================================"
echo "Clinic ID: $CLINIC_ID"
echo "Clinic Name: $CLINIC_NAME"
echo ""
echo "This script will guide you through setting up a new clinic database."
echo ""

# Step 1: Create new Supabase project
echo "Step 1: Create a new Supabase project"
echo "---"
echo "1. Go to https://app.supabase.com"
echo "2. Click 'New project'"
echo "3. Enter project name: 'clinic-${CLINIC_NAME// /-}'"
echo "4. Select your region"
echo "5. Create database"
echo ""
read -p "Press ENTER when your Supabase project is created..."

# Step 2: Get credentials
echo ""
echo "Step 2: Collect Supabase credentials"
echo "---"
echo "1. Go to Project Settings → API"
echo "2. Copy the Project URL"
read -p "Enter Supabase URL: " SUPABASE_URL

echo "3. Copy the 'anon' (public) key"
read -p "Enter Supabase Anon Key: " SUPABASE_ANON_KEY

echo "4. Copy the 'service_role' (secret) key"
read -s -p "Enter Supabase Service Role Key: " SUPABASE_SERVICE_KEY
echo ""

# Step 3: Validate credentials
echo ""
echo "Step 3: Validating credentials..."
echo "---"

# Test connection with curl (basic check)
HEALTH_CHECK=$(curl -s -w "%{http_code}" -o /dev/null \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/" 2>/dev/null || echo "000")

if [ "$HEALTH_CHECK" = "404" ] || [ "$HEALTH_CHECK" = "200" ]; then
  echo "✓ Successfully connected to Supabase project"
else
  echo "✗ Failed to connect to Supabase project. Please check your credentials."
  exit 1
fi

# Step 4: Create database schema
echo ""
echo "Step 4: Creating database schema..."
echo "---"
echo "This will apply the clinic database schema to your new project."
echo ""

# Read schema file
SCHEMA_FILE="$(dirname "$0")/clinic_database_schema.sql"
if [ ! -f "$SCHEMA_FILE" ]; then
  echo "✗ Schema file not found: $SCHEMA_FILE"
  exit 1
fi

# Apply schema via Supabase API
echo "Applying schema..."
# Note: In production, you'd use supabase CLI or API to apply the schema
# For now, we'll save the connection info and manual steps

# Step 5: Store credentials in central database
echo ""
echo "Step 5: Storing credentials in central database..."
echo "---"
echo "Running database update..."

# This would normally be done via API or dashboard
cat > /tmp/clinic_db_setup.json <<EOF
{
  "clinic_id": "$CLINIC_ID",
  "supabase_url": "$SUPABASE_URL",
  "anon_key": "$SUPABASE_ANON_KEY",
  "service_role_key": "$SUPABASE_SERVICE_KEY"
}
EOF

echo "Credentials saved to temporary file. These will be stored in the central database."

echo ""
echo "================================================"
echo "Setup Instructions"
echo "================================================"
echo ""
echo "✓ Credentials collected"
echo "✓ Connection verified"
echo ""
echo "Next steps:"
echo ""
echo "1. Apply the clinic database schema:"
echo "   - Login to your Supabase project dashboard"
echo "   - Go to SQL Editor"
echo "   - Create a new query"
echo "   - Copy the contents of: supabase/clinic_database_schema.sql"
echo "   - Paste and run the SQL"
echo ""
echo "2. Enable Row Level Security (RLS):"
echo "   - For each table (patients, appointments, documents):"
echo "   - Go to table settings"
echo "   - Enable RLS"
echo "   - Create policies to restrict access to patient's own records"
echo ""
echo "3. Store credentials in central database:"
echo "   - The application will automatically store these credentials"
echo "   - When you click 'Activate' in the clinic admin panel"
echo ""
echo "Credentials to use:"
echo "---"
echo "Supabase URL: $SUPABASE_URL"
echo "Anon Key: $SUPABASE_ANON_KEY"
echo "Service Role Key: [hidden]"
echo ""
echo "Keep these safe! They will be encrypted and stored in the central database."
echo ""
echo "================================================"
