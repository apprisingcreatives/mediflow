'use client';

import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

export interface BookingPractitioner {
  id: string;
  name: string;
  specialization: string | null;
}

export interface BookingService {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

export interface TimeSlot {
  time_slot: string;
  is_available: boolean;
}

export interface BookingData {
  clinicId: string;
  patientId: string;
  practitionerId: string;
  serviceId: string;
  date: Date;
  time: string;
  notes?: string;
}

const usePatientBooking = () => {
  // Modal open state
  const [isOpen, setIsOpen] = useState(false);

  // Selection state
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [selectedPractitionerId, setSelectedPractitionerId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');

  // Data state
  const [practitioners, setPractitioners] = useState<BookingPractitioner[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Loading states
  const [loadingPractitioners, setLoadingPractitioners] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch practitioners for a clinic
  const fetchPractitioners = useCallback(async (clinicId: string) => {
    if (!clinicId) return;

    try {
      setLoadingPractitioners(true);
      const { data, error: queryError } = await supabase
        .from('practitioners')
        .select('id, name, specialization')
        .eq('clinic_id', clinicId)
        .eq('is_active', true);

      if (queryError) throw queryError;
      setPractitioners(data || []);
    } catch (err) {
      console.error('Failed to fetch practitioners:', err);
      setPractitioners([]);
    } finally {
      setLoadingPractitioners(false);
    }
  }, []);

  // Fetch services for a clinic
  const fetchServices = useCallback(async (clinicId: string) => {
    if (!clinicId) return;

    try {
      setLoadingServices(true);
      const { data, error: queryError } = await supabase
        .from('clinic_services')
        .select('id, name, duration_minutes, price')
        .eq('clinic_id', clinicId)
        .eq('is_active', true);

      if (queryError) throw queryError;
      setServices(data || []);
    } catch (err) {
      console.error('Failed to fetch services:', err);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  }, []);

  // Fetch time slots
  const fetchTimeSlots = useCallback(async () => {
    if (!selectedPractitionerId || !selectedDate || !selectedServiceId) {
      setTimeSlots([]);
      return;
    }

    const service = services.find((s) => s.id === selectedServiceId);
    if (!service) return;

    try {
      setLoadingTimeSlots(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data, error: rpcError } = await supabase.rpc('get_available_time_slots', {
        p_practitioner_id: selectedPractitionerId,
        p_date: dateStr,
        p_service_duration_minutes: service.duration_minutes,
        p_exclude_appointment_id: null, // New appointments don't need to exclude any existing appointment
      });

      if (rpcError) throw rpcError;
      setTimeSlots(data || []);
    } catch (err) {
      console.error('Failed to fetch time slots:', err);
      setTimeSlots([]);
    } finally {
      setLoadingTimeSlots(false);
    }
  }, [selectedPractitionerId, selectedDate, selectedServiceId, services]);

  // Auto-fetch time slots when dependencies change
  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  // Handle clinic selection
  const handleClinicChange = useCallback(
    (clinicId: string) => {
      setSelectedClinicId(clinicId);
      setSelectedPractitionerId('');
      setSelectedServiceId('');
      setSelectedTime('');
      setTimeSlots([]);
      fetchPractitioners(clinicId);
      fetchServices(clinicId);
    },
    [fetchPractitioners, fetchServices]
  );

  // Handle date selection
  const handleDateChange = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime('');
  }, []);

  // Book appointment
  const bookAppointment = useCallback(
    async (patientId: string): Promise<boolean> => {
      if (
        !patientId ||
        !selectedClinicId ||
        !selectedPractitionerId ||
        !selectedServiceId ||
        !selectedDate ||
        !selectedTime
      ) {
        setError('Please fill in all required fields');
        return false;
      }

      try {
        setSubmitting(true);
        setError(null);

        const service = services.find((s) => s.id === selectedServiceId);

        // Check availability
        const { data: isAvailable, error: availError } = await supabase.rpc(
          'check_appointment_availability',
          {
            p_practitioner_id: selectedPractitionerId,
            p_appointment_date: format(selectedDate, 'yyyy-MM-dd'),
            p_appointment_time: selectedTime,
            p_duration_minutes: service?.duration_minutes || 30,
            p_exclude_appointment_id: null,
          }
        );

        if (availError) throw availError;

        if (!isAvailable) {
          setError('This time slot is no longer available. Please choose another time.');
          return false;
        }

        // Create the appointment
        const { error: insertError } = await supabase.from('appointments').insert({
          clinic_id: selectedClinicId,
          patient_id: patientId,
          practitioner_id: selectedPractitionerId,
          service_id: selectedServiceId,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: selectedTime,
          notes: notes || null,
          status: 'scheduled',
          booked_by: 'patient',
        });

        if (insertError) throw insertError;

        return true;
      } catch (err) {
        console.error('Failed to book appointment:', err);
        setError(err instanceof Error ? err.message : 'Failed to book appointment');
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [
      selectedClinicId,
      selectedPractitionerId,
      selectedServiceId,
      selectedDate,
      selectedTime,
      notes,
      services,
    ]
  );

  // Open modal
  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Reset form when closing
    setSelectedClinicId('');
    setSelectedPractitionerId('');
    setSelectedServiceId('');
    setSelectedDate(undefined);
    setSelectedTime('');
    setNotes('');
    setTimeSlots([]);
    setPractitioners([]);
    setServices([]);
    setError(null);
  }, []);

  // Reset form (without closing modal)
  const resetForm = useCallback(() => {
    setSelectedClinicId('');
    setSelectedPractitionerId('');
    setSelectedServiceId('');
    setSelectedDate(undefined);
    setSelectedTime('');
    setNotes('');
    setTimeSlots([]);
    setPractitioners([]);
    setServices([]);
    setError(null);
  }, []);

  // Check if form is valid
  const isFormValid =
    selectedClinicId &&
    selectedPractitionerId &&
    selectedServiceId &&
    selectedDate &&
    selectedTime;

  return {
    // Modal state
    isOpen,
    openModal,
    closeModal,

    // Selection state
    selectedClinicId,
    selectedPractitionerId,
    selectedServiceId,
    selectedDate,
    selectedTime,
    notes,

    // Setters
    setSelectedPractitionerId,
    setSelectedServiceId,
    setSelectedTime,
    setNotes,

    // Handlers
    handleClinicChange,
    handleDateChange,

    // Data
    practitioners,
    services,
    timeSlots,

    // Loading states
    loadingPractitioners,
    loadingServices,
    loadingTimeSlots,
    submitting,

    // Error
    error,
    setError,

    // Actions
    bookAppointment,
    resetForm,
    isFormValid,
  };
};

export default usePatientBooking;
