'use client';

import { createContext, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Patient } from '@/types/database';
import { PatientSidebar } from '@/components/patient/dashboard';

interface PatientContextType {
  patient: Patient | null;
  isLoading: boolean;
  refreshPatient: () => Promise<void>;
}

const PatientContext = createContext<PatientContextType>({
  patient: null,
  isLoading: true,
  refreshPatient: async () => {},
});

export const usePatientContext = () => useContext(PatientContext);

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, patient, isLoading: authLoading, refreshPatient } = useAuth();

  const isFullScreenFlow =
    pathname.startsWith('/patient/onboarding') ||
    pathname.startsWith('/patient/profile/setup');

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-clinic-bg dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-clinic-teal mx-auto mb-4" />
          <p className="text-clinic-text/60 dark:text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    router.push('/login?redirect=/patient');
    return null;
  }

  if (isFullScreenFlow) {
    return (
      <PatientContext.Provider value={{ patient, isLoading: authLoading, refreshPatient }}>
        {children}
      </PatientContext.Provider>
    );
  }

  const patientName = patient
    ? `${patient.first_name} ${patient.last_name}`
    : user.user_metadata?.first_name
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`
      : 'Patient';

  return (
    <PatientContext.Provider value={{ patient, isLoading: authLoading, refreshPatient }}>
      <div className="min-h-screen bg-clinic-bg dark:bg-slate-900 flex">
        <PatientSidebar patientName={patientName} />
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </PatientContext.Provider>
  );
}
