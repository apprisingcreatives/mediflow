import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // Get authorization token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ SECURITY: Create authenticated client with user's JWT token
    // This client will respect RLS policies with the user's session context
    // Defense-in-depth: Even if this API route has a bug, RLS protects the data
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseWithAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Query super_admins table using RLS policies
    // RLS policy "Users can view their own super admin record" allows this
    const { data: requester, error: requesterError } = await supabaseWithAuth
      .from('super_admins')
      .select('id, status, email, auth_user_id')
      .eq('auth_user_id', user.id)
      .single();

    if (requesterError || !requester) {
      console.error('Failed to fetch requester:', requesterError);
      return NextResponse.json(
        { error: 'Super admin record not found' },
        { status: 403 },
      );
    }

    // Check if requester is active
    if (requester.status !== 'active') {
      return NextResponse.json(
        { error: `Cannot invite users with status: ${requester.status}` },
        { status: 403 },
      );
    }

    // Get invite details from request
    const { email, name } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 },
      );
    }

    // ✅ Check if user already exists using authenticated client with RLS
    // RLS policy "Active super admins can view all super admins" allows this
    const { data: existingUser } = await supabaseWithAuth
      .from('super_admins')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'A super admin with this email already exists' },
        { status: 400 },
      );
    }

    // ⚠️ Send invitation via Supabase Auth - REQUIRES service role
    // This is one of the few operations that legitimately needs service role
    const { data: invitedUser, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          name,
          role: 'super_admin',
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/super-admin/setup-password`,
      });

    if (inviteError || !invitedUser.user) {
      console.error('Invitation error:', inviteError);
      return NextResponse.json(
        { error: inviteError?.message || 'Failed to send invitation' },
        { status: 500 },
      );
    }

    // Create super_admins record using service role
    // The requester has already been verified as an active super admin above
    const { data: newSuperAdmin, error: dbError } = await supabaseAdmin
      .from('super_admins')
      .insert({
        auth_user_id: invitedUser.user.id,
        email,
        name,
        status: 'invited', // Will be changed to 'active' after password setup
        invited_by: requester.id,
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: delete auth user if DB insert fails (requires service role)
      await supabaseAdmin.auth.admin.deleteUser(invitedUser.user.id);
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create super admin record' },
        { status: 500 },
      );
    }

    // ✅ Log the invitation using authenticated client with RLS
    await supabaseWithAuth.from('audit_logs').insert({
      user_id: requester.id,
      action: 'invite_super_admin',
      details: {
        invited_email: email,
        invited_name: name,
      },
    });

    return NextResponse.json(
      {
        message: 'Invitation sent successfully',
        super_admin: {
          id: newSuperAdmin.id,
          email: newSuperAdmin.email,
          name: newSuperAdmin.name,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
