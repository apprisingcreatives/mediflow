import { NicheLandingPage } from "@/components/marketing/niche-landing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Dental Clinic Management Software",
  description: "MediFlow is the AI-powered dental clinic management software. Manage appointments, patient records, treatment plans, and billing for your dental practice from one platform.",
};

export default function DentalPage() {
  return (
    <NicheLandingPage
      specialty="Dental"
      headline="The AI-Powered Platform Built for Modern Dental Clinics"
      subheadline="Manage appointments, treatment plans, patient records, and billing from one secure platform designed specifically for dental practices."
      painPoints={[
        "Scheduling cleanings, braces adjustments, and emergency slots manually via Messenger or Viber",
        "Paper-based dental charts that are hard to search, share, or back up",
        "No automated recall reminders for 6-month check-ups and cleanings",
        "Tracking treatment plans across multiple visits is error-prone with Excel",
        "Lost revenue from no-shows and last-minute cancellations",
        "No visibility into chair utilization rates or revenue per procedure",
      ]}
      features={[
        { title: "Dental-Specific Scheduling", description: "Book cleanings, procedures, and emergency slots with real-time chair availability and automated reminders." },
        { title: "Digital Treatment Plans", description: "Create, track, and update multi-visit treatment plans with progress notes and photo attachments." },
        { title: "Automated Recall System", description: "Never miss a 6-month check-up. Automated recall reminders keep patients returning on schedule." },
        { title: "AI Clinical Notes", description: "Auto-generate procedure notes and post-treatment summaries. Save 15+ minutes per patient." },
        { title: "Revenue Analytics", description: "Track revenue per procedure type, chair utilization, and daily performance in real time." },
        { title: "Patient Portal", description: "Let patients book, confirm, reschedule, and fill intake forms online — 24/7." },
      ]}
      testimonial={{
        quote: "We reduced our no-show rate from 18% to under 5% within 2 months of using MediFlow. The automated reminders alone paid for the subscription.",
        author: "Dr. Patricia Reyes",
        role: "Owner",
        clinic: "Smile Perfect Dental Clinic, Makati",
      }}
      faq={[
        { q: "Does MediFlow support dental charting?", a: "MediFlow provides digital patient records that you can customize for dental-specific fields including treatment plans, tooth-specific notes, and X-ray attachments." },
        { q: "Can I track multi-visit treatment plans?", a: "Yes. You can create treatment plans with multiple phases and track progress across visits, including cost breakdowns and completion status." },
        { q: "Does MediFlow send recall reminders?", a: "Absolutely. You can configure automated recall reminders (e.g., every 6 months) via SMS and email to keep patients on their cleaning schedules." },
      ]}
    />
  );
}
