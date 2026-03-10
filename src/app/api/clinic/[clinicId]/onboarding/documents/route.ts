import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const { clinicId } = await params;

    const { data: documents, error } = await supabaseAdmin
      .from("clinic_required_documents")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Error fetching required documents:", error);
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
      document_name,
      document_description,
      is_required = true,
      allowed_file_types,
      max_file_size_mb = 10,
      display_order,
      category,
    } = body;

    if (!document_name || display_order === undefined) {
      return NextResponse.json(
        { error: "Document name and display order are required" },
        { status: 400 }
      );
    }

    const { data: document, error } = await supabaseAdmin
      .from("clinic_required_documents")
      .insert({
        clinic_id: clinicId,
        document_name,
        document_description,
        is_required,
        allowed_file_types,
        max_file_size_mb,
        display_order,
        category,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Error creating required document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
