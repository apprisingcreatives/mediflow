'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';
import { SuperAdminSidebar } from '@/components/super-admin/SuperAdminSidebar';
import { requireSuperAdmin } from '@/lib/admin-auth';
import { supabase } from '@/lib/supabase';
import { SuperAdminContext, type SuperAdmin } from './super-admin-context';

export default function SuperAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [admin, setAdmin] = useState<SuperAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticatedAdmin = await requireSuperAdmin(router);
      if (authenticatedAdmin) {
        setAdmin(authenticatedAdmin);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('superAdmin');
    router.push('/super-admin/login');
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
    <SuperAdminContext.Provider value={{ admin }}>
      <div className='min-h-screen bg-clinic-bg dark:bg-slate-900'>
        <SuperAdminSidebar onLogout={handleLogout} />
        <main className='lg:ml-64'>
          <header className='bg-white dark:bg-slate-800 border-b border-clinic-navy/5 dark:border-white/5 px-6 py-4 sticky top-0 z-40'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='font-display text-2xl font-bold text-clinic-navy dark:text-white'>
                  Super Admin
                </h1>
                <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                  Welcome back, {admin?.name}
                </p>
              </div>
            </div>
          </header>
          <div className='p-6'>{children}</div>
        </main>
      </div>
    </SuperAdminContext.Provider>
  );
}
