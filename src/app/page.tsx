import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/home/hero-section";
import { TrustBar } from "@/components/home/trust-bar";
import { FeaturesSection } from "@/components/home/features-section";
import { HowItWorksSection } from "@/components/home/how-it-works";
import { CTASection } from "@/components/home/cta-section";
import dynamic from "next/dynamic";

const PartnerClinicsSection = dynamic(
  () => import("@/components/home/partner-clinics-section").then((mod) => mod.PartnerClinicsSection),
  {
    ssr: false,
    loading: () => <div className="h-96 animate-pulse bg-clinic-bg dark:bg-slate-900 rounded-2xl" />,
  }
);

const TestimonialsSection = dynamic(
  () => import("@/components/home/testimonials-section").then((mod) => mod.TestimonialsSection),
  {
    ssr: false,
    loading: () => <div className="h-[400px] animate-pulse bg-white dark:bg-slate-800 rounded-2xl" />,
  }
);

const PricingSection = dynamic(
  () => import("@/components/home/pricing-section").then((mod) => mod.PricingSection),
  {
    ssr: false,
    loading: () => <div className="h-96 animate-pulse bg-clinic-bg dark:bg-slate-900 rounded-2xl" />,
  }
);

const PatientChatbot = dynamic(
  () => import("@/components/chatbot/patient-chatbot").then((mod) => mod.PatientChatbot),
  {
    ssr: false,
  }
);

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header showSignIn={false} />
      <HeroSection />
      <TrustBar />
      <FeaturesSection />
      <HowItWorksSection />
      <PartnerClinicsSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
      <PatientChatbot />
    </main>
  );
}

