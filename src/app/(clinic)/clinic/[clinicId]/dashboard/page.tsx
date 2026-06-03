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
  UserX,
  DollarSign,
  Clock,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useClinicContext } from '../layout';
import { useGetAppointments } from '@/hooks';
import useClinicAnalytics from '@/hooks/useClinicAnalytics';
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

  const {
    analytics,
    loading: analyticsLoading,
    fetchAnalytics,
  } = useClinicAnalytics(clinic?.id || '');

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

  useEffect(() => {
    if (clinic?.id) fetchAnalytics('30d');
  }, [clinic?.id, fetchAnalytics]);

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

      {/* Revenue Protection Analytics */}
      {!isTrialExpired && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-clinic-teal" />
            <h2 className="font-display text-lg font-bold text-clinic-navy dark:text-white">
              Revenue Protection (Last 30 Days)
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: 'No-Show Rate',
                value: analyticsLoading ? null : `${analytics?.no_show_rate ?? 0}%`,
                subtitle: `${analytics?.no_show_count ?? 0} of ${analytics?.total_appointments ?? 0}`,
                icon: UserX,
                iconBg: 'bg-red-500/10',
                iconColor: 'text-red-500',
              },
              {
                label: 'Revenue Lost',
                value: analyticsLoading ? null : formatCurrency(analytics?.revenue_lost ?? 0),
                subtitle: 'From no-shows',
                icon: DollarSign,
                iconBg: 'bg-orange-500/10',
                iconColor: 'text-orange-500',
              },
              {
                label: 'Confirmation Rate',
                value: analyticsLoading ? null : `${analytics?.confirmation_rate ?? 0}%`,
                subtitle: 'Confirmed or completed',
                icon: CheckCircle,
                iconBg: 'bg-green-500/10',
                iconColor: 'text-green-500',
              },
              {
                label: 'Peak Hour',
                value: analyticsLoading
                  ? null
                  : analytics?.peak_hours && analytics.peak_hours.length > 0
                    ? `${analytics.peak_hours.reduce((a, b) => (b.count > a.count ? b : a)).hour}:00`
                    : 'N/A',
                subtitle: 'Busiest time',
                icon: Clock,
                iconBg: 'bg-blue-500/10',
                iconColor: 'text-blue-500',
              },
            ].map((stat) => (
              <div key={stat.label} className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center shrink-0`}>
                    <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-clinic-text/60 dark:text-white/60">{stat.label}</p>
                    <p className="text-lg font-bold text-clinic-navy dark:text-white">
                      {stat.value === null ? <Loader2 className="w-4 h-4 animate-spin" /> : stat.value}
                    </p>
                    <p className="text-xs text-clinic-text/40 dark:text-white/40">{stat.subtitle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {analytics && !analyticsLoading && (
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Peak Hours Chart */}
              {analytics.peak_hours.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-4">
                  <h3 className="text-sm font-medium text-clinic-text/60 dark:text-white/60 mb-3">
                    Appointments by Hour
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={analytics.peak_hours}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis
                        dataKey="hour"
                        tickFormatter={(h) => `${h}:00`}
                        fontSize={11}
                        tick={{ fill: '#64748b' }}
                      />
                      <YAxis fontSize={11} tick={{ fill: '#64748b' }} />
                      <Tooltip
                        labelFormatter={(h) => `${h}:00`}
                        formatter={(v: number) => [v, 'Appointments']}
                      />
                      <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* No-Show Trend */}
              {analytics.trends.dates.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-4">
                  <h3 className="text-sm font-medium text-clinic-text/60 dark:text-white/60 mb-3">
                    No-Show Rate Trend
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart
                      data={analytics.trends.dates.map((date, i) => ({
                        date: date.slice(5),
                        rate: analytics.trends.no_show_rates[i],
                        count: analytics.trends.appointment_counts[i],
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="date" fontSize={11} tick={{ fill: '#64748b' }} />
                      <YAxis
                        fontSize={11}
                        tick={{ fill: '#64748b' }}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip formatter={(v: number, name: string) => [
                        name === 'rate' ? `${v}%` : v,
                        name === 'rate' ? 'No-Show Rate' : 'Appointments'
                      ]} />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
