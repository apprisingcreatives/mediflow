'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Appointment {
  id: string;
  patient_id: string | null;
  clinic_id: string;
  practitioner_id: string | null;
  service_id: string | null;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  notes: string | null;
  ai_recommended: boolean;
  ai_recommendation_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  } | null;
  practitioner?: {
    id: string;
    name: string;
    specialization: string | null;
  } | null;
  service?: {
    id: string;
    name: string;
    duration_minutes: number;
    price: number;
  } | null;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export const APPOINTMENT_STATUSES: { value: AppointmentStatus; label: string; color: string }[] = [
  { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-700' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-green-100 text-green-700' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-600' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  { value: 'no-show', label: 'No Show', color: 'bg-orange-100 text-orange-700' },
];

interface FetchAppointmentsParams {
  clinicId: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  practitionerId?: string;
  status?: AppointmentStatus;
}

const useGetAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(
    async ({
      clinicId,
      startDate,
      endDate,
      practitionerId,
      status,
    }: FetchAppointmentsParams) => {
      if (!clinicId) {
        console.error('fetchAppointments called without clinicId');
        return [];
      }

      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('appointments')
          .select(
            `
            *,
            patient:patients (
              id,
              first_name,
              last_name,
              email,
              phone
            ),
            practitioner:practitioners (
              id,
              name,
              specialization
            ),
            service:clinic_services (
              id,
              name,
              duration_minutes,
              price
            )
          `
          )
          .eq('clinic_id', clinicId)
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });

        // Apply filters
        if (startDate) {
          query = query.gte('appointment_date', startDate);
        }
        if (endDate) {
          query = query.lte('appointment_date', endDate);
        }
        if (practitionerId) {
          query = query.eq('practitioner_id', practitionerId);
        }
        if (status) {
          query = query.eq('status', status);
        }

        const { data, error: queryError } = await query;

        if (queryError) {
          throw queryError;
        }

        setAppointments(data ?? []);
        return data ?? [];
      } catch (err) {
        console.error('Failed to fetch appointments:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch appointments';
        setError(errorMessage);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    setAppointments,
  };
};

export default useGetAppointments;
