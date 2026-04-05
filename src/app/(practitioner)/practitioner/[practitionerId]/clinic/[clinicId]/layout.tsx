'use client';

import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { usePractitionerDashboard, PractitionerProfile } from '@/hooks';
import { PractitionerSidebar } from '@/components/clinic/practitioners';

interface PractitionerContextType {
  profile: PractitionerProfile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const PractitionerContext = createContext<PractitionerContextType>({
  profile: null,
  isLoading: true,
  refreshProfile: async () => {},
});

export const usePractitionerContext = () => useContext(PractitionerContext);

export default function PractitionerClinicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const practitionerId = params.practitionerId as string;
  const clinicId = params.clinicId as string;

  const { session, isLoading: authLoading } = useAuth();
  const { profile, profileLoading, fetchProfile } = usePractitionerDashboard();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const refreshProfile = useCallback(async () => {
    await fetchProfile(clinicId);
  }, [fetchProfile, clinicId]);

  // Fetch profile and verify authorization
  useEffect(() => {
    const verifyAccess = async () => {
      if (authLoading) return;

      if (!session) {
        router.push('/login');
        return;
      }

      const practitionerProfile = await fetchProfile(clinicId);

      if (!practitionerProfile) {
        // User doesn't have access to this practitioner/clinic
        setIsAuthorized(false);
        return;
      }

      // Verify the practitioner ID matches
      if (practitionerProfile.id !== practitionerId) {
        setIsAuthorized(false);
        return;
      }

      setIsAuthorized(true);
      setInitialLoadDone(true);
    };

    verifyAccess();
  }, [session, authLoading, clinicId, practitionerId, fetchProfile, router]);

  // Loading state
  if (authLoading || (!initialLoadDone && profileLoading) || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-clinic-bg dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-clinic-teal mx-auto mb-4" />
          <p className="text-clinic-text/60 dark:text-white/60">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Unauthorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-clinic-bg dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold text-clinic-navy dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-clinic-text/60 dark:text-white/60 mb-6">
            You don&apos;t have permission to access this practitioner dashboard.
            Please ensure you are logged in with the correct account.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-clinic-teal text-white rounded-lg hover:bg-clinic-teal/90 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <PractitionerContext.Provider value={{ profile, isLoading: profileLoading, refreshProfile }}>
      <div className="min-h-screen bg-clinic-bg dark:bg-slate-900 flex">
        {/* Sidebar */}
        <PractitionerSidebar
          practitionerId={practitionerId}
          clinicId={clinicId}
          practitionerName={profile?.name || 'Practitioner'}
          practitionerImage={profile?.image_url}
          clinicName={profile?.clinic?.name}
          specialization={profile?.specialization}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </PractitionerContext.Provider>
  );
}
