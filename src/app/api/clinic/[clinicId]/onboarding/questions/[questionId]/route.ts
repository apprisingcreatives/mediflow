import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clinicId: string; questionId: string }> }
) {
  try {
    const { clinicId, questionId } = await params;

    const { data: question, error } = await supabaseAdmin
      .from("clinic_onboarding_questions")
      .select("*")
      .eq("id", questionId)
      .eq("clinic_id", clinicId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Error fetching onboarding question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clinicId: string; questionId: string }> }
) {
  try {
    const { clinicId, questionId } = await params;
    const body = await request.json();

    const { data: question, error } = await supabaseAdmin
      .from("clinic_onboarding_questions")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", questionId)
      .eq("clinic_id", clinicId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Error updating onboarding question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ clinicId: string; questionId: string }> }
) {
  try {
    const { clinicId, questionId } = await params;

    // Soft delete by setting is_active to false
    const { error } = await supabaseAdmin
      .from("clinic_onboarding_questions")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", questionId)
      .eq("clinic_id", clinicId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting onboarding question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
