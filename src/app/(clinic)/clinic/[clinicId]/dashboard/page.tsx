'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Users,
  Calendar,
  Sparkles,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useClinicContext } from '../clinic-context';
import { useGetAppointments } from '@/hooks';
import { supabase } from '@/lib/supabase';
import { formatTimeToAMPM } from '@/lib/utils';

export default function ClinicDashboardPage() {
  const { clinicFeatures, featuresLoading, isTrialExpired, clinic } =
    useClinicContext();

  const {
    appointments,
    loading: apptsLoading,
    error: apptsError,
    fetchAppointments,
    unsubscribe,
  } = useGetAppointments({ enableRealtime: true });

  const [patientCount, setPatientCount] = useState<number | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number | null>(null);
  const [completedThisMonth, setCompletedThisMonth] = useState<number | null>(null);

  useEffect(() => {
    if (!clinic?.id) return;
    // Get today's date in Manila (YYYY-MM-DD)
    const manilaToday = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Manila',
    });

    fetchAppointments({
      clinicId: clinic.id,
      startDate: manilaToday,
      endDate: manilaToday,
    });

    return () => {
      unsubscribe();
    };
  }, [clinic?.id, fetchAppointments, unsubscribe]);

  // Fetch patient count and monthly revenue
  useEffect(() => {
    if (!clinic?.id) return;

    const fetchStats = async () => {
      // Patient count
      const { count } = await supabase
        .from('patient_clinics')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinic.id);
      setPatientCount(count ?? 0);

      // Monthly revenue: sum service prices for completed appointments this month
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      const { data: monthAppts } = await supabase
        .from('appointments')
        .select('id, status, service:clinic_services (price)')
        .eq('clinic_id', clinic.id)
        .gte('appointment_date', firstOfMonth)
        .lte('appointment_date', lastOfMonth)
        .eq('status', 'completed');

      const revenue = (monthAppts ?? []).reduce((sum, apt) => {
        const price = (apt.service as unknown as { price: number })?.price ?? 0;
        return sum + price;
      }, 0);
      setMonthlyRevenue(revenue);
      setCompletedThisMonth(monthAppts?.length ?? 0);
    };

    fetchStats();
  }, [clinic?.id]);

  const enabledFeatures = clinicFeatures.filter((f) => f.is_enabled);
  const disabledFeatures = clinicFeatures.filter((f) => !f.is_enabled);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(amount);

  return (
    <>
      {/* Quick Stats */}
      <div
        className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 ${isTrialExpired ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {[
          {
            label: "Today's Appointments",
            value: apptsLoading ? null : appointments.length,
            icon: Calendar,
            iconBg: 'bg-clinic-teal/10',
            iconColor: 'text-clinic-teal',
          },
          {
            label: 'Total Patients',
            value: patientCount,
            icon: Users,
            iconBg: 'bg-green-500/10',
            iconColor: 'text-green-500',
          },
          {
            label: 'This Month Revenue',
            value: monthlyRevenue === null ? null : formatCurrency(monthlyRevenue),
            icon: TrendingUp,
            iconBg: 'bg-clinic-ai/10',
            iconColor: 'text-clinic-ai',
          },
          {
            label: 'Completed This Month',
            value: completedThisMonth,
            icon: CheckCircle,
            iconBg: 'bg-yellow-500/10',
            iconColor: 'text-yellow-500',
          },
        ].map((stat) => (
          <div key={stat.label} className='p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass'>
            <div className='flex items-center gap-4'>
              <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div className='min-w-0'>
                <p className='text-sm text-clinic-text/60 dark:text-white/60 truncate'>
                  {stat.label}
                </p>
                <p className='text-2xl font-display font-bold text-clinic-navy dark:text-white'>
                  {stat.value === null ? <Loader2 className='w-5 h-5 animate-spin' /> : stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className='grid lg:grid-cols-2 gap-8'>
        {/* AI Features Status */}
        <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
          <div className='flex items-center gap-2 mb-6'>
            <Sparkles className='w-5 h-5 text-clinic-ai' />
            <h2 className='font-display text-xl font-bold text-clinic-navy dark:text-white'>
              AI Features Status
            </h2>
            <span className='ml-auto flex items-center gap-1 text-xs text-green-500'>
              <span className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></span>
              Live
            </span>
          </div>

          {featuresLoading ? (
            <div className='space-y-4'>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className='h-16 bg-clinic-navy/5 dark:bg-white/5 rounded-xl animate-pulse'
                />
              ))}
            </div>
          ) : (
            <>
              <div className='space-y-3 mb-6'>
                <h3 className='text-sm font-medium text-clinic-text/60 dark:text-white/60 flex items-center gap-2'>
                  <CheckCircle className='w-4 h-4 text-green-500' />
                  Enabled ({enabledFeatures.length})
                </h3>
                {enabledFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    className='p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl'
                  >
                    <p className='font-medium text-sm text-green-700 dark:text-green-400'>
                      {feature.feature?.name}
                    </p>
                    <p className='text-xs text-green-600/70 dark:text-green-400/70'>
                      Ready to use
                    </p>
                  </div>
                ))}
              </div>

              {disabledFeatures.length > 0 && (
                <div className='space-y-3'>
                  <h3 className='text-sm font-medium text-clinic-text/60 dark:text-white/60 flex items-center gap-2'>
                    <AlertTriangle className='w-4 h-4 text-yellow-500' />
                    Not Enabled ({disabledFeatures.length})
                  </h3>
                  {disabledFeatures.slice(0, 3).map((feature) => (
                    <div
                      key={feature.id}
                      className='p-3 bg-clinic-navy/5 dark:bg-white/5 border border-clinic-navy/10 dark:border-white/10 rounded-xl'
                    >
                      <p className='font-medium text-sm text-clinic-navy/70 dark:text-white/70'>
                        {feature.feature?.name}
                      </p>
                      <p className='text-xs text-clinic-text/50 dark:text-white/50'>
                        {feature.feature?.is_premium
                          ? 'Upgrade to enable'
                          : 'Contact support to enable'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Today's Schedule */}
        <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center gap-2'>
              <Calendar className='w-5 h-5 text-clinic-teal' />
              <h2 className='font-display text-xl font-bold text-clinic-navy dark:text-white'>
                Today's Schedule
              </h2>
            </div>
            <Button variant='outline' size='sm'>
              View All
            </Button>
          </div>

          <div className='space-y-4'>
            {apptsLoading ? (
              <div className='space-y-3'>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className='h-16 bg-clinic-navy/5 dark:bg-white/5 rounded-xl animate-pulse'
                  />
                ))}
              </div>
            ) : apptsError ? (
              <div className='text-sm text-red-600'>{apptsError}</div>
            ) : appointments.length === 0 ? (
              <div className='text-sm text-clinic-text/60'>
                No appointments scheduled.
              </div>
            ) : (
              appointments.map((apt) => (
                <div
                  key={apt.id}
                  className='flex items-center justify-between p-3 border border-clinic-navy/10 dark:border-white/10 rounded-xl'
                >
                  <div className='flex items-center gap-4'>
                    <span className='text-sm font-medium text-clinic-navy dark:text-white w-28'>
                      {formatTimeToAMPM(apt.appointment_time)}
                    </span>
                    <div>
                      <p className='font-medium text-clinic-navy dark:text-white'>
                        {apt.patient
                          ? `${apt.patient.first_name} ${apt.patient.last_name}`
                          : 'Unknown Patient'}
                      </p>
                      <p className='text-xs text-clinic-text/60 dark:text-white/60'>
                        {apt.service?.name ?? '—'}
                      </p>
                    </div>
                  </div>
                  <span className='text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600'>
                    {apt.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
