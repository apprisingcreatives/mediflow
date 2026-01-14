import { Suspense } from "react";
import OnboardingManagement from "@/components/clinic/onboarding-management";

interface OnboardingPageProps {
  params: Promise<{ clinicId: string }>;
}

export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const { clinicId } = await params;

  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<div>Loading...</div>}>
        <OnboardingManagement clinicId={clinicId} />
      </Suspense>
    </div>
  );
}
