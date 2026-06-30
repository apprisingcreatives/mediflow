import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateClinicRequest, isAuthSuccess } from '@/lib/api-auth';
import { logStaffAction } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  try {
    const { clinicId } = await params;
    const authResult = await authenticateClinicRequest(request, clinicId);
    if (!isAuthSuccess(authResult)) return authResult;

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branch_id');
    const activeOnly = searchParams.get('active_only') !== 'false';

    let query = supabaseAdmin
      .from('clinic_services')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('name', { ascending: true });

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ services: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  try {
    const { clinicId } = await params;
    const authResult = await authenticateClinicRequest(request, clinicId, 'services.manage');
    if (!isAuthSuccess(authResult)) return authResult;

    const body = await request.json();
    const { name, description, duration_minutes, price, currency, is_active, branch_id } = body;

    if (!name || !duration_minutes || price == null) {
      return NextResponse.json(
        { error: 'Missing required fields: name, duration_minutes, price' },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('clinic_services')
      .insert({
        clinic_id: clinicId,
        name,
        description: description || null,
        duration_minutes,
        price,
        currency: currency || 'PHP',
        is_active: is_active ?? true,
        branch_id: branch_id || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logStaffAction({
      clinicId,
      actorId: authResult.admin.id,
      actorType: 'clinic_admin',
      action: 'service.create',
      entityType: 'clinic_service',
      entityId: data.id,
      metadata: { name, duration_minutes, price, branch_id: branch_id || null },
    });

    return NextResponse.json({ service: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
