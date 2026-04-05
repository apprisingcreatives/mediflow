'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import {
  useCreateAppointment,
  useGetPractitioners,
  useGetServices,
} from '@/hooks';
import useGetTimeSlots from '@/hooks/useGetTimeSlots';
import {
  BookingFormData,
  INITIAL_FORM_DATA,
} from '../components/appointments/patientBooking/types';

function useBookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, patient, isLoading: authLoading } = useAuth();
  // URL parameters
  const clinicId = searchParams.get('clinic');
  const clinicName = searchParams.get('clinicName');
  const preSelectedServiceId = searchParams.get('service');
  const preSelectedPractitionerId = searchParams.get('practitioner');

  // Hooks for data fetching
  const {
    fetchPractitioners,
    practitioners,
    loading: isLoadingPractitioners,
  } = useGetPractitioners();

  const {
    services,
    fetchServices,
    loading: isLoadingServices,
  } = useGetServices();

  const { getAvailableTimeSlots } = useCreateAppointment();

  // Form state
  const [formData, setFormData] = useState<BookingFormData>({
    ...INITIAL_FORM_DATA,
    selectedPractitionerId: preSelectedPractitionerId || '',
    selectedServiceId: preSelectedServiceId || '',
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Memoized selected entities
  const selectedService = useMemo(
    () => services.find((s) => s.id === formData.selectedServiceId),
    [services, formData.selectedServiceId],
  );

  const selectedPractitioner = useMemo(
    () => practitioners.find((p) => p.id === formData.selectedPractitionerId),
    [practitioners, formData.selectedPractitionerId],
  );

  // Time slots hook
  const { timeSlots: availableTimeSlots, loading: isLoadingTimeSlots } =
    useGetTimeSlots({
      practitionerId: formData.selectedPractitionerId,
      date: formData.date ? new Date(formData.date) : undefined,
      service: selectedService,
      selectedTime: formData.time,
      mode: 'create',
      appointmentId: undefined,
      getAvailableTimeSlots,
      onSelectedTimeUnavailable: () =>
        setFormData((prev) => ({ ...prev, time: '' })),
    });

  // Fetch practitioners and services when clinicId is available
  useEffect(() => {
    if (clinicId) {
      fetchPractitioners({
        clinicId,
        activeOnly: true,
        includeWorkingHours: true,
      });
      fetchServices({ clinicId });
    }
  }, [clinicId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill form with patient data
  useEffect(() => {
    if (patient) {
      setFormData((prev) => ({
        ...prev,
        firstName: patient.first_name || prev.firstName,
        lastName: patient.last_name || prev.lastName,
        email: patient.email || prev.email,
        phone: patient.phone || prev.phone,
        dateOfBirth: patient.date_of_birth || prev.dateOfBirth,
        gender: patient.gender || prev.gender,
        address: patient.address || prev.address,
        city: patient.city || prev.city,
        emergencyContactName:
          patient.emergency_contact_name || prev.emergencyContactName,
        emergencyContactPhone:
          patient.emergency_contact_phone || prev.emergencyContactPhone,
        bloodType: patient.blood_type || prev.bloodType,
        medications: patient.current_medications || prev.medications,
        allergies: (patient.allergies || []).join(', ') || prev.allergies,
        conditions: patient.chronic_conditions || prev.conditions,
        medicalNotes: patient.medical_notes || prev.medicalNotes,
        insuranceProvider: patient.insurance_provider || prev.insuranceProvider,
        insurancePolicyNumber:
          patient.insurance_policy_number || prev.insurancePolicyNumber,
      }));
    }
  }, [patient]);

  // Set pre-selected values from URL params
  useEffect(() => {
    if (preSelectedPractitionerId) {
      setFormData((prev) => ({
        ...prev,
        selectedPractitionerId: preSelectedPractitionerId,
      }));
    }
    if (preSelectedServiceId) {
      setFormData((prev) => ({
        ...prev,
        selectedServiceId: preSelectedServiceId,
      }));
    }
  }, [preSelectedPractitionerId, preSelectedServiceId]);

  // Form update handler
  const updateFormData = useCallback((updates: Partial<BookingFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetFormData = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
  }, []);

  // Auth check for booking
  const checkAuthAndOnboarding = useCallback(() => {
    if (!user) {
      const currentUrl = window.location.href;
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return false;
    }

    if (patient && !patient.onboarding_completed) {
      const currentUrl = window.location.href;
      router.push(
        `/patient/onboarding?redirect=${encodeURIComponent(currentUrl)}`,
      );
      return false;
    }

    return true;
  }, [user, patient, router]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentStep === 1 && !checkAuthAndOnboarding()) {
      return;
    }

    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, checkAuthAndOnboarding]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Form validation
  const validateForm = useCallback((): string | null => {
    if (!user) {
      return 'Please log in to complete your booking.';
    }
    if (!formData.selectedPractitionerId) {
      return 'Please select a practitioner.';
    }
    if (!formData.selectedServiceId) {
      return 'Please select a service.';
    }
    if (!formData.date || !formData.time) {
      return 'Please select both a date and time for your appointment.';
    }
    return null;
  }, [user, patient, formData]);

  // Submit booking
  const submitBooking = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          clinic_id: clinicId,
          practitioner_id: formData.selectedPractitionerId,
          service_id: formData.selectedServiceId,
          appointment_date: formData.date,
          appointment_time: formData.time,
          notes: formData.symptoms || null,
          patient_info: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            date_of_birth: formData.dateOfBirth || null,
            gender: formData.gender || null,
            address: formData.address || null,
            city: formData.city || null,
            emergency_contact_name: formData.emergencyContactName || null,
            emergency_contact_phone: formData.emergencyContactPhone || null,
            blood_type: formData.bloodType || null,
            current_medications: formData.medications || null,
            allergies: formData.allergies
              ? formData.allergies
                  .split(',')
                  .map((a) => a.trim())
                  .filter(Boolean)
              : null,
            chronic_conditions:
              formData.conditions.length > 0 ? formData.conditions : null,
            medical_notes: formData.medicalNotes || null,
            insurance_provider: formData.insuranceProvider || null,
            insurance_policy_number: formData.insurancePolicyNumber || null,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create appointment');
      }

      setCurrentStep(4);
    } catch (err) {
      console.error('Booking error:', err);
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Failed to complete booking. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [clinicId, formData, validateForm]);

  // Progress calculation
  const progress = useMemo(() => (currentStep / 4) * 100, [currentStep]);

  return {
    // Form data
    formData,
    updateFormData,
    resetFormData,

    // Step management
    currentStep,
    setCurrentStep,
    handleNext,
    handleBack,
    progress,

    // Data
    practitioners,
    services,
    availableTimeSlots,
    selectedPractitioner,
    selectedService,

    // Loading states
    authLoading,
    isLoadingPractitioners,
    isLoadingServices,
    isLoadingTimeSlots,
    isSubmitting,

    // Errors
    submitError,
    setSubmitError,

    // Actions
    submitBooking,

    // Auth
    user,
    patient,

    // Clinic info
    clinicId,
    clinicName,
    preSelectedServiceId,
    preSelectedPractitionerId,
  };
}

export default useBookingForm;
