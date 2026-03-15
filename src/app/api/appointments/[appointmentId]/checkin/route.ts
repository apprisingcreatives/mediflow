import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for this endpoint since it's accessed via email link (no auth session)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

interface RouteParams {
  params: Promise<{ appointmentId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { appointmentId } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/checkin/error?reason=missing_token', request.url)
      );
    }

    // Verify the token and get appointment details
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        status,
        checkin_token,
        checkin_token_expires_at,
        appointment_date,
        appointment_time,
        patient:patients (id, first_name, last_name, email),
        practitioner:practitioners (id, name),
        service:clinic_services (id, name),
        clinic:clinics (id, name, slug)
      `)
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      console.error('Appointment not found:', fetchError);
      return NextResponse.redirect(
        new URL('/checkin/error?reason=not_found', request.url)
      );
    }

    // Verify token matches
    if (appointment.checkin_token !== token) {
      return NextResponse.redirect(
        new URL('/checkin/error?reason=invalid_token', request.url)
      );
    }

    // Check if token has expired
    if (appointment.checkin_token_expires_at) {
      const expiresAt = new Date(appointment.checkin_token_expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.redirect(
          new URL('/checkin/error?reason=expired_token', request.url)
        );
      }
    }

    // Check if appointment is in a valid status for check-in
    if (!['scheduled', 'confirmed'].includes(appointment.status)) {
      return NextResponse.redirect(
        new URL(`/checkin/error?reason=invalid_status&status=${appointment.status}`, request.url)
      );
    }

    // Update appointment status to in-progress
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'in-progress',
        checkin_token: null, // Invalidate token after use
        checkin_token_expires_at: null,
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Failed to update appointment:', updateError);
      return NextResponse.redirect(
        new URL('/checkin/error?reason=update_failed', request.url)
      );
    }

    // Redirect to success page with appointment details

    const successUrl = new URL('/checkin/success', request.url);
    successUrl.searchParams.set('appointmentId', appointmentId);
    const clinic = Array.isArray(appointment.clinic) ? appointment.clinic[0] : appointment.clinic;
    const practitioner = Array.isArray(appointment.practitioner) ? appointment.practitioner[0] : appointment.practitioner;
    const service = Array.isArray(appointment.service) ? appointment.service[0] : appointment.service;
    const patient = Array.isArray(appointment.patient) ? appointment.patient[0] : appointment.patient;

    successUrl.searchParams.set('clinicName', clinic?.name || '');
    successUrl.searchParams.set('practitionerName', practitioner?.name || '');
    successUrl.searchParams.set('serviceName', service?.name || '');
    successUrl.searchParams.set('patientName', `${patient?.first_name || ''} ${patient?.last_name || ''}`);

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.redirect(
      new URL('/checkin/error?reason=server_error', request.url)
    );
  }
}

// POST endpoint for programmatic check-in (e.g., from patient portal)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { appointmentId } = await params;
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 400 }
      );
    }

    // Verify the token and get appointment
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, status, checkin_token, checkin_token_expires_at')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Verify token
    if (appointment.checkin_token !== token) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check expiry
    if (appointment.checkin_token_expires_at) {
      const expiresAt = new Date(appointment.checkin_token_expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Token expired' },
          { status: 401 }
        );
      }
    }

    // Check status
    if (!['scheduled', 'confirmed'].includes(appointment.status)) {
      return NextResponse.json(
        { error: 'Appointment cannot be checked in', status: appointment.status },
        { status: 400 }
      );
    }

    // Update status
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'in-progress',
        checkin_token: null,
        checkin_token_expires_at: null,
      })
      .eq('id', appointmentId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully checked in',
      appointmentId,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
