import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const { clinicId } = await params;

    const { data: features, error } = await supabase
      .from("clinic_ai_features")
      .select(`
        *,
        ai_features (*)
      `)
      .eq("clinic_id", clinicId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ features });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const { clinicId } = await params;
    const { featureId, isEnabled, adminId } = await request.json();

    if (!featureId) {
      return NextResponse.json(
        { error: "Feature ID is required" },
        { status: 400 }
      );
    }

    const { data: feature, error } = await supabase
      .from("clinic_ai_features")
      .update({
        is_enabled: isEnabled,
        enabled_by: isEnabled ? adminId : null,
        enabled_at: isEnabled ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("clinic_id", clinicId)
      .eq("feature_id", featureId)
      .select(`
        *,
        ai_features (*)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feature });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
