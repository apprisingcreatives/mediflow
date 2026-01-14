import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clinicId: string; documentId: string }> }
) {
  try {
    const { clinicId, documentId } = await params;

    const { data: document, error } = await supabaseAdmin
      .from("clinic_required_documents")
      .select("*")
      .eq("id", documentId)
      .eq("clinic_id", clinicId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Error fetching required document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clinicId: string; documentId: string }> }
) {
  try {
    const { clinicId, documentId } = await params;
    const body = await request.json();

    const { data: document, error } = await supabaseAdmin
      .from("clinic_required_documents")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .eq("clinic_id", clinicId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Error updating required document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ clinicId: string; documentId: string }> }
) {
  try {
    const { clinicId, documentId } = await params;

    // Soft delete by setting is_active to false
    const { error } = await supabaseAdmin
      .from("clinic_required_documents")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .eq("clinic_id", clinicId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting required document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
