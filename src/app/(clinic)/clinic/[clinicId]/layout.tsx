'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Activity } from 'lucide-react';
import BillingBanner from '@/components/clinic/BillingBanner';
import NotificationBell from '@/components/notifications/NotificationBell';
import { ClinicSidebar } from '@/components/clinic/ClinicSidebar';
import { requireClinicAdmin, clinicAdminSignOut } from '@/lib/admin-auth';
import { useGetClinicFeatures, useGetClinic } from '@/hooks';
import { supabase } from '@/lib/supabase';
import { ClinicContext, type Clinic, type ClinicAdmin } from './clinic-context';
import type { StaffRole, Branch } from '@/types/database';
import type { PermissionKey } from '@/lib/permissions';

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
  const [staffRole, setStaffRole] = useState<StaffRole | null>(null);
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);

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

        // Fetch staff role and permissions from /me endpoint
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const { data: meData } = await axios.get(
              `/api/clinic/${authenticatedAdmin.clinic_id}/me`,
              { headers: { Authorization: `Bearer ${session.access_token}` } },
            );
            if (meData) {
              setStaffRole(meData.staff_role);
              setPermissions(meData.permissions ?? []);
              setAdmin((prev) => prev ? { ...prev, staff_role: meData.staff_role } : prev);
            }
          }
        } catch {
          setStaffRole('owner');
        }

        // Fetch branches for professional+ clinics
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const { data: branchData } = await axios.get(
              `/api/clinic/${authenticatedAdmin.clinic_id}/branches`,
              { headers: { Authorization: `Bearer ${session.access_token}` } },
            );
            if (branchData?.branches) {
              setBranches(branchData.branches);
            }
          }
        } catch {
          // Non-professional+ clinics or branches not yet migrated — ignore
        }
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

  const hasPermission = useCallback(
    (key: PermissionKey) => permissions.includes(key),
    [permissions],
  );

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
        staffRole,
        permissions,
        hasPermission,
        branches,
        activeBranchId,
        setActiveBranchId,
        isReadOnly: clinic?.payment_status === 'expired',
        paymentStatus: clinic?.payment_status ?? 'trial',
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
                <NotificationBell />
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
            <BillingBanner />

            {/* Page Content */}
            {children}
          </div>
        </main>
      </div>
    </ClinicContext.Provider>
  );
}
