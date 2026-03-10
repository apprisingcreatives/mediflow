import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: () => cookieStore },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch admin record safely via service role
  const { data: admin, error } = await supabaseAdmin
    .from('super_admins')
    .select('status')
    .eq('auth_user_id', user.id)
    .single();

  if (error || !admin) {
    return NextResponse.json(
      { error: 'Admin record not found' },
      { status: 404 },
    );
  }

  // Check if already activated
  if (admin.status === 'active') {
    return NextResponse.json(
      { error: 'Account already activated' },
      { status: 400 },
    );
  }

  // Only allow activation from 'invited' status
  if (admin.status !== 'invited') {
    return NextResponse.json(
      { error: `Cannot activate account with status: ${admin.status}` },
      { status: 400 },
    );
  }

  // Activate the account
  const { error: updateError } = await supabaseAdmin
    .from('super_admins')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('auth_user_id', user.id);

  if (updateError) {
    return NextResponse.json({ error: 'Activation failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
