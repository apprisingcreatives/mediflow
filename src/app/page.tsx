import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/home/hero-section";
import { TrustBar } from "@/components/home/trust-bar";
import { FeaturesSection } from "@/components/home/features-section";
import { HowItWorksSection } from "@/components/home/how-it-works";
import { PartnerClinicsSection } from "@/components/home/partner-clinics-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { PricingSection } from "@/components/home/pricing-section";
import { CTASection } from "@/components/home/cta-section";
import { PatientChatbot } from "@/components/chatbot/patient-chatbot";

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
