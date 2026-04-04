'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { parseISO, isBefore, startOfDay } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import useGetAppointments from '@/hooks/useGetAppointments';
import usePatientClinics from '@/hooks/usePatientClinics';
import usePatientBooking from '@/hooks/usePatientBooking';
import {
  PatientHeader,
  QuickActions,
  UpcomingAppointments,
  HealthSummary,
  PatientClinicsCard,
  MessagesCard,
  ContactCard,
  OnboardingBanner,
  BookingModal,
  PatientInfo,
  RecentVisitsCard,
} from '@/components/patient/dashboard';

export default function PatientPortal() {
  const router = useRouter();
  const { user, patient, isLoading, signOut } = useAuth();

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
      fetchPatientClinics(patient.id);
    }

    return () => {
      unsubscribeAppointments();
    };
  }, [patient?.id, fetchAppointments, fetchPatientClinics, unsubscribeAppointments]);

  // Filter appointments
  const { upcomingAppointments } = useMemo(() => {
    const today = startOfDay(new Date());
    const upcoming = appointments.filter(
      (apt) =>
        !['cancelled', 'completed', 'no-show'].includes(apt.status) &&
        !isBefore(parseISO(apt.appointment_date), today)
    );
    const past = appointments.filter(
      (apt) =>
        ['completed', 'no-show'].includes(apt.status) ||
        isBefore(parseISO(apt.appointment_date), today)
    );
    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [appointments]);

  // Handlers
  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleBookAppointment = async () => {
    if (!patient?.id) return;

    const success = await booking.bookAppointment(patient.id);
    if (success) {
      booking.closeModal();
      await fetchAppointments({ patientId: patient.id });
    }
  };

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

  // Cast patient to PatientInfo type
  const patientInfo = patient as PatientInfo | null;
  const canBookAppointment = patientClinics.length > 0;

  return (
    <div className="min-h-screen bg-clinic-bg dark:bg-slate-900">
      <PatientHeader patient={patientInfo} onSignOut={handleSignOut} />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-clinic-navy dark:text-white mb-2">
            Welcome back, {patient?.first_name || 'Patient'}
          </h1>
          <p className="text-clinic-text/60 dark:text-white/60">
            Here's an overview of your health and upcoming appointments
          </p>
        </div>

        {/* Onboarding Banner */}
        {patientInfo && <OnboardingBanner patient={patientInfo} />}

        {/* Quick Actions */}
        <QuickActions
          onBookAppointment={booking.openModal}
          canBookAppointment={canBookAppointment}
        />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <UpcomingAppointments
              appointments={upcomingAppointments}
              loading={appointmentsLoading}
              onBookAppointment={booking.openModal}
              canBookAppointment={canBookAppointment}
            />
            <RecentVisitsCard
              appointments={appointments}
              loading={appointmentsLoading}
            />
            <HealthSummary patient={patientInfo} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <PatientClinicsCard clinics={patientClinics} loading={clinicsLoading} />
            <MessagesCard />
            <ContactCard />
          </div>
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
