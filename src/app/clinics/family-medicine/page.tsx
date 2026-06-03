import { NicheLandingPage } from "@/components/marketing/niche-landing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Family Medicine Clinic Management Software",
  description: "MediFlow is the AI-powered family medicine clinic management software. Manage patient records for all ages, appointment scheduling, chronic care tracking, and preventive health from one platform.",
};

export default function FamilyMedicinePage() {
  return (
    <NicheLandingPage
      specialty="Family Medicine"
      headline="The Complete Platform for Family Medicine Practices"
      subheadline="Manage patients of all ages — from newborns to seniors — with one intelligent platform for scheduling, records, chronic care management, and preventive health reminders."
      painPoints={[
        "Managing diverse patient populations (pediatric to geriatric) with inconsistent records",
        "Tracking chronic disease management (diabetes, hypertension) follow-ups manually",
        "No automated reminders for annual physicals, flu shots, and preventive screenings",
        "Coordinating multi-provider schedules in a busy family practice",
        "Paper charts that make it hard to review patient and family medical history quickly",
        "Patients scheduling via call or walk-in with no online booking option",
      ]}
      features={[
        { title: "All-Ages Patient Records", description: "Comprehensive records from pediatric to geriatric patients with age-appropriate templates and fields." },
        { title: "Chronic Care Management", description: "Track chronic conditions like diabetes and hypertension with scheduled follow-ups and care plan templates." },
        { title: "Preventive Health Reminders", description: "Automated reminders for annual physicals, vaccinations, cancer screenings, and health maintenance visits." },
        { title: "Family Medical History", description: "Link patient records by family to track hereditary conditions and genetic risk factors." },
        { title: "AI Clinical Documentation", description: "Auto-generate comprehensive visit notes for diverse encounter types — from well-child checks to chronic care reviews." },
        { title: "Multi-Provider Scheduling", description: "Coordinate multiple physicians and nurse practitioners with individual calendars and shared patient access." },
      ]}
      testimonial={{
        quote: "As a family medicine clinic, we see patients from 2 months to 90 years old. MediFlow handles all of them seamlessly with the right templates and reminders for each age group.",
        author: "Dr. Roberto Tan",
        role: "Family Medicine Physician",
        clinic: "Complete Care Family Clinic, Manila",
      }}
      faq={[
        { q: "Does MediFlow support different record types for different ages?", a: "Yes. MediFlow allows you to configure age-appropriate templates and fields, from pediatric growth charts to geriatric care assessments." },
        { q: "Can MediFlow track chronic disease management?", a: "Absolutely. Set up chronic care plans with scheduled follow-ups, medication tracking, and outcome monitoring." },
        { q: "Does MediFlow support family medical history tracking?", a: "Yes. You can link patient records within a family to maintain visibility into hereditary conditions and shared risk factors." },
      ]}
    />
  );
}
