import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { clinic, admin, services } = await request.json();

    if (!clinic.name || !clinic.email) {
      return NextResponse.json(
        { error: "Clinic name and email are required" },
        { status: 400 }
      );
    }

    if (!admin.name || !admin.email || !admin.password) {
      return NextResponse.json(
        { error: "Admin name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if clinic email already exists
    const { data: existingClinic } = await supabase
      .from("clinics")
      .select("id")
      .eq("email", clinic.email)
      .single();

    if (existingClinic) {
      return NextResponse.json(
        { error: "A clinic with this email already exists" },
        { status: 400 }
      );
    }

    // Check if admin email already exists
    const { data: existingAdmin } = await supabase
      .from("clinic_admins")
      .select("id")
      .eq("email", admin.email)
      .single();

    if (existingAdmin) {
      return NextResponse.json(
        { error: "An admin with this email already exists" },
        { status: 400 }
      );
    }

    // Create clinic
    const { data: newClinic, error: clinicError } = await supabase
      .from("clinics")
      .insert({
        name: clinic.name,
        email: clinic.email,
        phone: clinic.phone || null,
        address: clinic.address || null,
        city: clinic.city || null,
        description: clinic.description || null,
        subscription_plan: clinic.subscription_plan || "starter",
      })
      .select()
      .single();

    if (clinicError) {
      return NextResponse.json({ error: clinicError.message }, { status: 500 });
    }

    // Hash password and create admin
    const passwordHash = await bcrypt.hash(admin.password, 10);

    const { error: adminError } = await supabase.from("clinic_admins").insert({
      clinic_id: newClinic.id,
      name: admin.name,
      email: admin.email,
      password_hash: passwordHash,
      role: "admin",
    });

    if (adminError) {
      // Rollback clinic creation
      await supabase.from("clinics").delete().eq("id", newClinic.id);
      return NextResponse.json({ error: adminError.message }, { status: 500 });
    }

    // Create services
    if (services && services.length > 0) {
      const servicesToInsert = services.map((service: {
        name: string;
        description?: string;
        duration?: string;
        price: string;
      }) => ({
        clinic_id: newClinic.id,
        name: service.name,
        description: service.description || null,
        duration_minutes: parseInt(service.duration || "30"),
        price: parseFloat(service.price),
      }));

      await supabase.from("clinic_services").insert(servicesToInsert);
    }

    // Create AI features for the clinic
    const { data: features } = await supabase
      .from("ai_features")
      .select("id, is_premium");

    if (features) {
      const clinicFeatures = features.map((feature) => ({
        clinic_id: newClinic.id,
        feature_id: feature.id,
        is_enabled: !feature.is_premium,
      }));

      await supabase.from("clinic_ai_features").insert(clinicFeatures);
    }

    return NextResponse.json(
      {
        message: "Clinic registered successfully",
        clinic: newClinic,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
