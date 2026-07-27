import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';
import { createNotifications } from '@/lib/notifications';
import { checkResourceLimit, requireActiveSubscription } from '@/lib/plan-gating';

interface InvitePractitionerRequest {
  name: string;
  email: string;
  specialization: string;
  bio?: string;
  branch_id?: string;
}

// Default working hours: 9 AM - 5 PM Manila time (Monday-Friday)
const DEFAULT_WORKING_HOURS = [
  { day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00', is_available: true }, // Monday
  { day_of_week: 2, start_time: '09:00:00', end_time: '17:00:00', is_available: true }, // Tuesday
  { day_of_week: 3, start_time: '09:00:00', end_time: '17:00:00', is_available: true }, // Wednesday
  { day_of_week: 4, start_time: '09:00:00', end_time: '17:00:00', is_available: true }, // Thursday
  { day_of_week: 5, start_time: '09:00:00', end_time: '17:00:00', is_available: true }, // Friday
  { day_of_week: 6, start_time: '09:00:00', end_time: '17:00:00', is_available: false }, // Saturday (off by default)
  { day_of_week: 0, start_time: '09:00:00', end_time: '17:00:00', is_available: false }, // Sunday (off by default)
];

export async function POST(
  request: Request,
  { params }: { params: { clinicId: string } }
) {
  try {
    const { clinicId } = params;

    const subCheck = await requireActiveSubscription(clinicId);
    if (subCheck !== true) return subCheck;

    // Get authorization token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create authenticated client with user's JWT token
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

    // Verify user is a clinic admin for this clinic
    const { data: clinicAdmin, error: adminError } = await supabaseWithAuth
      .from('clinic_admins')
      .select('id, clinic_id, is_active')
      .eq('auth_user_id', user.id)
      .eq('clinic_id', clinicId)
      .single();

    if (adminError || !clinicAdmin) {
      return NextResponse.json(
        { error: 'You are not authorized to manage this clinic' },
        { status: 403 }
      );
    }

    if (!clinicAdmin.is_active) {
      return NextResponse.json(
        { error: 'Your clinic admin account is inactive' },
        { status: 403 }
      );
    }

    // Get practitioner details from request
    const { name, email, specialization, bio, branch_id }: InvitePractitionerRequest =
      await request.json();

    if (!name || !email || !specialization) {
      return NextResponse.json(
        { error: 'Name, email, and specialization are required' },
        { status: 400 }
      );
    }

    // Get clinic details for the email
    const { data: clinic, error: clinicError } = await supabaseWithAuth
      .from('clinics')
      .select('name')
      .eq('id', clinicId)
      .single();

    if (clinicError || !clinic) {
      return NextResponse.json(
        { error: 'Clinic not found' },
        { status: 404 }
      );
    }

    // Resolve target branch: use provided branch_id or fall back to default
    let targetBranchId = branch_id;
    if (!targetBranchId) {
      const { data: defaultBranch } = await supabaseAdmin
        .from('branches')
        .select('id')
        .eq('clinic_id', clinicId)
        .eq('is_default', true)
        .single();
      targetBranchId = defaultBranch?.id;
    }

    if (targetBranchId) {
      const limitCheck = await checkResourceLimit(clinicId, 'practitioners', targetBranchId);
      if (limitCheck !== true) return limitCheck;
    }

    // Check if practitioner already exists by email in this clinic
    const { data: existingPractitioner } = await supabaseAdmin
      .from('practitioners')
      .select('id, auth_user_id, is_active, clinic_id')
      .eq('email', email)
      .eq('clinic_id', clinicId)
      .single();

    if (existingPractitioner) {
      return NextResponse.json(
        {
          error: 'A practitioner with this email already exists in this clinic',
          practitioner: {
            id: existingPractitioner.id,
            isExisting: true,
            hasAccount: !!existingPractitioner.auth_user_id,
          },
        },
        { status: 409 }
      );
    }

    // Check if email is used by another user in auth.users
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
    const emailInUse = existingAuthUser?.users?.some(u => u.email === email);
    
    if (emailInUse) {
      return NextResponse.json(
        { error: 'This email is already registered in the system' },
        { status: 409 }
      );
    }

    // Send invitation via Supabase Auth
    const { data: invitedUser, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          name,
          specialization,
          role: 'clinic_practitioner',
          clinic_id: clinicId,
          clinic_name: clinic.name,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/practitioner/setup-account`,
      });

    if (inviteError) {
      console.error('Practitioner invitation error:', inviteError);
      return NextResponse.json(
        { error: inviteError.message || 'Failed to send invitation' },
        { status: 500 }
      );
    }

    if (!invitedUser.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Create practitioner record
    const { data: newPractitioner, error: practitionerError } = await supabaseAdmin
      .from('practitioners')
      .insert({
        auth_user_id: invitedUser.user.id,
        clinic_id: clinicId,
        name,
        email,
        specialization,
        bio: bio || null,
        is_active: false, // Will be activated after email confirmation
        role: 'practitioner',
      })
      .select()
      .single();

    if (practitionerError) {
      // Rollback: delete auth user if practitioner creation fails
      await supabaseAdmin.auth.admin.deleteUser(invitedUser.user.id);
      console.error('Practitioner creation error:', practitionerError);
      return NextResponse.json(
        { error: 'Failed to create practitioner record' },
        { status: 500 }
      );
    }

    // Assign practitioner to the target branch
    if (targetBranchId) {
      const { error: branchAssignError } = await supabaseAdmin
        .from('practitioner_branches')
        .insert({
          practitioner_id: newPractitioner.id,
          branch_id: targetBranchId,
        });

      if (branchAssignError) {
        console.error('Branch assignment error:', branchAssignError);
        await supabaseAdmin.from('practitioners').delete().eq('id', newPractitioner.id);
        await supabaseAdmin.auth.admin.deleteUser(invitedUser.user.id);
        return NextResponse.json(
          { error: 'Failed to assign practitioner to branch' },
          { status: 500 },
        );
      }
    }

    // Update user metadata with practitioner_id
    await supabaseAdmin.auth.admin.updateUserById(invitedUser.user.id, {
      user_metadata: {
        name,
        specialization,
        role: 'clinic_practitioner',
        clinic_id: clinicId,
        clinic_name: clinic.name,
        practitioner_id: newPractitioner.id,
      },
    });

    // Create default working hours for the practitioner
    const workingHoursData = DEFAULT_WORKING_HOURS.map(wh => ({
      ...wh,
      practitioner_id: newPractitioner.id,
    }));

    const { error: workingHoursError } = await supabaseAdmin
      .from('practitioner_working_hours')
      .insert(workingHoursData);

    if (workingHoursError) {
      console.error('Working hours creation error:', workingHoursError);
      // Don't rollback - working hours can be added later
    }

    // Notify clinic owner(s) about new practitioner
    const { data: owners } = await supabaseAdmin
      .from('clinic_admins')
      .select('auth_user_id')
      .eq('clinic_id', clinicId)
      .eq('staff_role', 'owner')
      .eq('is_active', true);
    const ownerNotifs = (owners ?? [])
      .filter((o) => o.auth_user_id && o.auth_user_id !== user.id)
      .map((o) => ({
        recipientId: o.auth_user_id!,
        recipientType: 'clinic_admin' as const,
        clinicId,
        type: 'practitioner.added' as const,
        title: 'Practitioner Invited',
        message: `${name} (${specialization}) has been invited as a practitioner`,
        actionUrl: `/clinic/${clinicId}/practitioners`,
      }));
    if (ownerNotifs.length > 0) createNotifications(ownerNotifs);

    return NextResponse.json(
      {
        message: 'Invitation sent successfully',
        practitioner: {
          id: newPractitioner.id,
          name: newPractitioner.name,
          email: newPractitioner.email,
          specialization: newPractitioner.specialization,
          isExisting: false,
          hasAccount: false,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
