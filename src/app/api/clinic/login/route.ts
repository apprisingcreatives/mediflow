import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Get admin with clinic info
    const { data: admin, error } = await supabaseAdmin
      .from("clinic_admins")
      .select(
        `
        *,
        clinics (*)
      `
      )
      .eq("email", email)
      .single();

    if (error || !admin) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!admin.is_active) {
      return NextResponse.json(
        { error: "Your account has been deactivated" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check and update trial status
    const clinic = admin.clinics;
    if (clinic && clinic.payment_status === "trial" && clinic.trial_end_date) {
      const trialEnd = new Date(clinic.trial_end_date);
      const today = new Date();

      if (today > trialEnd && clinic.is_trial_active) {
        // Trial expired, update status
        await supabaseAdmin
          .from("clinics")
          .update({
            is_trial_active: false,
            is_subscription_active: false,
          })
          .eq("id", clinic.id);

        clinic.is_trial_active = false;
        clinic.is_subscription_active = false;
      }
    }

    // Generate token
    const token = Buffer.from(
      `${admin.id}:${admin.clinic_id}:${Date.now()}`
    ).toString("base64");

    return NextResponse.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      clinic,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
