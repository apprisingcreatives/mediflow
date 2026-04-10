import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { DOCUMENT_UPLOAD_DEFAULTS } from '@/lib/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET — List documents for a patient
export async function GET(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params;

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

    const query = supabase
      .from('patient_documents')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    const { data: documents, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents: documents ?? [] });
  } catch (error) {
    console.error('Error fetching patient documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — Upload a document
export async function POST(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params;

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

    // Verify patient owns this account
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .eq('auth_user_id', user.id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Forbidden: Patient record not found' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const description = formData.get('description') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    // Use global defaults for validation
    const maxFileSizeBytes = DOCUMENT_UPLOAD_DEFAULTS.maxFileSizeBytes;
    const allowedExtensions = DOCUMENT_UPLOAD_DEFAULTS.allowedExtensions;

    // Validate file size
    if (file.size > maxFileSizeBytes) {
      const maxMb = Math.round(maxFileSizeBytes / (1024 * 1024));
      return NextResponse.json(
        { error: `File size exceeds the ${maxMb}MB limit` },
        { status: 400 }
      );
    }

    // Validate file extension
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `File type not allowed. Allowed types: ${allowedExtensions.join(', ')}` },
        { status: 400 }
      );
    }

    // Upload to storage
    const storagePath = `${patientId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('patient-documents')
      .upload(storagePath, file);

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Insert DB record
    const { data: document, error: insertError } = await supabaseAdmin
      .from('patient_documents')
      .insert({
        patient_id: patientId,
        file_name: file.name,
        file_path: uploadData.path,
        file_size_bytes: file.size,
        mime_type: file.type,
        description: description ?? null,
      })
      .select()
      .single();

    if (insertError) {
      // Clean up the uploaded file on DB failure
      await supabaseAdmin.storage.from('patient-documents').remove([uploadData.path]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Audit log
    await supabaseAdmin.from('activity_logs').insert({
      patient_id: patientId,
      actor_id: user.id,
      actor_role: 'patient',
      action_type: 'document_uploaded',
      entity_type: 'patient_document',
      entity_id: document.id,
      metadata: {
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error uploading patient document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
