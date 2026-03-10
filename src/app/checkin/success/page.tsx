'use client';

import { useSearchParams } from 'next/navigation';
import { CheckCircle, Calendar, User, Building2, Stethoscope } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Suspense } from 'react';

function CheckinSuccessContent() {
  const searchParams = useSearchParams();

  const appointmentId = searchParams.get('appointmentId');
  const clinicName = searchParams.get('clinicName');
  const practitionerName = searchParams.get('practitionerName');
  const serviceName = searchParams.get('serviceName');
  const patientName = searchParams.get('patientName');

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinic-bg to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-display text-clinic-navy dark:text-white">
            Check-in Successful!
          </CardTitle>
          <p className="text-clinic-text/60 dark:text-white/60 mt-2">
            You have been checked in for your appointment
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {patientName && (
            <div className="flex items-center gap-3 p-3 bg-clinic-bg/50 dark:bg-slate-700/50 rounded-lg">
              <User className="w-5 h-5 text-clinic-teal" />
              <div>
                <p className="text-xs text-clinic-text/60 dark:text-white/60">Patient</p>
                <p className="font-medium text-clinic-navy dark:text-white">{patientName}</p>
              </div>
            </div>
          )}

          {clinicName && (
            <div className="flex items-center gap-3 p-3 bg-clinic-bg/50 dark:bg-slate-700/50 rounded-lg">
              <Building2 className="w-5 h-5 text-clinic-teal" />
              <div>
                <p className="text-xs text-clinic-text/60 dark:text-white/60">Clinic</p>
                <p className="font-medium text-clinic-navy dark:text-white">{clinicName}</p>
              </div>
            </div>
          )}

          {practitionerName && (
            <div className="flex items-center gap-3 p-3 bg-clinic-bg/50 dark:bg-slate-700/50 rounded-lg">
              <Stethoscope className="w-5 h-5 text-clinic-teal" />
              <div>
                <p className="text-xs text-clinic-text/60 dark:text-white/60">Practitioner</p>
                <p className="font-medium text-clinic-navy dark:text-white">{practitionerName}</p>
              </div>
            </div>
          )}

          {serviceName && (
            <div className="flex items-center gap-3 p-3 bg-clinic-bg/50 dark:bg-slate-700/50 rounded-lg">
              <Calendar className="w-5 h-5 text-clinic-teal" />
              <div>
                <p className="text-xs text-clinic-text/60 dark:text-white/60">Service</p>
                <p className="font-medium text-clinic-navy dark:text-white">{serviceName}</p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-center text-clinic-text/60 dark:text-white/60 mb-4">
              Please wait in the waiting area. You will be called when the practitioner is ready.
            </p>
            <Link href="/patient" className="block">
              <Button className="w-full bg-clinic-teal hover:bg-clinic-teal/90">
                Go to Patient Portal
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckinSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-clinic-bg to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
          <div className="animate-pulse text-clinic-teal">Loading...</div>
        </div>
      }
    >
      <CheckinSuccessContent />
    </Suspense>
  );
}
