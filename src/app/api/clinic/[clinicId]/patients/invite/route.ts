import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

interface InvitePatientRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export async function POST(
  request: Request,
  { params }: { params: { clinicId: string } }
) {
  try {
    const { clinicId } = params;

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

    // Get patient details from request
    const { firstName, lastName, email, phone }: InvitePatientRequest =
      await request.json();

    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: 'First name, last name, email, and phone are required' },
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

    // Check if patient already exists by email
    const { data: existingPatient } = await supabaseAdmin
      .from('patients')
      .select('id, auth_user_id, is_active')
      .eq('email', email)
      .single();

    if (existingPatient) {
      // Patient exists - check if patient_clinics record exists for this clinic
      const { data: existingPatientClinic } = await supabaseAdmin
        .from('patient_clinics')
        .select('id')
        .eq('patient_id', existingPatient.id)
        .eq('clinic_id', clinicId)
        .single();

      // Create patient_clinics record if it doesn't exist
      if (!existingPatientClinic) {
        const { error: patientClinicError } = await supabaseAdmin
          .from('patient_clinics')
          .insert({
            patient_id: existingPatient.id,
            clinic_id: clinicId,
            is_primary: false,
          });

        if (patientClinicError) {
          console.error('Failed to create patient_clinics record:', patientClinicError);
          // Don't fail the request, just log the error
        }
      }

      return NextResponse.json(
        {
          message: 'Patient already exists',
          patient: {
            id: existingPatient.id,
            isExisting: true,
            hasAccount: !!existingPatient.auth_user_id,
          },
        },
        { status: 200 }
      );
    }

    // Send invitation via Supabase Auth
    let invitedUser;
    let inviteErrorObj: any = null;

    try {
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone,
          role: 'patient',
          invited_by_clinic: clinicId,
          invited_by_clinic_name: clinic.name,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/patient/setup-account`,
      });
      invitedUser = data;
      inviteErrorObj = error;
    } catch (e: any) {
      inviteErrorObj = e;
    }

    let authUserId: string | null = null;

    if (inviteErrorObj) {
      const isAlreadyRegistered = 
        inviteErrorObj.status === 422 || 
        inviteErrorObj.message?.includes('already') || 
        inviteErrorObj.code === 'email_exists';

      if (isAlreadyRegistered) {
        // Find existing auth user
        const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
        const existingAuthUser = userList?.users?.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase()
        );
        if (existingAuthUser) {
          authUserId = existingAuthUser.id;
        } else {
          return NextResponse.json(
            { error: 'Email exists in auth but could not retrieve user ID.' },
            { status: 500 }
          );
        }
      } else {
        console.error('Invitation error:', inviteErrorObj);
        return NextResponse.json(
          { error: inviteErrorObj.message || 'Failed to send invitation' },
          { status: 500 }
        );
      }
    } else if (invitedUser?.user) {
      authUserId = invitedUser.user.id;
    }

    if (!authUserId) {
      return NextResponse.json(
        { error: 'Failed to establish user account ID' },
        { status: 500 }
      );
    }

    // Create patient record (without auth_user_id initially - will be linked on password setup)
    // Note: We use supabaseAdmin here because the patient doesn't have an appointment yet
    // and RLS requires an appointment to exist for clinic admins to insert
    const { data: newPatient, error: patientError } = await supabaseAdmin
      .from('patients')
      .insert({
        auth_user_id: authUserId,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        is_active: false, // Will be activated after email confirmation
        onboarding_completed: false,
      })
      .select()
      .single();

    if (patientError) {
      // Rollback: delete auth user if patient creation fails (only if it was newly created)
      if (!inviteErrorObj && authUserId) {
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
      }
      console.error('Patient creation error:', patientError);
      return NextResponse.json(
        { error: 'Failed to create patient record' },
        { status: 500 }
      );
    }

    // Create patient_clinics record to establish the relationship
    const { error: patientClinicError } = await supabaseAdmin
      .from('patient_clinics')
      .insert({
        patient_id: newPatient.id,
        clinic_id: clinicId,
        is_primary: false, // Can be set manually later
      });

    if (patientClinicError) {
      // Rollback: delete patient and auth user if patient_clinics creation fails
      await supabaseAdmin.from('patients').delete().eq('id', newPatient.id);
      if (!inviteErrorObj && authUserId) {
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
      }
      console.error('Patient clinics creation error:', patientClinicError);
      return NextResponse.json(
        { error: 'Failed to create patient-clinic relationship' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Invitation sent successfully',
        patient: {
          id: newPatient.id,
          email: newPatient.email,
          firstName: newPatient.first_name,
          lastName: newPatient.last_name,
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
