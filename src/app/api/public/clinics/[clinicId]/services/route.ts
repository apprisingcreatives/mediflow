import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  try {
    const { clinicId } = await params;
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branch_id');

    if (branchId) {
      // Verify branch belongs to this clinic
      const { data: branch } = await supabaseAdmin
        .from('branches')
        .select('id')
        .eq('id', branchId)
        .eq('clinic_id', clinicId)
        .single();

      if (!branch) {
        return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
      }
    }

    let query = supabaseAdmin
      .from('clinic_services')
      .select('id, name, duration_minutes, price')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('name');

    if (branchId) {
      query = query.eq('branch_id', branchId);
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
