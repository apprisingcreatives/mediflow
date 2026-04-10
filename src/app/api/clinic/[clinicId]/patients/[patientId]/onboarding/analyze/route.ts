import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { analyzePatientHealth } from '@/lib/ai-analysis';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clinicId: string; patientId: string }> }
) {
  try {
    const { clinicId, patientId } = await params;

    // Auth
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

    // Verify user is the patient
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .eq('auth_user_id', user.id)
      .single();

    if (!patient) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check for existing prediction
    const { data: existingPrediction } = await supabaseAdmin
      .from('ai_treatment_predictions')
      .select('id, generated_at')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    // If a prediction exists, check if new documents were uploaded since
    if (existingPrediction) {
      const { count: newDocCount } = await supabaseAdmin
        .from('patient_documents')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .gt('uploaded_at', existingPrediction.generated_at);

      if (!newDocCount || newDocCount === 0) {
        // Return cached prediction
        const { data: cached } = await supabaseAdmin
          .from('ai_treatment_predictions')
          .select('*')
          .eq('id', existingPrediction.id)
          .single();

        // Find matching practitioner
        const matchedPractitioner = await findMatchingPractitioner(
          clinicId,
          cached?.recommended_specialty
        );

        return NextResponse.json({
          prediction: cached,
          matchedPractitioner,
          cached: true,
        });
      }
    }

    // Fetch question responses with question text
    const { data: responses } = await supabaseAdmin
      .from('patient_question_responses')
      .select(`
        response_value,
        response_options,
        clinic_onboarding_questions (
          question_text,
          question_type,
          category
        )
      `)
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId);

    const formattedResponses = (responses ?? []).map((r: any) => ({
      question_text: r.clinic_onboarding_questions?.question_text ?? '',
      question_type: r.clinic_onboarding_questions?.question_type ?? 'text',
      category: r.clinic_onboarding_questions?.category ?? null,
      response_value: r.response_value,
      response_options: r.response_options,
    }));

    // Fetch uploaded documents
    const { data: documents } = await supabaseAdmin
      .from('patient_documents')
      .select('file_name, mime_type, file_path, description')
      .eq('patient_id', patientId);

    // Run AI analysis
    const analysisResult = await analyzePatientHealth(
      formattedResponses,
      documents ?? []
    );

    // Store prediction
    const predictionData = {
      patient_id: patientId,
      clinic_id: clinicId,
      prediction_data: analysisResult,
      confidence_score: analysisResult.confidence_score,
      recommended_treatments: analysisResult.recommended_treatments,
      risk_factors: analysisResult.risk_factors,
      predicted_conditions: analysisResult.predicted_conditions,
      recommended_specialty: analysisResult.recommended_specialty,
    };

    let prediction;
    if (existingPrediction) {
      // Update existing
      const { data } = await supabaseAdmin
        .from('ai_treatment_predictions')
        .update({ ...predictionData, generated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', existingPrediction.id)
        .select()
        .single();
      prediction = data;
    } else {
      // Insert new
      const { data } = await supabaseAdmin
        .from('ai_treatment_predictions')
        .insert(predictionData)
        .select()
        .single();
      prediction = data;
    }

    // Find matching practitioner
    const matchedPractitioner = await findMatchingPractitioner(
      clinicId,
      analysisResult.recommended_specialty
    );

    return NextResponse.json({
      prediction,
      matchedPractitioner,
      cached: false,
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function findMatchingPractitioner(
  clinicId: string,
  specialty: string | undefined
) {
  if (!specialty) return null;

  const { data } = await supabaseAdmin
    .from('practitioners')
    .select('id, name, specialization')
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .ilike('specialization', `%${specialty}%`)
    .limit(1)
    .single();

  return data ?? null;
}
