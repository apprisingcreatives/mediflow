import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params;

    // Auth check
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

    // Parse formData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentTypeId = formData.get('documentTypeId') as string;

    // Validate file
    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds the 10MB limit' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Resolve description from documentTypeId
    let description = 'Medical Document';
    if (documentTypeId) {
      const { data: docType } = await supabaseAdmin
        .from('clinic_required_documents')
        .select('document_name')
        .eq('id', documentTypeId)
        .single();

      if (docType?.document_name) {
        description = docType.document_name;
      }
    }

    // Upload to storage
    const filePath = `${appointment.patient_id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('patient-documents')
      .upload(filePath, file, { contentType: file.type });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Insert record
    const { data: document, error: insertError } = await supabaseAdmin
      .from('patient_documents')
      .insert({
        patient_id: appointment.patient_id,
        file_name: file.name,
        file_path: filePath,
        mime_type: file.type,
        file_size_bytes: file.size,
        description,
      })
      .select()
      .single();

    if (insertError) {
      // Clean up uploaded file on DB failure
      await supabaseAdmin.storage.from('patient-documents').remove([filePath]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error uploading intake document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
