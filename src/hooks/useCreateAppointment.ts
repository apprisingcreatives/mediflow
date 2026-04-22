'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import { Appointment, AppointmentStatus } from './useGetAppointments';

interface TimeSlot {
  time_slot: string;
  is_available: boolean;
}

interface CreateAppointmentParams {
  clinicId: string;
  patientId: string;
  practitionerId: string;
  serviceId: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM:SS or HH:MM
  notes?: string;
  status?: AppointmentStatus;
  bookedBy?: 'patient' | 'clinic_admin';
}

interface CheckAvailabilityParams {
  practitionerId: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  excludeAppointmentId?: string;
}

const useCreateAppointment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if a specific time slot is available
  const checkAvailability = useCallback(
    async ({
      practitionerId,
      appointmentDate,
      appointmentTime,
      durationMinutes,
      excludeAppointmentId,
    }: CheckAvailabilityParams): Promise<boolean> => {
      try {
        // Call the database function to check availability
        const { data, error: rpcError } = await supabase.rpc(
          'check_appointment_availability',
          {
            p_practitioner_id: practitionerId,
            p_appointment_date: appointmentDate,
            p_appointment_time: appointmentTime,
            p_duration_minutes: durationMinutes,
            p_exclude_appointment_id: excludeAppointmentId || null,
          }
        );

        if (rpcError) {
          console.error('Availability check error:', rpcError);
          return false;
        }

        return data === true;
      } catch (err) {
        console.error('Failed to check availability:', err);
        return false;
      }
    },
    []
  );

  // Get available time slots for a practitioner on a specific date
  const getAvailableTimeSlots = useCallback(
    async (
      practitionerId: string,
      date: string,
      serviceDurationMinutes: number = 30,
      excludeAppointmentId?: string
    ): Promise<TimeSlot[]> => {
      try {
        const { data, error: rpcError } = await supabase.rpc(
          'get_available_time_slots',
          {
            p_practitioner_id: practitionerId,
            p_date: date,
            p_service_duration_minutes: serviceDurationMinutes,
            p_exclude_appointment_id: excludeAppointmentId || null,
          }
        );

        if (rpcError) {
          console.error('Get time slots error:', rpcError);
          return [];
        }

        return data ?? [];
      } catch (err) {
        console.error('Failed to get time slots:', err);
        return [];
      }
    },
    []
  );

  // Create a new appointment via API route
  const createAppointment = useCallback(
    async ({
      clinicId,
      patientId,
      practitionerId,
      serviceId,
      appointmentDate,
      appointmentTime,
      notes,
      status = 'scheduled',
      bookedBy = 'patient',
    }: CreateAppointmentParams): Promise<Appointment | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('Not authenticated');
        }

        const { data } = await axios.post(
          '/api/appointments',
          {
            clinic_id: clinicId,
            patient_id: patientId,
            practitioner_id: practitionerId,
            service_id: serviceId,
            appointment_date: appointmentDate,
            appointment_time: appointmentTime,
            notes: notes || null,
            status,
            booked_by: bookedBy,
          },
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          },
        );

        return data.appointment;
      } catch (err: any) {
        console.error('Failed to create appointment:', err);
        const errorMessage =
          err.response?.data?.error ||
          (err instanceof Error ? err.message : 'Failed to create appointment');
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    createAppointment,
    checkAvailability,
    getAvailableTimeSlots,
    loading,
    error,
    setError,
  };
};

export default useCreateAppointment;
