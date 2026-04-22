import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// POST — Create patient record after email verification
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if patient record already exists
    const { data: existingPatient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (existingPatient) {
      return NextResponse.json({
        message: 'Patient record already exists',
        patientId: existingPatient.id,
      });
    }

    const metadata = user.user_metadata;

    // Create patient record using admin client (bypasses RLS)
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .insert({
        auth_user_id: user.id,
        email: user.email,
        first_name: metadata?.first_name || '',
        last_name: metadata?.last_name || '',
        onboarding_completed: false,
        is_active: true,
      })
      .select('id')
      .single();

    if (patientError || !patient) {
      console.error('Error creating patient record:', patientError);
      return NextResponse.json(
        { error: 'Failed to create patient profile' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: 'Account activated', patientId: patient.id },
      { status: 201 },
    );
  } catch (error) {
    console.error('Activation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
