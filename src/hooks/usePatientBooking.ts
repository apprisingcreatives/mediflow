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

export interface BookingBranch {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  is_active: boolean;
  is_default: boolean;
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
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedPractitionerId, setSelectedPractitionerId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('cash');

  // Data state
  const [branches, setBranches] = useState<BookingBranch[]>([]);
  const [practitioners, setPractitioners] = useState<BookingPractitioner[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Loading states for branches
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Loading states
  const [loadingPractitioners, setLoadingPractitioners] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Created appointment (for post-booking redirect to intake)
  const [createdAppointment, setCreatedAppointment] = useState<Record<string, unknown> | null>(null);

  // Fetch branches for a clinic (public endpoint)
  const fetchBranches = useCallback(async (clinicId: string) => {
    if (!clinicId) return;
    try {
      setLoadingBranches(true);
      const res = await fetch(`/api/public/clinics/${clinicId}/branches`);
      if (!res.ok) { setBranches([]); return; }
      const data = await res.json();
      const active: BookingBranch[] = (data.branches ?? []).filter((b: BookingBranch) => b.is_active);
      setBranches(active);
      if (active.length === 1) {
        setSelectedBranchId(active[0].id);
      }
    } catch {
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  }, []);

  // Fetch practitioners for a clinic (public endpoint, optional branch filter)
  const fetchPractitioners = useCallback(async (clinicId: string, branchId?: string) => {
    if (!clinicId) return;

    try {
      setLoadingPractitioners(true);
      const url = new URL(`/api/public/clinics/${clinicId}/practitioners`, window.location.origin);
      if (branchId) {
        url.searchParams.set('branch_id', branchId);
      }

      const res = await fetch(url.toString());
      if (!res.ok) {
        console.error('Failed to fetch practitioners:', res.statusText);
        setPractitioners([]);
        return;
      }

      const data = await res.json();
      setPractitioners(data.practitioners ?? []);
    } catch (err) {
      console.error('Failed to fetch practitioners:', err);
      setPractitioners([]);
    } finally {
      setLoadingPractitioners(false);
    }
  }, []);

  // Fetch services for a clinic (public endpoint, optional branch filter)
  const fetchServices = useCallback(async (clinicId: string, branchId?: string) => {
    if (!clinicId) return;

    try {
      setLoadingServices(true);
      const url = new URL(`/api/public/clinics/${clinicId}/services`, window.location.origin);
      if (branchId) {
        url.searchParams.set('branch_id', branchId);
      }

      const res = await fetch(url.toString());
      if (!res.ok) {
        console.error('Failed to fetch services:', res.statusText);
        setServices([]);
        return;
      }

      const data = await res.json();
      setServices(data.services ?? []);
    } catch (err) {
      console.error('Failed to fetch services:', err);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  }, []);

  // Fetch time slots (RPC call — acceptable per project conventions)
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
      setSelectedBranchId('');
      setSelectedPractitionerId('');
      setSelectedServiceId('');
      setSelectedTime('');
      setTimeSlots([]);
      setBranches([]);
      fetchBranches(clinicId);
      // Fetch all practitioners and services for the clinic (no branch filter)
      fetchPractitioners(clinicId);
      fetchServices(clinicId);
    },
    [fetchBranches, fetchPractitioners, fetchServices]
  );

  // Handle branch selection
  const handleBranchChange = useCallback(
    (branchId: string) => {
      setSelectedBranchId(branchId);
      setSelectedPractitionerId('');
      setSelectedServiceId('');
      setSelectedDate(undefined);
      setSelectedTime('');
      setTimeSlots([]);
      // Re-fetch practitioners and services filtered by branch
      if (selectedClinicId) {
        fetchPractitioners(selectedClinicId, branchId || undefined);
        fetchServices(selectedClinicId, branchId || undefined);
      }
    },
    [selectedClinicId, fetchPractitioners, fetchServices]
  );

  // Handle date selection
  const handleDateChange = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime('');
  }, []);

  // Book appointment via API route (handles intake_status, patient_clinics, email)
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

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setError('Not authenticated');
          return false;
        }

        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            clinic_id: selectedClinicId,
            branch_id: selectedBranchId || null,
            practitioner_id: selectedPractitionerId,
            service_id: selectedServiceId,
            appointment_date: format(selectedDate, 'yyyy-MM-dd'),
            appointment_time: selectedTime,
            notes: notes || null,
            payment_method: paymentMethod,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to book appointment');
        }

        const { appointment } = await res.json();
        setCreatedAppointment(appointment);

        if (paymentMethod === 'online' && appointment?.id) {
          const payRes = await fetch(`/api/appointments/${appointment.id}/pay`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
          });
          if (payRes.ok) {
            const { checkout_url } = await payRes.json();
            if (checkout_url) {
              window.location.href = checkout_url;
              return true;
            }
          }
        }

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
      selectedBranchId,
      selectedPractitionerId,
      selectedServiceId,
      selectedDate,
      selectedTime,
      notes,
      paymentMethod,
    ]
  );

  // Open modal
  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setSelectedClinicId('');
    setSelectedBranchId('');
    setSelectedPractitionerId('');
    setSelectedServiceId('');
    setSelectedDate(undefined);
    setSelectedTime('');
    setNotes('');
    setTimeSlots([]);
    setBranches([]);
    setPractitioners([]);
    setServices([]);
    setError(null);
    setCreatedAppointment(null);
  }, []);

  // Reset form (without closing modal)
  const resetForm = useCallback(() => {
    setSelectedClinicId('');
    setSelectedBranchId('');
    setSelectedPractitionerId('');
    setSelectedServiceId('');
    setSelectedDate(undefined);
    setSelectedTime('');
    setNotes('');
    setPaymentMethod('cash');
    setTimeSlots([]);
    setBranches([]);
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
    selectedBranchId,
    selectedPractitionerId,
    selectedServiceId,
    selectedDate,
    selectedTime,
    notes,

    // Setters
    setSelectedBranchId,
    setSelectedPractitionerId,
    setSelectedServiceId,
    setSelectedTime,
    setNotes,
    paymentMethod,
    setPaymentMethod,

    // Handlers
    handleClinicChange,
    handleBranchChange,
    handleDateChange,

    // Data
    branches,
    practitioners,
    services,
    timeSlots,

    // Loading states
    loadingBranches,
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

    // Post-booking
    createdAppointment,
  };
};

export default usePatientBooking;
