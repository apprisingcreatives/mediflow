'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { parseISO, isBefore, startOfDay } from 'date-fns';
import { Loader2, Calendar, CheckCircle, AlertCircle, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import useGetAppointments from '@/hooks/useGetAppointments';
import useActivityLogs from '@/hooks/useActivityLogs';
import {
  UpcomingAppointments,
  HealthSummary,
  OnboardingBanner,
  PatientInfo,
} from '@/components/patient/dashboard';
import { ActivityTimeline } from '@/components/activity/ActivityTimeline';
import { Button } from '@/components/ui/button';

export default function PatientDashboard() {
  const router = useRouter();
  const { user, patient, isLoading } = useAuth();

  const {
    appointments,
    loading: appointmentsLoading,
    fetchAppointments,
    unsubscribe: unsubscribeAppointments,
  } = useGetAppointments({ enableRealtime: true });

  const { logs, loading: logsLoading, fetchLogs } = useActivityLogs();

  // Auth redirect effect
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login?redirect=/patient');
      } else if (patient?.clinic_id) {
        router.push(`/clinic/${patient.clinic_id}/patient`);
      }
    }
  }, [user, patient, isLoading, router]);

  // Fetch data effect
  useEffect(() => {
    if (patient?.id) {
      fetchAppointments({ patientId: patient.id });
      fetchLogs({ patientId: patient.id });
    }

    return () => {
      unsubscribeAppointments();
    };
  }, [patient?.id, fetchAppointments, fetchLogs, unsubscribeAppointments]);

  const { upcomingAppointments, completedCount } = useMemo(() => {
    const today = startOfDay(new Date());
    const upcoming = appointments.filter(
      (apt) =>
        !['cancelled', 'completed', 'no-show'].includes(apt.status) &&
        !isBefore(parseISO(apt.appointment_date), today),
    );
    const completed = appointments.filter(
      (a) => a.status === 'completed',
    ).length;
    return { upcomingAppointments: upcoming, completedCount: completed };
  }, [appointments]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-clinic-teal" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const patientInfo = patient as PatientInfo | null;

  const conditionsCount =
    patient?.chronic_conditions?.filter((c: string) => c !== 'None')?.length ??
    0;

  const statsCards = [
    {
      label: 'Upcoming',
      value: upcomingAppointments.length,
      icon: Calendar,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Conditions',
      value: conditionsCount,
      icon: AlertCircle,
      color:
        conditionsCount > 0
          ? 'text-amber-600 bg-amber-100 dark:bg-amber-900/30'
          : 'text-green-600 bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Profile',
      value: patient?.onboarding_completed ? 'Complete' : 'Incomplete',
      icon: UserCheck,
      color: patient?.onboarding_completed
        ? 'text-green-600 bg-green-100 dark:bg-green-900/30'
        : 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Onboarding Banner */}
      {patientInfo && !patientInfo.onboarding_completed && (
        <OnboardingBanner patient={patientInfo} />
      )}

      {/* Welcome */}
      <div>
        <h1 className="font-display text-2xl font-bold text-clinic-navy dark:text-white">
          Welcome back, {patient?.first_name || 'Patient'}
        </h1>
        <p className="text-clinic-text/60 dark:text-white/60">
          Here&apos;s your health overview
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-4"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  stat.color,
                )}
              >
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-clinic-text/60 dark:text-white/60">
                  {stat.label}
                </p>
                <p className="text-lg font-bold text-clinic-navy dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Appointments -- component renders its own Card wrapper */}
      <UpcomingAppointments
        appointments={upcomingAppointments}
        loading={appointmentsLoading}
        onBookAppointment={() => {}}
        canBookAppointment={false}
        maxDisplay={3}
      />

      {/* Recent Activity */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-clinic-navy dark:text-white">
            Recent Activity
          </h2>
          <Link href="/patient/history">
            <Button variant="ghost" size="sm" className="text-clinic-teal">
              View All
            </Button>
          </Link>
        </div>
        {logsLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-clinic-teal" />
          </div>
        ) : logs.length > 0 ? (
          <ActivityTimeline
            logs={logs.slice(0, 10)}
            perspective="patient"
          />
        ) : (
          <p className="text-sm text-clinic-text/60 dark:text-white/60 text-center py-8">
            No recent activity
          </p>
        )}
      </div>

      {/* Health Summary -- component renders its own Card wrapper */}
      <HealthSummary patient={patientInfo} />
    </div>
  );
}
