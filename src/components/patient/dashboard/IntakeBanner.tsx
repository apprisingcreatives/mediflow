'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

interface IntakeBannerProps {
  patientId: string;
}

interface PendingIntake {
  id: string;
  appointment_date: string;
  appointment_time: string;
  clinic_name: string;
}

export function IntakeBanner({ patientId }: IntakeBannerProps) {
  const router = useRouter();
  const [pendingIntakes, setPendingIntakes] = useState<PendingIntake[]>([]);

  useEffect(() => {
    const fetchPendingIntakes = async () => {
      const { data } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time, clinic_id, clinics(name)')
        .eq('patient_id', patientId)
        .eq('intake_status', 'pending')
        .gte('appointment_date', new Date().toISOString().split('T')[0])
        .order('appointment_date', { ascending: true });

      if (data) {
        setPendingIntakes(
          data.map((a: any) => ({
            id: a.id,
            appointment_date: a.appointment_date,
            appointment_time: a.appointment_time,
            clinic_name: a.clinics?.name || 'Clinic',
          }))
        );
      }
    };

    fetchPendingIntakes();
  }, [patientId]);

  if (pendingIntakes.length === 0) return null;

  return (
    <div className="space-y-3 mb-8">
      {pendingIntakes.map((intake) => (
        <Card key={intake.id} className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Pre-Visit Intake Required
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {intake.clinic_name} — {intake.appointment_date} at {intake.appointment_time}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => router.push(`/appointments/${intake.id}/intake`)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Complete Intake
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default IntakeBanner;
