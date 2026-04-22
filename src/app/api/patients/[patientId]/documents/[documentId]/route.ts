import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// DELETE — Delete a document (patient only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ patientId: string; documentId: string }> }
) {
  try {
    const { patientId, documentId } = await params;

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

    // Fetch document
    const { data: doc, error: docError } = await supabaseAdmin
      .from('patient_documents')
      .select('id, file_path, file_name')
      .eq('id', documentId)
      .eq('patient_id', patientId)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('patient-documents')
      .remove([doc.file_path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
    }

    // Delete DB record
    const { error: deleteError } = await supabaseAdmin
      .from('patient_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Audit log
    await supabaseAdmin.from('activity_logs').insert({
      patient_id: patientId,
      actor_id: user.id,
      actor_role: 'patient',
      action_type: 'document_deleted',
      entity_type: 'patient_document',
      entity_id: documentId,
      metadata: {
        file_name: doc.file_name,
        file_path: doc.file_path,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting patient document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
