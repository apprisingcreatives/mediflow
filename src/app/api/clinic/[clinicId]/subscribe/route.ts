import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const { clinicId } = await params;
    const { plan, billing_cycle, amount, card_last_four } =
      await request.json();

    // Get clinic data
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("*")
      .eq("id", clinicId)
      .single();

    if (clinicError || !clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Calculate next billing date
    const nextBillingDate = new Date();
    if (billing_cycle === "yearly") {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }

    // Update clinic subscription
    const { error: updateError } = await supabase
      .from("clinics")
      .update({
        subscription_plan: plan,
        is_trial_active: false,
        is_subscription_active: true,
        payment_status: "active",
        last_payment_date: new Date().toISOString(),
        next_billing_date: nextBillingDate.toISOString(),
      })
      .eq("id", clinicId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Create payment record
    const { error: paymentError } = await supabase
      .from("clinic_payments")
      .insert({
        clinic_id: clinicId,
        amount,
        currency: "PHP",
        payment_method: `Card ending in ${card_last_four}`,
        status: "paid",
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - ${billing_cycle === "yearly" ? "Annual" : "Monthly"} Subscription`,
        paid_at: new Date().toISOString(),
      });

    if (paymentError) {
      console.error("Payment record error:", paymentError);
    }

    // Queue payment confirmation email
    const { data: admin } = await supabase
      .from("clinic_admins")
      .select("email, name")
      .eq("clinic_id", clinicId)
      .limit(1)
      .single();

    if (admin) {
      await supabase.from("email_notifications").insert({
        recipient_email: admin.email,
        recipient_name: admin.name,
        recipient_type: "clinic",
        subject: "Payment Successful - MediFlow Subscription Active",
        body: `Dear ${admin.name}, Your payment of ₱${amount.toLocaleString()} for the ${plan} plan has been processed successfully. Your subscription is now active.`,
        html_body: `<h1>Payment Successful</h1><p>Dear ${admin.name},</p><p>Your payment of <strong>₱${amount.toLocaleString()}</strong> for the <strong>${plan}</strong> plan has been processed successfully.</p><p>Your subscription is now active. Enjoy all the features!</p>`,
        notification_type: "payment_success",
        related_entity_type: "clinic",
        related_entity_id: clinicId,
        status: "pending",
      });
    }

    return NextResponse.json({
      message: "Subscription activated successfully",
      subscription: {
        plan,
        billing_cycle,
        next_billing_date: nextBillingDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
