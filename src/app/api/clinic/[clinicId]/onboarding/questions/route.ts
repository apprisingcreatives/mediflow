import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const { clinicId } = await params;

    const { data: questions, error } = await supabaseAdmin
      .from("clinic_onboarding_questions")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error fetching onboarding questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const { clinicId } = await params;
    const body = await request.json();
    const {
      question_text,
      question_type,
      options,
      is_required = true,
      display_order,
      category,
    } = body;

    if (!question_text || !question_type || display_order === undefined) {
      return NextResponse.json(
        { error: "Question text, type, and display order are required" },
        { status: 400 }
      );
    }

    const { data: question, error } = await supabaseAdmin
      .from("clinic_onboarding_questions")
      .insert({
        clinic_id: clinicId,
        question_text,
        question_type,
        options,
        is_required,
        display_order,
        category,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error("Error creating onboarding question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
