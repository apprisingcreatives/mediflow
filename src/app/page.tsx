import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/home/hero-section";
import { TrustBar } from "@/components/home/trust-bar";
import { FeaturesSection } from "@/components/home/features-section";
import { HowItWorksSection } from "@/components/home/how-it-works";
import { CTASection } from "@/components/home/cta-section";
import dynamic from "next/dynamic";

const ComparisonSection = dynamic(
  () =>
    import("@/components/home/comparison-section").then(
      (mod) => mod.ComparisonSection
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 animate-pulse bg-clinic-bg dark:bg-slate-900 rounded-2xl" />
    ),
  }
);

const RoiCalculator = dynamic(
  () =>
    import("@/components/home/roi-calculator").then(
      (mod) => mod.RoiCalculator
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 animate-pulse bg-white dark:bg-slate-900 rounded-2xl" />
    ),
  }
);

const TestimonialsSection = dynamic(
  () =>
    import("@/components/home/testimonials-section").then(
      (mod) => mod.TestimonialsSection
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] animate-pulse bg-white dark:bg-slate-800 rounded-2xl" />
    ),
  }
);

const PricingSection = dynamic(
  () =>
    import("@/components/home/pricing-section").then(
      (mod) => mod.PricingSection
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 animate-pulse bg-clinic-bg dark:bg-slate-900 rounded-2xl" />
    ),
  }
);

const LeadMagnet = dynamic(
  () =>
    import("@/components/home/lead-magnet").then((mod) => mod.LeadMagnet),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse bg-clinic-navy rounded-2xl" />
    ),
  }
);

const FAQSection = dynamic(
  () =>
    import("@/components/home/faq-section").then((mod) => mod.FAQSection),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 animate-pulse bg-white dark:bg-slate-900 rounded-2xl" />
    ),
  }
);

const StickyMobileCTA = dynamic(
  () =>
    import("@/components/home/sticky-mobile-cta").then(
      (mod) => mod.StickyMobileCTA
    ),
  { ssr: false }
);



export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <TrustBar />
      <ComparisonSection />
      <FeaturesSection />
      <HowItWorksSection />
      <RoiCalculator />
      <TestimonialsSection />
      <PricingSection />
      <LeadMagnet />
      <FAQSection />
      <CTASection />
      <Footer />
      <StickyMobileCTA />

    </main>
  );
}
