import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateClinicRequest, isAuthSuccess } from '@/lib/api-auth';
import { logStaffAction } from '@/lib/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string; serviceId: string }> },
) {
  try {
    const { clinicId, serviceId } = await params;
    const authResult = await authenticateClinicRequest(request, clinicId, 'services.manage');
    if (!isAuthSuccess(authResult)) return authResult;

    const body = await request.json();
    const { name, description, duration_minutes, price, currency, is_active } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;
    if (price !== undefined) updateData.price = price;
    if (currency !== undefined) updateData.currency = currency;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('clinic_services')
      .update(updateData)
      .eq('id', serviceId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    await logStaffAction({
      clinicId,
      actorId: authResult.admin.id,
      actorType: 'clinic_admin',
      action: 'service.update',
      entityType: 'clinic_service',
      entityId: serviceId,
      metadata: { updatedFields: Object.keys(updateData).filter(k => k !== 'updated_at') },
    });

    return NextResponse.json({ service: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string; serviceId: string }> },
) {
  try {
    const { clinicId, serviceId } = await params;
    const authResult = await authenticateClinicRequest(request, clinicId, 'services.manage');
    if (!isAuthSuccess(authResult)) return authResult;

    const { error } = await supabaseAdmin
      .from('clinic_services')
      .delete()
      .eq('id', serviceId)
      .eq('clinic_id', clinicId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logStaffAction({
      clinicId,
      actorId: authResult.admin.id,
      actorType: 'clinic_admin',
      action: 'service.delete',
      entityType: 'clinic_service',
      entityId: serviceId,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
