import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: admin, error: adminError } = await supabaseAdmin
    .from('clinic_admins')
    .select('id, clinic_id, is_active, created_at, updated_at')
    .eq('auth_user_id', user.id)
    .single();

  if (adminError || !admin) {
    return NextResponse.json({ error: 'Admin record not found' }, { status: 404 });
  }

  if (admin.is_active) {
    return NextResponse.json({ clinic_id: admin.clinic_id });
  }

  const neverActivated = admin.created_at === admin.updated_at;
  if (!neverActivated) {
    return NextResponse.json(
      { error: 'Account has been deactivated. Contact your clinic administrator.' },
      { status: 403 },
    );
  }

  const { error: updateError } = await supabaseAdmin
    .from('clinic_admins')
    .update({ is_active: true })
    .eq('id', admin.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ clinic_id: admin.clinic_id });
}
