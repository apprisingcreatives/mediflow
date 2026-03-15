'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { usePractitionerDashboard } from '@/hooks';
import { usePractitionerContext } from '../layout';
import { PractitionerStats, PractitionerAppointments } from '@/components/clinic/practitioners';

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
