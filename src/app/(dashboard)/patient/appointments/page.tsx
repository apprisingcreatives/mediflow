'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { parseISO, isBefore, startOfDay } from 'date-fns';
import { Calendar, Loader2, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import useGetAppointments from '@/hooks/useGetAppointments';
import usePatientClinics from '@/hooks/usePatientClinics';
import usePatientBooking from '@/hooks/usePatientBooking';
import { Button } from '@/components/ui/button';
import {
  UpcomingAppointments,
  BookingModal,
  RecentVisitsCard,
} from '@/components/patient/dashboard';

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const { user, patient, isLoading } = useAuth();

  // Appointments hook with realtime
  const {
    appointments,
    loading: appointmentsLoading,
    fetchAppointments,
    unsubscribe: unsubscribeAppointments,
  } = useGetAppointments({ enableRealtime: true });

  // Patient clinics hook
  const {
    clinics: patientClinics,
    loading: clinicsLoading,
    fetchClinics: fetchPatientClinics,
  } = usePatientClinics();

  // Booking hook
  const booking = usePatientBooking();

  // Auth redirect effect
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/patient/appointments');
    }
  }, [user, isLoading, router]);

  // Fetch data effect
  useEffect(() => {
    if (patient?.id) {
      fetchAppointments({ patientId: patient.id });
      fetchPatientClinics(patient.id);
    }

    return () => {
      unsubscribeAppointments();
    };
  }, [patient?.id, fetchAppointments, fetchPatientClinics, unsubscribeAppointments]);

  // Filter appointments into upcoming and past
  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    const today = startOfDay(new Date());
    const upcoming = appointments.filter(
      (apt) =>
        !['cancelled', 'completed', 'no-show'].includes(apt.status) &&
        !isBefore(parseISO(apt.appointment_date), today)
    );
    const past = appointments.filter(
      (apt) =>
        ['completed', 'cancelled', 'no-show'].includes(apt.status) ||
        isBefore(parseISO(apt.appointment_date), today)
    );
    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [appointments]);

  // Handle booking submission
  const handleBookAppointment = async () => {
    if (!patient?.id) return;

    const success = await booking.bookAppointment(patient.id);
    if (success) {
      booking.closeModal();
      await fetchAppointments({ patientId: patient.id });
    }
  };

  const canBookAppointment = patientClinics.length > 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-clinic-bg dark:bg-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-2 text-clinic-navy dark:text-white">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-clinic-bg dark:bg-slate-900">
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Calendar className="w-7 h-7 text-clinic-teal" />
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-clinic-navy dark:text-white">
                Appointments
              </h1>
              <p className="text-clinic-text/60 dark:text-white/60 text-sm">
                Manage your upcoming and past appointments
              </p>
            </div>
          </div>
          <Button
            className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
            onClick={booking.openModal}
            disabled={!canBookAppointment}
          >
            <Plus className="w-4 h-4 mr-2" />
            Book Appointment
          </Button>
        </div>

        {/* Upcoming Appointments */}
        <div className="space-y-6">
          <UpcomingAppointments
            appointments={upcomingAppointments}
            loading={appointmentsLoading}
            onBookAppointment={booking.openModal}
            canBookAppointment={canBookAppointment}
          />

          {/* Past Appointments */}
          <RecentVisitsCard
            appointments={pastAppointments}
            loading={appointmentsLoading}
          />
        </div>
      </main>

      {/* Booking Modal */}
      <BookingModal
        isOpen={booking.isOpen}
        onClose={booking.closeModal}
        onSubmit={handleBookAppointment}
        clinics={patientClinics}
        selectedClinicId={booking.selectedClinicId}
        selectedPractitionerId={booking.selectedPractitionerId}
        selectedServiceId={booking.selectedServiceId}
        selectedDate={booking.selectedDate}
        selectedTime={booking.selectedTime}
        notes={booking.notes}
        onClinicChange={booking.handleClinicChange}
        onPractitionerChange={booking.setSelectedPractitionerId}
        onServiceChange={booking.setSelectedServiceId}
        onDateChange={booking.handleDateChange}
        onTimeChange={booking.setSelectedTime}
        onNotesChange={booking.setNotes}
        practitioners={booking.practitioners}
        services={booking.services}
        timeSlots={booking.timeSlots}
        loadingPractitioners={booking.loadingPractitioners}
        loadingServices={booking.loadingServices}
        loadingTimeSlots={booking.loadingTimeSlots}
        submitting={booking.submitting}
        error={booking.error}
        isFormValid={!!booking.isFormValid}
      />
    </div>
  );
}
