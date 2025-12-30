import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: clinics, error } = await supabase
      .from("clinics")
      .select(`
        *,
        clinic_services (*),
        clinic_ai_features (
          *,
          ai_features (*)
        ),
        practitioners (*),
        clinic_admins (*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clinics });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, address, city, description, subscription_plan } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const { data: clinic, error } = await supabase
      .from("clinics")
      .insert({
        name,
        email,
        phone,
        address,
        city,
        description,
        subscription_plan: subscription_plan || "starter",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create default AI features for the clinic
    const { data: features } = await supabase
      .from("ai_features")
      .select("id, is_premium");

    if (features) {
      const clinicFeatures = features.map((feature) => ({
        clinic_id: clinic.id,
        feature_id: feature.id,
        is_enabled: !feature.is_premium,
      }));

      await supabase.from("clinic_ai_features").insert(clinicFeatures);
    }

    return NextResponse.json({ clinic }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
