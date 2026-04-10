'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PatientInfo } from './types';
import { supabase } from '@/lib/supabase';

interface OnboardingBannerProps {
  patient: PatientInfo;
}

export function OnboardingBanner({ patient }: OnboardingBannerProps) {
  const router = useRouter();
  const [clinicId, setClinicId] = useState<string | null>(null);

  useEffect(() => {
    if (patient?.id) {
      supabase
        .from('patient_clinics')
        .select('clinic_id')
        .eq('patient_id', patient.id)
        .limit(1)
        .single()
        .then(({ data }) => {
          if (data) setClinicId(data.clinic_id);
        });
    }
  }, [patient?.id]);

  if (patient.onboarding_completed) {
    return null;
  }

  if (!clinicId) {
    return null;
  }

  return (
    <Card className="mb-8 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                Complete Your Health Profile
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Finish your onboarding to get personalized care recommendations
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push(`/clinic/${clinicId}/patient/onboarding`)}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Complete Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default OnboardingBanner;
