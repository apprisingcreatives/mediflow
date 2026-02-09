import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ Client with anon key (respects RLS)
// Safe to use in both client and server components
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage
    persistSession: true,
    // Auto refresh token before it expires
    autoRefreshToken: true,
    // Don't detect session from URL (prevents issues with tab switching)
    detectSessionInUrl: true,
  },
});
