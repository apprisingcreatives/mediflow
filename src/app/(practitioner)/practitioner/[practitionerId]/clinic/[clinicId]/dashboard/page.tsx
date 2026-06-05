'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { usePractitionerDashboard } from '@/hooks';
import { usePractitionerContext } from '../layout';
import { PractitionerStats, PractitionerAppointments } from '@/components/clinic/practitioners';
import useClinicAnalytics from '@/hooks/useClinicAnalytics';
import { Activity, BarChart3, DollarSign, UserX, Repeat, Loader2 } from 'lucide-react';

export default function PractitionerDashboardPage() {
  const params = useParams();
  const practitionerId = params.practitionerId as string;
  const clinicId = params.clinicId as string;

  const { profile } = usePractitionerContext();
  const {
    appointments,
    appointmentsLoading,
    fetchAppointments,
    updateAppointmentStatus,
    updateAppointmentNotes,
    unsubscribe,
  } = usePractitionerDashboard({ enableRealtime: true });

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { analytics, loading: analyticsLoading, fetchAnalytics } = useClinicAnalytics(clinicId);

  // Fetch appointments for current month
  useEffect(() => {
    if (practitionerId && clinicId) {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      fetchAppointments({
        practitionerId,
        clinicId,
        startDate: format(monthStart, 'yyyy-MM-dd'),
        endDate: format(monthEnd, 'yyyy-MM-dd'),
      });
    }
  }, [practitionerId, clinicId, currentMonth, fetchAppointments]);

  // Fetch analytics
  useEffect(() => {
    if (clinicId) fetchAnalytics('30d');
  }, [clinicId, fetchAnalytics]);

  // Cleanup realtime on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  const handleMonthChange = useCallback((date: Date) => {
    setCurrentMonth(date);
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-clinic-navy dark:text-white">
          Welcome back, {profile?.name?.split(' ')[0] || 'Doctor'}!
        </h1>
        <p className="text-clinic-text/60 dark:text-white/60 mt-1">
          Here&apos;s an overview of your schedule for today
        </p>
      </div>

      {/* Stats */}
      <PractitionerStats appointments={appointments} />

      {/* Personal Performance Metrics */}
      {(() => {
        const myMetrics = analytics?.practitioner_metrics?.[0];
        if (analyticsLoading) {
          return (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-clinic-teal" />
            </div>
          );
        }
        if (!myMetrics) return null;

        const formatCurrency = (amount: number) =>
          new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(amount);

        const utilColor = myMetrics.utilization_rate >= 80 ? 'text-green-500' :
          myMetrics.utilization_rate >= 50 ? 'text-amber-500' : 'text-red-500';
        const utilBg = myMetrics.utilization_rate >= 80 ? 'bg-green-500/10' :
          myMetrics.utilization_rate >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10';

        return (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-clinic-teal" />
              <h2 className="font-display text-lg font-bold text-clinic-navy dark:text-white">
                Your Performance (Last 30 Days)
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${utilBg} flex items-center justify-center`}>
                    <BarChart3 className={`w-5 h-5 ${utilColor}`} />
                  </div>
                  <div>
                    <p className="text-xs text-clinic-text/60 dark:text-white/60">Utilization</p>
                    <p className={`text-lg font-bold ${utilColor}`}>{myMetrics.utilization_rate}%</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-clinic-text/60 dark:text-white/60">Revenue</p>
                    <p className="text-lg font-bold text-clinic-navy dark:text-white">{formatCurrency(myMetrics.revenue)}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <UserX className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-clinic-text/60 dark:text-white/60">Cancellation Rate</p>
                    <p className={`text-lg font-bold ${myMetrics.cancellation_rate > 20 ? 'text-red-500' : 'text-clinic-navy dark:text-white'}`}>
                      {myMetrics.cancellation_rate}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Repeat className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-clinic-text/60 dark:text-white/60">Completed</p>
                    <p className="text-lg font-bold text-clinic-navy dark:text-white">{myMetrics.completed_count}</p>
                    <p className="text-xs text-clinic-text/40 dark:text-white/40">of {myMetrics.appointment_count} total</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Appointments */}
      <PractitionerAppointments
        appointments={appointments}
        isLoading={appointmentsLoading}
        onStatusChange={updateAppointmentStatus}
        onNotesChange={updateAppointmentNotes}
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
      />
    </div>
  );
}
