import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  try {
    const { clinicId } = await params;

    const { data: branches, error } = await supabaseAdmin
      .from('branches')
      .select('id, name, address, city, phone, is_active, is_default')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ branches: branches ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
