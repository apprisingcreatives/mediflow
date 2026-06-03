import { NicheLandingPage } from "@/components/marketing/niche-landing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best OB-GYN Clinic Management Software",
  description: "MediFlow is the AI-powered OB-GYN clinic management software. Manage prenatal visits, patient records, ultrasound attachments, and appointment scheduling from one platform.",
};

export default function ObGynPage() {
  return (
    <NicheLandingPage
      specialty="OB-GYN"
      headline="AI-Powered Practice Management for OB-GYN Clinics"
      subheadline="Manage prenatal schedules, patient histories, ultrasound attachments, and postpartum follow-ups from one comprehensive platform built for obstetric and gynecological practices."
      painPoints={[
        "Tracking prenatal visit schedules across trimesters manually",
        "No centralized system for storing ultrasound images and lab results",
        "Patients scheduling prenatal appointments via Viber with no digital record",
        "Difficulty managing postpartum follow-up schedules and compliance",
        "Paper-based obstetric records that are hard to share between providers",
        "No automated reminders for critical prenatal milestones and check-ups",
      ]}
      features={[
        { title: "Prenatal Visit Tracking", description: "Configure trimester-based visit schedules with automated reminders for each milestone check-up." },
        { title: "Ultrasound & Lab Attachments", description: "Attach ultrasound images, lab results, and diagnostic reports directly to patient records." },
        { title: "AI Clinical Summaries", description: "Auto-generate prenatal visit notes, delivery summaries, and postpartum care plans." },
        { title: "Postpartum Follow-Up System", description: "Automated reminders for postpartum check-ups, newborn visits, and contraceptive counseling." },
        { title: "Patient History Timeline", description: "Complete obstetric and gynecological history in a searchable, chronological timeline view." },
        { title: "Online Booking Portal", description: "Patients book prenatal, annual exam, and consultation appointments online at their convenience." },
      ]}
      testimonial={{
        quote: "MediFlow's prenatal tracking system is exactly what our OB-GYN clinic needed. Our patients stay on schedule, and our team saves hours on documentation.",
        author: "Dr. Carla Mendoza",
        role: "OB-GYN & Clinic Director",
        clinic: "Women's Wellness OB-GYN, Cebu City",
      }}
      faq={[
        { q: "Does MediFlow support prenatal visit scheduling?", a: "Yes. MediFlow allows you to set up trimester-based visit schedules with automated reminders for each milestone, ensuring patients stay on track." },
        { q: "Can I attach ultrasound images to patient records?", a: "Absolutely. You can upload and attach ultrasound images, lab results, and any diagnostic files directly to each patient's record." },
        { q: "Does MediFlow handle postpartum follow-ups?", a: "Yes. You can configure automated postpartum follow-up reminders for mothers and newborn check-ups." },
      ]}
    />
  );
}
