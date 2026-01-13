import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: clinic, error } = await supabase
      .from("clinics")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Check and update trial status
    if (clinic.payment_status === "trial" && clinic.trial_end_date) {
      const trialEnd = new Date(clinic.trial_end_date);
      const today = new Date();
      
      if (today > trialEnd && clinic.is_trial_active) {
        // Trial expired, disable features
        await supabase
          .from("clinics")
          .update({
            is_trial_active: false,
            is_subscription_active: false,
          })
          .eq("id", id);

        clinic.is_trial_active = false;
        clinic.is_subscription_active = false;

        // Queue trial expired email
        const { data: admin } = await supabase
          .from("clinic_admins")
          .select("email, name")
          .eq("clinic_id", id)
          .limit(1)
          .single();

        if (admin) {
          await supabase.from("email_notifications").insert({
            recipient_email: admin.email,
            recipient_name: admin.name,
            recipient_type: "clinic",
            subject: "Your MediFlow Trial Has Expired",
            body: `Dear ${admin.name}, Your free trial for ${clinic.name} has expired. Some features are now disabled. Subscribe to restore full access.`,
            html_body: `<h1>Your Trial Has Expired</h1><p>Dear ${admin.name},</p><p>Your free trial for <strong>${clinic.name}</strong> has expired.</p><p>Some features are now disabled. <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '')}/clinic/billing">Subscribe now</a> to restore full access.</p>`,
            notification_type: "trial_expired",
            related_entity_type: "clinic",
            related_entity_id: id,
            status: "pending",
          });
        }
      }
    }

    return NextResponse.json({ clinic });
  } catch (error) {
    console.error("Error fetching clinic:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
