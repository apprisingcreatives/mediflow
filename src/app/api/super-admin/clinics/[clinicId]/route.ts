import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';
import { SuperAdminStatus } from '@/types/super-admin';

export async function PATCH(
  request: Request,
  { params }: { params: { clinicId: string } },
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the requester is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a Supabase client with the user's JWT for RLS-protected queries
    const supabaseWithAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    );

    // Verify the requester is an active super admin
    const { data: requester, error: requesterError } = await supabaseWithAuth
      .from('super_admins')
      .select('id, status')
      .eq('auth_user_id', user.id)
      .eq('status', SuperAdminStatus.ACTIVE)
      .single();

    if (requesterError || !requester) {
      return NextResponse.json(
        { error: 'Only active super admins can update clinics' },
        { status: 403 },
      );
    }

    const { clinicId } = params;
    const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      city,
      subscription_plan,
      is_active,
    } = body;

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (subscription_plan !== undefined)
      updateData.subscription_plan = subscription_plan;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update the clinic using service role (bypasses RLS)
    const { data: updatedClinic, error: updateError } = await supabaseAdmin
      .from('clinics')
      .update(updateData)
      .eq('id', clinicId)
      .select()
      .single();

    if (updateError) {
      console.error('Clinic update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Log the update using RLS-protected client
    await supabaseWithAuth.from('audit_logs').insert({
      user_id: requester.id,
      action: 'update_clinic',
      details: {
        clinic_id: clinicId,
        updated_fields: Object.keys(updateData),
      },
    });

    return NextResponse.json({ clinic: updatedClinic }, { status: 200 });
  } catch (error) {
    console.error('Error updating clinic:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { clinicId: string } },
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the requester is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a Supabase client with the user's JWT for RLS-protected queries
    const supabaseWithAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    );

    // Verify the requester is an active super admin
    const { data: requester, error: requesterError } = await supabaseWithAuth
      .from('super_admins')
      .select('id, status')
      .eq('auth_user_id', user.id)
      .eq('status', SuperAdminStatus.ACTIVE)
      .single();

    if (requesterError || !requester) {
      return NextResponse.json(
        { error: 'Only active super admins can delete clinics' },
        { status: 403 },
      );
    }

    const { clinicId } = params;

    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabaseAdmin
      .from('clinics')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', clinicId);

    if (deleteError) {
      console.error('Clinic deletion error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Log the deletion using RLS-protected client
    await supabaseWithAuth.from('audit_logs').insert({
      user_id: requester.id,
      action: 'delete_clinic',
      details: { clinic_id: clinicId },
    });

    return NextResponse.json(
      { message: 'Clinic deactivated successfully' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error deleting clinic:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
