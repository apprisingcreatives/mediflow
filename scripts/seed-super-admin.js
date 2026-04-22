const { execSync } = require('child_process');

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const API_URL = 'http://127.0.0.1:54321';
const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

function psql(sql) {
  return execSync(`psql "${DB_URL}" -t -c "${sql.replace(/"/g, '\\"')}"`, {
    encoding: 'utf-8',
  }).trim();
}

async function main() {
  console.log('Creating super admin auth user...');

  try {
    const res = await fetch(`${API_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@mediflow.com',
        password: 'Welcome.1',
        email_confirm: true,
        user_metadata: { name: 'Super Admin', role: 'super_admin' },
      }),
    });

    const data = await res.json();
    let userId = data.id;

    if (!userId) {
      console.log('Auth user already exists, looking up ID...');
      userId = psql("SELECT id FROM auth.users WHERE email = 'admin@mediflow.com'");
    }

    if (!userId) {
      console.error('Could not find or create auth user');
      process.exit(1);
    }

    console.log(`Auth user ID: ${userId}`);

    console.log('Creating super_admins record...');
    psql(`INSERT INTO public.super_admins (email, name, status, is_active, auth_user_id) VALUES ('admin@mediflow.com', 'Super Admin', 'active', true, '${userId}') ON CONFLICT (email) DO UPDATE SET is_active = true`);

    console.log('Done! Login with admin@mediflow.com / Welcome.1');
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
}

main();
