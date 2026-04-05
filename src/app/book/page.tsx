'use client';

import { Suspense } from 'react';
import { Progress } from '@/components/ui/progress';
import { PatientChatbot } from '@/components/chatbot/patient-chatbot';
import {
  PersonalInfoStep,
  MedicalHistoryStep,
  AppointmentStep,
  ConfirmationStep,
  ProgressStepper,
  ClinicBanner,
  LoginPrompt,
  BookingHeader,
  BookingNavigation,
  ErrorAlert,
  BOOKING_STEPS,
} from '@/components/appointments/patientBooking';
import { useBookingForm } from '@/hooks';

function BookingContent() {
  const {
    formData,
    updateFormData,
    currentStep,
    handleNext,
    handleBack,
    progress,
    practitioners,
    services,
    availableTimeSlots,
    selectedPractitioner,
    selectedService,
    authLoading,
    isLoadingPractitioners,
    isLoadingTimeSlots,
    isSubmitting,
    submitError,
    submitBooking,
    user,
    patient,
    clinicName,
  } = useBookingForm();

  // Get current URL for redirects
  const currentUrl =
    typeof window !== 'undefined' ? window.location.href : '/book';

  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInfoStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 2:
        return (
          <MedicalHistoryStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 3:
        return (
          <AppointmentStep
            formData={formData}
            updateFormData={updateFormData}
            practitioners={practitioners}
            services={services}
            availableTimeSlots={availableTimeSlots}
            selectedPractitioner={selectedPractitioner}
            selectedService={selectedService}
            isLoadingPractitioners={isLoadingPractitioners}
            isLoadingTimeSlots={isLoadingTimeSlots}
          />
        );
      case 4:
        return (
          <ConfirmationStep
            formData={formData}
            selectedPractitioner={selectedPractitioner}
            selectedService={selectedService}
          />
        );
      default:
        return null;
    }
  };
  return (
    <div className='min-h-screen bg-clinic-bg dark:bg-slate-900'>
      {/* Header */}
      <BookingHeader user={user} patient={patient} redirectUrl={currentUrl} />

      <main className='container mx-auto px-4 py-8'>
        <div className='max-w-2xl mx-auto'>
          {/* Login Prompt for Non-authenticated Users */}
          {!authLoading && !user && currentStep === 1 && (
            <LoginPrompt redirectUrl={currentUrl} />
          )}

          {/* Clinic Info Banner */}
          {clinicName && <ClinicBanner clinicName={clinicName} />}

          {/* Progress Steps - Hide on confirmation */}
          {currentStep < 4 && <ProgressStepper currentStep={currentStep} />}

          {/* Form Card */}
          <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-8'>
            {/* Step Title & Progress */}
            {currentStep < 4 && (
              <div className='mb-6'>
                <h2 className='font-display text-2xl font-bold text-clinic-navy dark:text-white mb-2'>
                  {BOOKING_STEPS[currentStep - 1].title}
                </h2>
                <Progress value={progress} className='h-1' />
              </div>
            )}

            {/* Step Content */}
            {renderStepContent()}

            {/* Error Display */}
            {submitError && <ErrorAlert message={submitError} />}

            {/* Navigation */}
            <BookingNavigation
              currentStep={currentStep}
              totalSteps={BOOKING_STEPS.length}
              isSubmitting={isSubmitting}
              onBack={handleBack}
              onNext={handleNext}
              onSubmit={submitBooking}
            />
          </div>
        </div>
      </main>

      <PatientChatbot />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-clinic-bg dark:bg-slate-900 flex items-center justify-center'>
          <div className='animate-pulse text-clinic-navy dark:text-white'>
            Loading booking form...
          </div>
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
