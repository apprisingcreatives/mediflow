import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const TEMPLATE_QUESTIONS = [
  {
    question_text: 'Do you have any known allergies? If yes, please list them.',
    question_type: 'textarea',
    category: 'Medical History',
    is_required: true,
    display_order: 1,
  },
  {
    question_text: 'List any medications you are currently taking (including dosage).',
    question_type: 'textarea',
    category: 'Medical History',
    is_required: false,
    display_order: 2,
  },
  {
    question_text: 'Do you have any chronic medical conditions?',
    question_type: 'multiselect',
    options: ['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'Arthritis', 'Thyroid Disorder', 'None'],
    category: 'Medical History',
    is_required: true,
    display_order: 3,
  },
  {
    question_text: 'Have any immediate family members been diagnosed with chronic diseases?',
    question_type: 'multiselect',
    options: ['Diabetes', 'Heart Disease', 'Cancer', 'Hypertension', 'Mental Health Conditions', 'None'],
    category: 'Family History',
    is_required: false,
    display_order: 4,
  },
  {
    question_text: 'Do you smoke or use tobacco products?',
    question_type: 'yesno',
    category: 'Lifestyle',
    is_required: true,
    display_order: 5,
  },
  {
    question_text: 'How often do you exercise?',
    question_type: 'select',
    options: ['Daily', '3-5 times/week', '1-2 times/week', 'Rarely', 'Never'],
    category: 'Lifestyle',
    is_required: false,
    display_order: 6,
  },
  {
    question_text: 'How would you rate your current stress level?',
    question_type: 'select',
    options: ['Low', 'Moderate', 'High', 'Very High'],
    category: 'Lifestyle',
    is_required: false,
    display_order: 7,
  },
  {
    question_text: 'Have you had any surgeries in the past? If yes, please describe.',
    question_type: 'textarea',
    category: 'Medical History',
    is_required: false,
    display_order: 8,
  },
  {
    question_text: 'Are you currently pregnant or planning to become pregnant?',
    question_type: 'select',
    options: ['Yes', 'No', 'Not Applicable'],
    category: 'Medical History',
    is_required: false,
    display_order: 9,
  },
  {
    question_text: 'Is there anything else you would like your healthcare provider to know?',
    question_type: 'textarea',
    category: 'Other',
    is_required: false,
    display_order: 10,
  },
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const { clinicId } = await params;

    // Auth: verify clinic admin
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

    // Verify user is clinic admin
    const { data: admin } = await supabaseAdmin
      .from('clinic_admins')
      .select('id')
      .eq('auth_user_id', user.id)
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if questions already exist for this clinic
    const { count } = await supabaseAdmin
      .from('clinic_onboarding_questions')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Template questions already exist. Delete existing questions first.' },
        { status: 409 }
      );
    }

    // Insert template questions
    const questionsWithClinicId = TEMPLATE_QUESTIONS.map((q) => ({
      ...q,
      clinic_id: clinicId,
    }));

    const { data: questions, error: insertError } = await supabaseAdmin
      .from('clinic_onboarding_questions')
      .insert(questionsWithClinicId)
      .select();

    if (insertError) {
      console.error('Error inserting template questions:', insertError);
      return NextResponse.json({ error: 'Failed to load template' }, { status: 500 });
    }

    return NextResponse.json({ questions }, { status: 201 });
  } catch (error) {
    console.error('Load template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
