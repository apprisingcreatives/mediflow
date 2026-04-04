#!/bin/bash
# Seed super admin user for local development
# Run after: npx supabase start

SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
API_URL="http://127.0.0.1:54321"

echo "Creating super admin auth user..."
USER_ID=$(curl -s -X POST "$API_URL/auth/v1/admin/users" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mediflow.com","password":"Welcome.1","email_confirm":true,"user_metadata":{"name":"Super Admin"}}' \
  | node -e "process.stdin.on('data',d=>{const j=JSON.parse(d);console.log(j.id||'EXISTS')})")

if [ "$USER_ID" = "EXISTS" ]; then
  echo "Auth user already exists, looking up ID..."
  USER_ID=$(PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -t -c \
    "SELECT id FROM auth.users WHERE email = 'admin@mediflow.com';" | tr -d ' ')
fi

echo "Auth user ID: $USER_ID"

echo "Creating super_admins record..."
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c \
  "INSERT INTO public.super_admins (email, name, status, is_active, auth_user_id)
   VALUES ('admin@mediflow.com', 'Super Admin', 'active', true, '$USER_ID')
   ON CONFLICT (email) DO UPDATE SET is_active = true;"

echo "Done! Login with admin@mediflow.com / Welcome.1"
