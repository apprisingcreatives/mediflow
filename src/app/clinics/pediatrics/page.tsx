import { NicheLandingPage } from "@/components/marketing/niche-landing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Pediatric Clinic Management Software",
  description: "MediFlow is the AI-powered pediatric clinic management software. Manage appointments, vaccination records, growth charts, and parent communications from one platform.",
};

export default function PediatricsPage() {
  return (
    <NicheLandingPage
      specialty="Pediatric"
      headline="The Complete Practice Management Platform for Pediatric Clinics"
      subheadline="Manage vaccinations, well-baby visits, growth tracking, and parent communications from one AI-powered platform designed for pediatricians."
      painPoints={[
        "Tracking vaccination schedules manually across hundreds of patients",
        "Parents booking appointments via Messenger with no centralized record",
        "Paper growth charts that are difficult to compare longitudinally",
        "No automated reminders for immunization schedules and follow-up visits",
        "Coordinating between multiple pediatricians in the same clinic manually",
        "Difficulty generating developmental screening reports efficiently",
      ]}
      features={[
        { title: "Vaccination Schedule Tracking", description: "Built-in immunization tracking with automated reminders when doses are due. Never miss a vaccine schedule." },
        { title: "Growth Chart Records", description: "Log height, weight, and head circumference with age-appropriate tracking across visits." },
        { title: "Parent Communication Portal", description: "Secure messaging with parents for appointment confirmations, health updates, and lab result notifications." },
        { title: "AI Visit Summaries", description: "Auto-generate well-baby visit notes and developmental screening summaries for parents." },
        { title: "Multi-Doctor Scheduling", description: "Coordinate multiple pediatricians with individual calendars and shared patient access." },
        { title: "Online Appointment Booking", description: "Parents can book check-ups, sick visits, and vaccination appointments online 24/7." },
      ]}
      testimonial={{
        quote: "Parents love the automated vaccine reminders — it reduced our missed immunization rate dramatically. MediFlow is essential for our pediatric practice.",
        author: "Dr. Maria Cruz",
        role: "Pediatrician & Owner",
        clinic: "Little Stars Children's Clinic, Quezon City",
      }}
      faq={[
        { q: "Does MediFlow track vaccination schedules?", a: "Yes. MediFlow includes configurable immunization schedule tracking with automated SMS and email reminders when doses are due." },
        { q: "Can parents book appointments online?", a: "Absolutely. Parents can self-book well-child visits, sick visits, and vaccinations through your branded patient portal." },
        { q: "Does MediFlow support growth chart tracking?", a: "Yes. You can log growth metrics at each visit and view longitudinal charts to track developmental progress." },
      ]}
    />
  );
}
