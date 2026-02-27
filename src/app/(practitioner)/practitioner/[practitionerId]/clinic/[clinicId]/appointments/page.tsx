'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { usePractitionerDashboard } from '@/hooks';
import { PractitionerAppointments } from '@/components/clinic/practitioners';

export default function PractitionerAppointmentsPage() {
  const params = useParams();
  const practitionerId = params.practitionerId as string;
  const clinicId = params.clinicId as string;

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
    <PractitionerAppointments
      appointments={appointments}
      isLoading={appointmentsLoading}
      onStatusChange={updateAppointmentStatus}
      onNotesChange={updateAppointmentNotes}
      currentMonth={currentMonth}
      onMonthChange={handleMonthChange}
    />
  );
}
