import { NicheLandingPage } from "@/components/marketing/niche-landing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Dermatology Clinic Management Software",
  description: "MediFlow is the AI-powered dermatology clinic management software. Manage appointments, patient skin records, photo history, and cosmetic service packages from one platform.",
};

export default function DermatologyPage() {
  return (
    <NicheLandingPage
      specialty="Dermatology"
      headline="Streamline Your Dermatology Practice With AI-Powered Management"
      subheadline="From acne consultations to cosmetic procedures — manage patient photo histories, treatment protocols, and scheduling from one intelligent platform."
      painPoints={[
        "No organized system for tracking patient skin progress photos across visits",
        "Manual scheduling of recurring treatments (laser, peels, facials) via Viber or text",
        "Paper-based records make it impossible to compare before-and-after results efficiently",
        "Cosmetic package tracking (sessions used vs remaining) is done manually in spreadsheets",
        "Missed follow-up appointments lead to treatment protocol interruptions",
        "No automated reminders for multi-session cosmetic treatment courses",
      ]}
      features={[
        { title: "Photo History Tracking", description: "Attach and compare before-and-after photos across visits. Built-in timeline view for tracking skin progress." },
        { title: "Treatment Package Management", description: "Create service packages (e.g., 10 laser sessions) and track usage, remaining sessions, and expiration dates." },
        { title: "AI Consultation Summaries", description: "Auto-generate dermatology visit notes including diagnoses, prescribed treatments, and follow-up plans." },
        { title: "Recurring Appointment Scheduling", description: "Book recurring sessions for treatment protocols with automatic reminders at each interval." },
        { title: "Cosmetic Revenue Analytics", description: "Track revenue by service type — medical vs cosmetic — and identify your most profitable procedures." },
        { title: "Patient Self-Booking", description: "Let patients book consultations, follow-ups, and cosmetic sessions online through a branded portal." },
      ]}
      testimonial={{
        quote: "MediFlow transformed how we track treatment courses. Our patients love the before-and-after photo timeline, and our staff saves hours every week on scheduling.",
        author: "Dr. Angela Lim",
        role: "Medical Director",
        clinic: "Glow Dermatology Center, BGC",
      }}
      faq={[
        { q: "Can MediFlow store patient photos?", a: "Yes. MediFlow supports photo attachments on patient records, allowing you to build visual timelines of treatment progress." },
        { q: "Can I manage cosmetic service packages?", a: "Absolutely. Create packages with a set number of sessions, track usage per patient, and set expiration dates." },
        { q: "Does MediFlow support both medical and cosmetic dermatology?", a: "Yes. You can configure separate service categories, pricing, and appointment types for medical consultations and cosmetic procedures." },
      ]}
    />
  );
}
