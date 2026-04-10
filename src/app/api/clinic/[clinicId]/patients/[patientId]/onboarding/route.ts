import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clinicId: string; patientId: string }> }
) {
  try {
    const { clinicId, patientId } = await params;

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is the patient or clinic staff
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .eq('auth_user_id', user.id)
      .single();

    if (!patient) {
      // Check if user is clinic admin or practitioner
      const { data: clinicStaff } = await supabaseAdmin
        .from('clinic_admins')
        .select('id')
        .eq('auth_user_id', user.id)
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .single();

      if (!clinicStaff) {
        const { data: practitioner } = await supabaseAdmin
          .from('practitioners')
          .select('id')
          .eq('auth_user_id', user.id)
          .eq('clinic_id', clinicId)
          .eq('is_active', true)
          .single();

        if (!practitioner) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    // Get onboarding questions for this clinic
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from("clinic_onboarding_questions")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (questionsError) {
      console.error("Error fetching onboarding questions:", questionsError);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Get required documents for this clinic
    const { data: documents, error: documentsError } = await supabaseAdmin
      .from("clinic_required_documents")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (documentsError) {
      console.error("Error fetching required documents:", documentsError);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Get patient's existing responses
    const { data: responses, error: responsesError } = await supabaseAdmin
      .from("patient_question_responses")
      .select(
        `
        *,
        question:clinic_onboarding_questions(*)
      `
      )
      .eq("patient_id", patientId)
      .eq("clinic_id", clinicId);

    if (responsesError) {
      console.error("Error fetching patient responses:", responsesError);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Get patient's uploaded documents
    const { data: uploadedDocuments, error: docsError } = await supabaseAdmin
      .from("patient_documents")
      .select(
        `
        *,
        document_type:clinic_required_documents(*)
      `
      )
      .eq("patient_id", patientId);

    if (docsError) {
      console.error("Error fetching patient documents:", docsError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Get AI prediction if exists
    const { data: aiPrediction, error: aiError } = await supabaseAdmin
      .from("ai_treatment_predictions")
      .select("*")
      .eq("patient_id", patientId)
      .eq("clinic_id", clinicId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      questions: questions || [],
      documents: documents || [],
      responses: responses || [],
      uploadedDocuments: uploadedDocuments || [],
      aiPrediction: aiPrediction || null,
    });
  } catch (error) {
    console.error("Error fetching patient onboarding data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clinicId: string; patientId: string }> }
) {
  try {
    const { clinicId, patientId } = await params;

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: patient } = await supabaseAdmin
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .eq("auth_user_id", user.id)
      .single();

    if (!patient) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { responses, completeOnboarding = false } = body;

    // Insert or update responses
    if (responses && responses.length > 0) {
      const responseInserts = responses.map((response: any) => ({
        patient_id: patientId,
        clinic_id: clinicId,
        question_id: response.questionId,
        response_value: response.value,
        response_options: response.options,
      }));

      // Use upsert to handle both insert and update
      const { error: responseError } = await supabaseAdmin
        .from("patient_question_responses")
        .upsert(responseInserts, {
          onConflict: "patient_id,question_id",
          ignoreDuplicates: false,
        });

      if (responseError) {
        console.error("Error saving patient responses:", responseError);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }

    // Mark onboarding as complete if requested
    if (completeOnboarding) {
      const { error: updateError } = await supabaseAdmin
        .from("patients")
        .update({
          onboarding_completed: true,
        })
        .eq("id", patientId);

      if (updateError) {
        console.error("Error updating onboarding status:", updateError);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: completeOnboarding
        ? "Onboarding completed successfully"
        : "Responses saved successfully",
    });
  } catch (error) {
    console.error("Error saving patient onboarding responses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
