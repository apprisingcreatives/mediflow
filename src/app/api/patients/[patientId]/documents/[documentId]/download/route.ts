import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET — Generate a signed download URL for a document
export async function GET(
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

    // Fetch document through the RLS-respecting client — access is automatically scoped
    const { data: doc, error: docError } = await supabase
      .from('patient_documents')
      .select('file_path')
      .eq('id', documentId)
      .eq('patient_id', patientId)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Generate a signed URL valid for 60 seconds
    const { data: signedUrl, error: signedUrlError } = await supabaseAdmin.storage
      .from('patient-documents')
      .createSignedUrl(doc.file_path, 60);

    if (signedUrlError || !signedUrl) {
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
    }

    return NextResponse.json({ url: signedUrl.signedUrl });
  } catch (error) {
    console.error('Error generating document download URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
