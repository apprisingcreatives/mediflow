import { NicheLandingPage } from "@/components/marketing/niche-landing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Wellness Clinic Management Software",
  description: "MediFlow is the AI-powered wellness clinic management software. Manage therapy programs, holistic treatments, client records, and appointment scheduling from one platform.",
};

export default function WellnessPage() {
  return (
    <NicheLandingPage
      specialty="Wellness"
      headline="Manage Your Wellness Center With One AI-Powered Platform"
      subheadline="From therapy programs to holistic treatments — manage client schedules, treatment records, membership packages, and staff coordination from one platform."
      painPoints={[
        "Managing multiple service types (massage, acupuncture, therapy) in one calendar",
        "Tracking membership packages and session credits manually in spreadsheets",
        "Clients booking via Messenger or walk-in with no digital appointment system",
        "No automated follow-up for treatment course completion and rebooking",
        "Difficulty tracking revenue per service type and therapist performance",
        "Paper client records that lack continuity between multiple therapists",
      ]}
      features={[
        { title: "Multi-Service Scheduling", description: "Schedule massages, therapy sessions, acupuncture, and consultations with service-specific time slots and room allocation." },
        { title: "Membership & Package Tracking", description: "Create wellness packages with session credits, track usage, and send automated renewal reminders." },
        { title: "Therapist Performance Dashboard", description: "Track bookings, revenue, and client satisfaction per therapist to optimize staffing and operations." },
        { title: "Client Treatment Timeline", description: "Maintain a complete treatment history across all services for continuity of care between practitioners." },
        { title: "AI Session Notes", description: "Auto-generate session summaries and treatment progress notes. Reduce documentation time by 60%." },
        { title: "Online Self-Booking", description: "Let clients browse services, check availability, and book appointments online 24/7." },
      ]}
      testimonial={{
        quote: "Our wellness center offers 8 different services. MediFlow finally gave us one unified system to manage everything — scheduling, packages, and client records.",
        author: "Anna Santos",
        role: "Operations Manager",
        clinic: "Harmony Wellness Center, Taguig",
      }}
      faq={[
        { q: "Can MediFlow handle multiple service types?", a: "Yes. You can configure different appointment types, durations, pricing, and room requirements for each service your wellness center offers." },
        { q: "Does MediFlow track membership packages?", a: "Absolutely. Create packages with session credits, expiration dates, and automated renewal reminders." },
        { q: "Can multiple therapists use MediFlow?", a: "Yes. Each therapist gets their own calendar and login, while managers maintain central visibility over all bookings and performance." },
      ]}
    />
  );
}
