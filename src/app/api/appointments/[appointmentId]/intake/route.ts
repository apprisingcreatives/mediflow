import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface RouteParams {
  params: Promise<{ appointmentId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { appointmentId } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch appointment
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .select('id, patient_id, clinic_id, appointment_date, appointment_time, intake_status')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Verify user is the patient
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('id', appointment.patient_id)
      .eq('auth_user_id', user.id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const clinicId = appointment.clinic_id;

    // Fetch all clinic and patient data in parallel
    const [
      { data: clinic },
      { data: questions },
      { data: documents },
      { data: responses },
      { data: uploadedDocuments },
      { data: aiPrediction },
    ] = await Promise.all([
      supabaseAdmin
        .from('clinics')
        .select('name, intake_required')
        .eq('id', clinicId)
        .single(),
      supabaseAdmin
        .from('clinic_onboarding_questions')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
      supabaseAdmin
        .from('clinic_required_documents')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
      supabaseAdmin
        .from('patient_question_responses')
        .select('*, question:clinic_onboarding_questions(*)')
        .eq('patient_id', appointment.patient_id)
        .eq('clinic_id', clinicId)
        .eq('appointment_id', appointmentId),
      supabaseAdmin
        .from('patient_documents')
        .select('*')
        .eq('patient_id', appointment.patient_id),
      supabaseAdmin
        .from('ai_treatment_predictions')
        .select('*')
        .eq('patient_id', appointment.patient_id)
        .eq('clinic_id', clinicId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      appointment,
      clinic,
      questions,
      documents,
      responses,
      uploadedDocuments,
      aiPrediction,
    });
  } catch (error) {
    console.error('Intake GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { appointmentId } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch appointment
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .select('id, patient_id, clinic_id')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Verify user is the patient
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('id', appointment.patient_id)
      .eq('auth_user_id', user.id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { responses, completeIntake } = await request.json();

    // Upsert question responses if provided
    if (Array.isArray(responses) && responses.length > 0) {
      const responseInserts = responses.map((r: any) => ({
        patient_id: appointment.patient_id,
        clinic_id: appointment.clinic_id,
        question_id: r.questionId,
        response_value: r.value,
        response_options: r.options,
        appointment_id: appointmentId,
      }));

      const { error: upsertError } = await supabaseAdmin
        .from('patient_question_responses')
        .upsert(responseInserts, { onConflict: 'patient_id,question_id', ignoreDuplicates: false });

      if (upsertError) {
        console.error('Intake POST upsert error:', upsertError);
        return NextResponse.json({ error: 'Failed to save responses' }, { status: 500 });
      }
    }

    // Mark intake as completed if requested
    if (completeIntake) {
      const { error: updateError } = await supabaseAdmin
        .from('appointments')
        .update({ intake_status: 'completed' })
        .eq('id', appointmentId);

      if (updateError) {
        console.error('Intake POST complete error:', updateError);
        return NextResponse.json({ error: 'Failed to complete intake' }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: completeIntake ? 'Intake completed' : 'Responses saved',
    });
  } catch (error) {
    console.error('Intake POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
