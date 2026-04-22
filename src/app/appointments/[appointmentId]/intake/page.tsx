'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import PatientOnboarding from '@/components/patient/patient-onboarding';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function IntakePage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;
  const { user, patient, isLoading: authLoading } = useAuth();

  const [clinicId, setClinicId] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState<string>('');
  const [intakeStatus, setIntakeStatus] = useState<string>('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    const fetchAppointment = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/appointments/${appointmentId}/intake`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setClinicId(data.appointment.clinic_id);
        setClinicName(data.clinic?.name || '');
        setIntakeStatus(data.appointment.intake_status);
      }
      setLoading(false);
    };

    if (user) fetchAppointment();
  }, [appointmentId, user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (intakeStatus === 'completed') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-green-500 mb-4">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Intake Complete!</h2>
            <p className="text-center text-muted-foreground">
              Your pre-visit intake for {clinicName} has been completed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clinicId || !patient) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl mb-6">
        <h1 className="font-display text-2xl font-bold text-clinic-navy dark:text-white">
          Pre-Visit Intake
        </h1>
        <p className="text-muted-foreground mt-1">
          {clinicName} has requested the following information before your appointment.
        </p>
      </div>
      <PatientOnboarding
        clinicId={clinicId}
        patientId={patient.id}
        appointmentId={appointmentId}
        onComplete={() => router.push('/patient')}
      />
    </div>
  );
}
