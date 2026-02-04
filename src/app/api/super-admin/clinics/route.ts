import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';
import { SuperAdminStatus } from '@/types/super-admin';

export async function POST(request: Request) {
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
        { error: 'Only active super admins can create clinics' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      city,
      subscription_plan,
      is_active,
      admin_email,
      admin_name,
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 },
      );
    }

    if (!admin_email || !admin_name) {
      return NextResponse.json(
        { error: 'Admin name and email are required' },
        { status: 400 },
      );
    }

    // Check if admin email already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('clinic_admins')
      .select('id')
      .eq('email', admin_email)
      .single();

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'An admin with this email already exists' },
        { status: 400 },
      );
    }

    // Generate unique slug from clinic name
    const generateSlug = async (clinicName: string): Promise<string> => {
      let baseSlug = clinicName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      let slug = baseSlug;
      let counter = 0;

      while (true) {
        const { data, error } = await supabaseAdmin
          .from('clinics')
          .select('id')
          .eq('slug', slug)
          .single();

        if (error && error.code === 'PGRST116') {
          // No row found - slug is available
          return slug;
        } else if (data) {
          // Slug already exists
          counter++;
          slug = `${baseSlug}-${counter}`;
        } else if (error) {
          throw error;
        }
      }
    };

    const clinicSlug = await generateSlug(name);

    // Calculate trial dates
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14); // 14-day trial

    // Create the clinic using service role (bypasses RLS for insert)
    const { data: newClinic, error: clinicError } = await supabaseAdmin
      .from('clinics')
      .insert({
        name,
        slug: clinicSlug,
        email,
        phone: phone || null,
        address: address || null,
        city: city || null,
        subscription_plan: subscription_plan || 'basic',
        is_active: is_active ?? true,
        trial_start_date: trialStartDate.toISOString(),
        trial_end_date: trialEndDate.toISOString(),
        is_trial_active: true,
        is_subscription_active: true,
        payment_status: 'trial',
      })
      .select()
      .single();

    if (clinicError) {
      console.error('Clinic creation error:', clinicError);
      return NextResponse.json(
        { error: clinicError.message },
        { status: 500 },
      );
    }

    // Send invitation to clinic admin
    const { data: invitedUser, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(admin_email, {
        data: {
          name: admin_name,
          role: 'clinic_admin',
          clinic_id: newClinic.id,
          clinic_name: newClinic.name,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/clinic/setup-account`,
      });

    if (inviteError || !invitedUser.user) {
      // Rollback clinic creation
      await supabaseAdmin.from('clinics').delete().eq('id', newClinic.id);
      console.error('Invitation error:', inviteError);
      return NextResponse.json(
        { error: inviteError?.message || 'Failed to send invitation' },
        { status: 500 },
      );
    }

    // Create clinic_admins record (pending until they accept)
    const { error: adminError } = await supabaseAdmin
      .from('clinic_admins')
      .insert({
        clinic_id: newClinic.id,
        email: admin_email,
        name: admin_name,
        role: 'admin',
        auth_user_id: invitedUser.user.id,
        is_active: false, // Will be activated when they complete setup
      });

    if (adminError) {
      // Rollback clinic and auth user
      await supabaseAdmin.from('clinics').delete().eq('id', newClinic.id);
      await supabaseAdmin.auth.admin.deleteUser(invitedUser.user.id);
      console.error('Admin record creation error:', adminError);
      return NextResponse.json(
        { error: 'Failed to create admin record' },
        { status: 500 },
      );
    }

    // Log the creation using RLS-protected client
    await supabaseWithAuth.from('audit_logs').insert({
      user_id: requester.id,
      action: 'create_clinic',
      details: {
        clinic_id: newClinic.id,
        clinic_name: name,
        admin_email,
        admin_name,
      },
    });

    return NextResponse.json(
      {
        clinic: newClinic,
        message: `Clinic created successfully. Invitation sent to ${admin_email}`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating clinic:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
