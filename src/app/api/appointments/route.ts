import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// POST - Create appointment (patients only)
export async function POST(request: Request) {
  try {
    // Get authorization token from header
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Create a Supabase client with the user's access token
    // This ensures auth.uid() works correctly in RLS policies
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Verify token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      clinic_id,
      practitioner_id,
      service_id,
      appointment_date,
      appointment_time,
      notes,
    } = body;

    // Validate required fields
    if (!appointment_date || !appointment_time) {
      return NextResponse.json(
        { error: 'Date and time are required' },
        { status: 400 },
      );
    }

    // Get patient record
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, email, first_name, last_name')
      .eq('auth_user_id', user.id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Patient record not found' },
        { status: 404 },
      );
    }

    // Ensure patient_clinics record exists (for clinic-patient relationship)
    if (clinic_id) {
      const { error: patientClinicError } = await supabase
        .from('patient_clinics')
        .upsert(
          {
            patient_id: patient.id,
            clinic_id: clinic_id,
            is_primary: false,
          },
          {
            onConflict: 'patient_id,clinic_id',
            ignoreDuplicates: true,
          }
        );

      if (patientClinicError) {
        console.error('Failed to create patient_clinics record:', patientClinicError);
        // Continue - the relationship might already exist
      }
    }

    // Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        patient_id: patient.id,
        clinic_id: clinic_id || null,
        practitioner_id: practitioner_id || null,
        service_id: service_id || null,
        appointment_date,
        appointment_time,
        status: 'scheduled',
        notes: notes || null,
        booked_by: 'patient',
      })
      .select()
      .single();

    if (appointmentError) {
      console.error('Appointment creation error:', appointmentError);
      return NextResponse.json(
        { error: appointmentError.message },
        { status: 500 },
      );
    }

    // Get clinic and service names for email
    let clinicName = '';
    let serviceName = '';
    let practitionerName = '';

    if (clinic_id) {
      const { data: clinic } = await supabase
        .from('clinics')
        .select('name')
        .eq('id', clinic_id)
        .single();
      clinicName = clinic?.name || '';
    }

    if (service_id) {
      const { data: service } = await supabase
        .from('clinic_services')
        .select('name')
        .eq('id', service_id)
        .single();
      serviceName = service?.name || '';
    }

    if (practitioner_id) {
      const { data: practitioner } = await supabase
        .from('practitioners')
        .select('name')
        .eq('id', practitioner_id)
        .single();
      practitionerName = practitioner?.name || '';
    }

    // Queue confirmation email
    await supabase.from('email_notifications').insert({
      recipient_email: patient.email,
      recipient_name: `${patient.first_name} ${patient.last_name}`,
      recipient_type: 'patient',
      subject: 'Appointment Confirmed - MediFlow',
      body: `Dear ${patient.first_name}, Your appointment has been confirmed for ${appointment_date} at ${appointment_time}${clinicName ? ` at ${clinicName}` : ''}${practitionerName ? ` with ${practitionerName}` : ''}.`,
      html_body: `<h1>Appointment Confirmed</h1><p>Dear ${patient.first_name},</p><p>Your appointment has been confirmed:</p><ul><li><strong>Date:</strong> ${appointment_date}</li><li><strong>Time:</strong> ${appointment_time}</li>${clinicName ? `<li><strong>Clinic:</strong> ${clinicName}</li>` : ''}${practitionerName ? `<li><strong>Doctor:</strong> ${practitionerName}</li>` : ''}${serviceName ? `<li><strong>Service:</strong> ${serviceName}</li>` : ''}</ul><p>Please arrive 15 minutes before your appointment time.</p>`,
      notification_type: 'appointment_confirmation',
      related_entity_type: 'appointment',
      related_entity_id: appointment.id,
      status: 'pending',
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// GET - Get appointments (patients see their own, clinics see all in their clinic)
export async function GET(request: Request) {
  try {
    // Get authorization token from header
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Create a Supabase client with the user's access token
    // This ensures auth.uid() works correctly in RLS policies
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Verify token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinic_id');

    // Check if user is a patient
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (patient) {
      // Patient: only see their own appointments
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(
          `
          *,
          clinics(id, name),
          practitioners(id, name),
          clinic_services(id, name)
        `,
        )
        .eq('patient_id', patient.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ appointments });
    }

    // Check if user is a clinic admin
    const { data: clinicAdmin } = await supabase
      .from('clinic_admins')
      .select('id, clinic_id')
      .eq('auth_user_id', user.id)
      .single();

    if (clinicAdmin) {
      // Clinic admin: see all appointments for their clinic
      let query = supabase
        .from('appointments')
        .select(
          `
          *,
          patients(id, first_name, last_name, email),
          practitioners(id, name),
          clinic_services(id, name)
        `,
        )
        .eq('clinic_id', clinicAdmin.clinic_id);

      // Optional: filter by specific clinic if provided
      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }

      const { data: appointments, error } = await query
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ appointments });
    }

    // User is neither patient nor clinic admin
    return NextResponse.json(
      { error: 'Unauthorized: Not a patient or clinic admin' },
      { status: 403 },
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
