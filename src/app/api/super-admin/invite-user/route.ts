import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // Get authorization token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the requester is authenticated
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the requester is a super admin
    const { data: requester, error: requesterError } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .single();

    if (requesterError || !requester) {
      return NextResponse.json(
        { error: 'Only super admins can invite users' },
        { status: 403 }
      );
    }

    // Get invite details from request
    const { email, name } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'A super admin with this email already exists' },
        { status: 400 }
      );
    }

    // Send invitation via Supabase Auth
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
        { status: 500 }
      );
    }

    // Create super_admins record
    const { data: newSuperAdmin, error: dbError } = await supabaseAdmin
      .from('super_admins')
      .insert({
        auth_user_id: invitedUser.user.id,
        email,
        name,
        is_active: false, // Will be activated after password setup
        invited_by: requester.id,
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: delete auth user if DB insert fails
      await supabaseAdmin.auth.admin.deleteUser(invitedUser.user.id);
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create super admin record' },
        { status: 500 }
      );
    }

    // Log the invitation
    await supabaseAdmin.from('audit_logs').insert({
      user_id: requester.id,
      action: 'invite_super_admin',
      details: {
        invited_email: email,
        invited_name: name,
      },
    });

    return NextResponse.json({
      message: 'Invitation sent successfully',
      super_admin: {
        id: newSuperAdmin.id,
        email: newSuperAdmin.email,
        name: newSuperAdmin.name,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}