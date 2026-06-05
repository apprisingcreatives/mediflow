import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  let createdClinicId: string | null = null;
  let createdAuthUserId: string | null = null;

  try {
    const { clinic, admin, services } = await request.json();

    // --- Basic validations ---
    if (!clinic.name || !clinic.email) {
      return NextResponse.json(
        { error: "Clinic name and email are required" },
        { status: 400 }
      );
    }

    if (!admin.name || !admin.email) {
      return NextResponse.json(
        { error: "Admin name and email are required" },
        { status: 400 }
      );
    }

    // --- Check if clinic email already exists ---
    const { data: existingClinic } = await supabaseAdmin
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

    // --- Check if admin email already exists in clinic_admins ---
    const { data: existingAdmin } = await supabaseAdmin
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

    // --- Calculate trial dates ---
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    // --- Generate slug from clinic name ---
    const generateSlug = (name: string): string => {
      return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    };

    const baseSlug = generateSlug(clinic.name);
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (true) {
      const { data: existingSlug } = await supabaseAdmin
        .from("clinics")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!existingSlug) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // --- Create clinic ---
    const { data: newClinic, error: clinicError } = await supabaseAdmin
      .from("clinics")
      .insert({
        name: clinic.name,
        email: clinic.email,
        phone: clinic.phone || null,
        address: clinic.address || null,
        city: clinic.city || null,
        description: clinic.description || null,
        slug: slug, // Add the generated slug
        subscription_plan: clinic.subscription_plan || "starter",
        trial_start_date: trialStartDate.toISOString(),
        trial_end_date: trialEndDate.toISOString(),
        is_trial_active: true,
        is_subscription_active: true,
        payment_status: "trial",
      })
      .select()
      .single();

    if (clinicError) {
      return NextResponse.json({ error: clinicError.message }, { status: 500 });
    }

    createdClinicId = newClinic.id;

    // Create admin user in Supabase Auth with password
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true, // Auto-confirm email for clinic admins
        user_metadata: {
          name: admin.name,
          role: "clinic_admin",
          clinic_id: newClinic.id,
        },
      });

    if (authError || !authUser.user) {
      if (createdClinicId) {
        await supabaseAdmin.from("clinics").delete().eq("id", createdClinicId);
      }
      return NextResponse.json(
        { error: authError?.message || "Failed to create admin user" },
        { status: 500 }
      );
    }

    createdAuthUserId = authUser.user.id;

    // Insert admin record into clinic_admins table
    const { error: adminInsertError } = await supabaseAdmin
      .from("clinic_admins")
      .insert({
        clinic_id: newClinic.id,
        email: admin.email,
        name: admin.name,
        role: "admin",
        auth_user_id: authUser.user.id,
      });

    if (adminInsertError) {
      if (createdClinicId) {
        await supabaseAdmin.from("clinics").delete().eq("id", createdClinicId);
      }
      if (createdAuthUserId) {
        await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
      }
      return NextResponse.json(
        { error: adminInsertError.message },
        { status: 500 }
      );
    }

    // --- Insert services if provided ---
    if (services && services.length > 0) {
      const servicesToInsert = services.map(
        (service: {
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
        })
      );

      const { error: servicesInsertError } = await supabaseAdmin
        .from("clinic_services")
        .insert(servicesToInsert);

      if (servicesInsertError) {
        throw new Error(`Failed to insert clinic services: ${servicesInsertError.message}`);
      }
    }

    // Note: AI features are populated automatically by the database trigger:
    // trigger_populate_clinic_ai_features (AFTER INSERT ON public.clinics)
    // There is no need to manually insert them in this route.

    // --- Response ---
    return NextResponse.json(
      {
        message:
          "Clinic registered successfully. Admin invite has been sent via email.",
        clinic: {
          ...newClinic,
          trial_end_date: trialEndDate.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);

    // Rollback any partially created resources to prevent locked states
    if (createdClinicId) {
      await supabaseAdmin.from("clinics").delete().eq("id", createdClinicId);
    }
    if (createdAuthUserId) {
      await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
