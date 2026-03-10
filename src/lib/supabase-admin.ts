/**
 * Supabase Admin Client (Server-Side Only)
 * 
 * ⚠️ WARNING: This file uses the service role key which bypasses RLS.
 * ⚠️ ONLY import this in server-side code (API routes, server actions).
 * ⚠️ NEVER import this in client components or pages.
 * 
 * Usage:
 * - Auth admin API (inviteUserByEmail, deleteUser)
 * - System operations with no user context
 * 
 * For most operations, prefer authenticated client with RLS:
 * @see src/lib/supabase.ts
 */

import { createClient } from '@supabase/supabase-js';

// Ensure we're on the server
if (typeof window !== 'undefined') {
  throw new Error(
    '❌ SECURITY ERROR: supabase-admin.ts imported in client-side code! ' +
    'This file contains the service role key and must only be used server-side.'
  );
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing environment variables. Required:\n' +
    '- NEXT_PUBLIC_SUPABASE_URL\n' +
    '- SUPABASE_SERVICE_ROLE_KEY (server-side only)'
  );
}

/**
 * Admin client with service role key (bypasses RLS)
 * 
 * ⚠️ Use ONLY for:
 * 1. Auth admin API (inviteUserByEmail, deleteUser, etc.)
 * 2. System operations with no user context
 * 
 * ✅ For user queries, use authenticated client with RLS instead
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
