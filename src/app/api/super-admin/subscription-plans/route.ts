import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';
import { SuperAdminStatus } from '@/types/super-admin';

async function authenticateSuperAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);
  if (!user) return null;

  const supabaseWithAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  const { data: admin } = await supabaseWithAuth
    .from('super_admins')
    .select('id, status')
    .eq('auth_user_id', user.id)
    .eq('status', SuperAdminStatus.ACTIVE)
    .single();

  return admin;
}

export async function GET(request: NextRequest) {
  const admin = await authenticateSuperAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: plans, error: plansError } = await supabaseAdmin
    .from('subscription_plans')
    .select('*')
    .order('sort_order', { ascending: true });

  if (plansError) {
    return NextResponse.json({ error: plansError.message }, { status: 500 });
  }

  const { data: clinics } = await supabaseAdmin
    .from('clinics')
    .select('subscription_plan');

  const clinicCounts: Record<string, number> = {};
  for (const row of clinics || []) {
    const key = row.subscription_plan ?? 'none';
    clinicCounts[key] = (clinicCounts[key] ?? 0) + 1;
  }

  return NextResponse.json({ plans: plans ?? [], clinicCounts });
}

export async function POST(request: NextRequest) {
  const admin = await authenticateSuperAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { data: plan, error } = await supabaseAdmin
    .from('subscription_plans')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ plan }, { status: 201 });
}
