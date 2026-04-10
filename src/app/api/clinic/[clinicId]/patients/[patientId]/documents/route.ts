import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

    const formData = await request.formData();

    const documentTypeId = formData.get("documentTypeId") as string;
    const file = formData.get("file") as File;

    if (!documentTypeId || !file) {
      return NextResponse.json(
        { error: "Document type ID and file are required" },
        { status: 400 }
      );
    }

    // Verify the document type belongs to this clinic
    const { data: documentType, error: typeError } = await supabaseAdmin
      .from("clinic_required_documents")
      .select("*")
      .eq("id", documentTypeId)
      .eq("clinic_id", clinicId)
      .eq("is_active", true)
      .single();

    if (typeError || !documentType) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > documentType.max_file_size_mb * 1024 * 1024) {
      return NextResponse.json(
        { error: `File size exceeds ${documentType.max_file_size_mb}MB limit` },
        { status: 400 }
      );
    }

    // Check file type
    if (documentType.allowed_file_types) {
      const allowedTypes = documentType.allowed_file_types.split(",");
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      if (!allowedTypes.includes(fileExtension || "")) {
        return NextResponse.json(
          {
            error: `File type not allowed. Allowed types: ${documentType.allowed_file_types}`,
          },
          { status: 400 }
        );
      }
    }

    // Upload file to Supabase Storage
    const fileName = `${patientId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("patient-documents")
      .upload(fileName, file);

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Save document record
    const { data: document, error: docError } = await supabaseAdmin
      .from("patient_documents")
      .insert({
        patient_id: patientId,
        file_name: file.name,
        file_path: uploadData.path,
        file_size_bytes: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (docError) {
      // Clean up uploaded file if database insert fails
      await supabaseAdmin.storage
        .from("patient-documents")
        .remove([uploadData.path]);

      return NextResponse.json({ error: docError.message }, { status: 500 });
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Error uploading patient document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
