import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateClinicRequest, isAuthSuccess } from '@/lib/api-auth';
import { requirePlan } from '@/lib/plan-gating';
import { logStaffAction } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  try {
    const { clinicId } = await params;
    const authResult = await authenticateClinicRequest(request, clinicId);
    if (!isAuthSuccess(authResult)) return authResult;

    const { data: branches, error } = await supabaseAdmin
      .from('branches')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('is_default', { ascending: false })
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ branches });
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
    const authResult = await authenticateClinicRequest(request, clinicId, 'branches.manage');
    if (!isAuthSuccess(authResult)) return authResult;

    const planCheck = await requirePlan(clinicId, 'enterprise');
    if (planCheck !== true) return planCheck;

    const { name, address, city, phone } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Branch name is required' }, { status: 400 });
    }

    const { data: branch, error } = await supabaseAdmin
      .from('branches')
      .insert({
        clinic_id: clinicId,
        name: name.trim(),
        address: address || null,
        city: city || null,
        phone: phone || null,
        is_default: false,
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
      action: 'branch.create',
      entityType: 'branch',
      entityId: branch.id,
      metadata: { name: branch.name },
    });

    return NextResponse.json({ branch }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
