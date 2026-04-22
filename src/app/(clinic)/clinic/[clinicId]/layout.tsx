'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Clock,
  AlertTriangle,
  CreditCard,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { ClinicSidebar } from '@/components/clinic/ClinicSidebar';
import { requireClinicAdmin, clinicAdminSignOut } from '@/lib/admin-auth';
import { useGetClinicFeatures, useGetClinic } from '@/hooks';

interface Clinic {
  id: string;
  name: string;
  email: string;
  subscription_plan: string;
  trial_start_date?: string;
  trial_end_date?: string;
  is_trial_active?: boolean;
  is_subscription_active?: boolean;
  payment_status?: string;
  slug?: string;
  email_notifications_enabled: boolean;
  appointment_reminders_enabled: boolean;
  intake_required?: boolean;
}

interface ClinicAdmin {
  id: string;
  email: string;
  name: string;
  clinic_id: string;
  is_active: boolean;
}

// Context to share clinic data with child pages
interface ClinicContextType {
  clinic: Clinic | null;
  admin: ClinicAdmin | null;
  clinicFeatures: any[];
  featuresLoading: boolean;
  isTrialExpired: boolean;
  trialDaysRemaining: number | null;
}

const ClinicContext = createContext<ClinicContextType>({
  clinic: null,
  admin: null,
  clinicFeatures: [],
  featuresLoading: false,
  isTrialExpired: false,
  trialDaysRemaining: null,
});

export const useClinicContext = () => useContext(ClinicContext);

export default function ClinicDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [admin, setAdmin] = useState<ClinicAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(
    null,
  );
  const [isTrialExpired, setIsTrialExpired] = useState(false);

  const { clinic, loading: clinicLoading, fetchClinic } = useGetClinic();
  const {
    clinicFeatures,
    loading: featuresLoading,
    fetchClinicFeatures,
  } = useGetClinicFeatures();

  useEffect(() => {
    const checkAuth = async () => {
      const authenticatedAdmin = await requireClinicAdmin(router);

      if (authenticatedAdmin) {
        setAdmin(authenticatedAdmin);

        const clinicData = await fetchClinic(authenticatedAdmin.clinic_id);
        if (clinicData) {
          calculateTrialStatus(clinicData);
        }

        await fetchClinicFeatures({ clinicId: authenticatedAdmin.clinic_id });
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  const calculateTrialStatus = (clinicData: Clinic) => {
    if (clinicData.trial_end_date) {
      const trialEnd = new Date(clinicData.trial_end_date);
      const today = new Date();
      const diffTime = trialEnd.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setTrialDaysRemaining(diffDays);

      if (diffDays <= 0 && clinicData.payment_status === 'trial') {
        setIsTrialExpired(true);
      }
    }
  };

  const handleLogout = async () => {
    await clinicAdminSignOut(router);
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-clinic-bg flex items-center justify-center'>
        <div className='text-center'>
          <Activity className='w-12 h-12 text-clinic-teal animate-spin mx-auto mb-4' />
          <p className='text-clinic-text/60'>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ClinicContext.Provider
      value={{
        clinic,
        admin,
        clinicFeatures,
        featuresLoading,
        isTrialExpired,
        trialDaysRemaining,
      }}
    >
      <div className='min-h-screen bg-clinic-bg dark:bg-slate-900'>
        {/* Persistent Sidebar */}
        <ClinicSidebar
          clinicId={clinic?.id || ''}
          isTrialExpired={isTrialExpired}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <main className='lg:ml-64'>
          {/* Header */}
          <header className='bg-white dark:bg-slate-800 border-b border-clinic-navy/5 dark:border-white/5 px-6 py-4 sticky top-0 z-40'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='font-display text-2xl font-bold text-clinic-navy dark:text-white'>
                  {clinic?.name || 'Clinic Dashboard'}
                </h1>
                <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                  Welcome back, {admin?.name}
                </p>
              </div>
              <div className='flex items-center gap-4'>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    clinic?.subscription_plan === 'professional'
                      ? 'bg-clinic-ai/10 text-clinic-ai'
                      : clinic?.subscription_plan === 'enterprise'
                        ? 'bg-yellow-500/10 text-yellow-600'
                        : 'bg-clinic-navy/10 text-clinic-navy dark:bg-white/10 dark:text-white'
                  }`}
                >
                  {clinic?.subscription_plan || 'starter'} plan
                </span>
              </div>
            </div>
          </header>

          <div className='p-6'>
            {/* Trial/Subscription Banner */}
            {clinic?.payment_status === 'trial' &&
              trialDaysRemaining !== null && (
                <div
                  className={`mb-6 p-4 rounded-2xl ${
                    isTrialExpired
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      : trialDaysRemaining <= 3
                        ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                        : 'bg-clinic-teal/5 dark:bg-clinic-teal/10 border border-clinic-teal/20'
                  }`}
                >
                  <div className='flex items-start justify-between gap-4'>
                    <div className='flex items-start gap-3'>
                      {isTrialExpired ? (
                        <AlertCircle className='w-6 h-6 text-red-500 flex-shrink-0 mt-0.5' />
                      ) : trialDaysRemaining <= 3 ? (
                        <AlertTriangle className='w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5' />
                      ) : (
                        <Clock className='w-6 h-6 text-clinic-teal flex-shrink-0 mt-0.5' />
                      )}
                      <div>
                        <h3
                          className={`font-semibold ${
                            isTrialExpired
                              ? 'text-red-700 dark:text-red-400'
                              : trialDaysRemaining <= 3
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-clinic-navy dark:text-white'
                          }`}
                        >
                          {isTrialExpired
                            ? 'Your Trial Has Expired'
                            : trialDaysRemaining <= 3
                              ? `Only ${trialDaysRemaining} day${trialDaysRemaining === 1 ? '' : 's'} left in your trial!`
                              : `${trialDaysRemaining} days remaining in your free trial`}
                        </h3>
                        <p
                          className={`text-sm mt-1 ${
                            isTrialExpired
                              ? 'text-red-600/80 dark:text-red-400/80'
                              : trialDaysRemaining <= 3
                                ? 'text-amber-600/80 dark:text-amber-400/80'
                                : 'text-clinic-text/60 dark:text-white/60'
                          }`}
                        >
                          {isTrialExpired
                            ? 'Subscribe now to restore access to all features.'
                            : 'Upgrade to a paid plan to continue using all features after your trial ends.'}
                        </p>
                        {!isTrialExpired && (
                          <div className='mt-3'>
                            <Progress
                              value={((14 - trialDaysRemaining) / 14) * 100}
                              className='h-2 w-48'
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <Link href={`/clinic/${clinic?.id}/billing`}>
                      <Button
                        className={
                          isTrialExpired
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-clinic-teal hover:bg-clinic-teal/90 text-white'
                        }
                      >
                        <CreditCard className='w-4 h-4 mr-2' />
                        {isTrialExpired ? 'Subscribe Now' : 'Upgrade Plan'}
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

            {/* Trial Expired Overlay */}
            {isTrialExpired && (
              <div className='mb-6 p-8 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-red-200 dark:border-red-800'>
                <div className='text-center'>
                  <div className='w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4'>
                    <Lock className='w-8 h-8 text-red-500' />
                  </div>
                  <h2 className='text-xl font-display font-bold text-clinic-navy dark:text-white mb-2'>
                    Features Locked
                  </h2>
                  <p className='text-clinic-text/60 dark:text-white/60 max-w-md mx-auto mb-6'>
                    Your 14-day free trial has ended. Subscribe to a plan to
                    restore access to all features including appointments,
                    patient management, and AI tools.
                  </p>
                  <Link href={`/clinic/${clinic?.id}/billing`}>
                    <Button
                      size='lg'
                      className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'
                    >
                      <CreditCard className='w-5 h-5 mr-2' />
                      View Plans & Subscribe
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Page Content */}
            {children}
          </div>
        </main>
      </div>
    </ClinicContext.Provider>
  );
}
