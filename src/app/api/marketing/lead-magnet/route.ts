import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Attempt to queue the email
    const { success, error } = await sendEmail({
      recipientEmail: email,
      recipientName: "Clinic Professional",
      recipientType: "clinic",
      subject: "Your Free Clinic Operations Checklist",
      body: "Hi there!\n\nHere is your free Clinic Operations Checklist to help you streamline operations, reduce no-shows, and improve patient satisfaction scores.\n\nDownload Link: https://mediflow.apprisingcreatives.com/resources/clinic-operations-checklist.pdf\n\nBest regards,\nThe MediFlow Team",
      htmlBody: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1F3A5F;">
          <h2>Here is your free Clinic Operations Checklist!</h2>
          <p>Hi there,</p>
          <p>As promised, here is your comprehensive 25-point checklist that top-performing clinics use to streamline operations, reduce no-shows, and improve patient satisfaction scores.</p>
          <div style="margin: 30px 0;">
            <a href="https://mediflow.apprisingcreatives.com/resources/clinic-operations-checklist.pdf" style="background-color: #2FB7A1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Download Your Checklist
            </a>
          </div>
          <p>If you're interested in seeing how MediFlow can automate these tasks for you, <a href="https://mediflow.apprisingcreatives.com/demo" style="color: #6C7CFF;">book a live demo with our team</a>.</p>
          <p>Best regards,<br>The MediFlow Team</p>
        </div>
      `,
      notificationType: "lead_magnet_checklist",
    });

    if (!success) {
      console.error("Error sending lead magnet email:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Checklist sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Lead magnet API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
