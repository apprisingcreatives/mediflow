"use client";

import { useAuth } from "@/hooks/use-auth";
import { useParams } from "next/navigation";
import PatientOnboarding from "@/components/patient/patient-onboarding";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function PatientOnboardingPage() {
  const { user, patient, canAccessClinic } = useAuth();
  const params = useParams();
  const clinicId = params.clinicId as string;

  if (!user || !patient) {
    return <div>Please log in to access this page</div>;
  }

  // Check if patient belongs to this clinic
  if (!canAccessClinic(clinicId)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-red-500 mb-4">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-center text-muted-foreground">
              You can only access clinics you are registered with.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (patient.onboarding_completed) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-green-500 mb-4">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Onboarding Complete!</h2>
            <p className="text-center text-muted-foreground">
              Your health profile has been successfully completed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <PatientOnboarding
        clinicId={clinicId}
        patientId={patient.id}
        onComplete={() => {
          // Refresh the page to show completion state
          window.location.reload();
        }}
      />
    </div>
  );
}
