'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface Appointment {
  id: string;
  patient_id: string | null;
  clinic_id: string;
  practitioner_id: string | null;
  service_id: string | null;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  booked_by: 'patient' | 'clinic_admin';
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
    date_of_birth: string | null;
    gender: string | null;
    blood_type: string | null;
    allergies: string[] | null;
    chronic_conditions: string[] | null;
    current_medications: string | null;
    medical_notes: string | null;
    insurance_provider: string | null;
    insurance_policy_number: string | null;
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
  clinic?: {
    id: string;
    name: string;
    address: string | null;
  } | null;
}

// Raw appointment without joined relations (from realtime)
interface RawAppointment {
  id: string;
  patient_id: string | null;
  clinic_id: string;
  practitioner_id: string | null;
  service_id: string | null;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  booked_by: 'patient' | 'clinic_admin';
  notes: string | null;
  ai_recommended: boolean;
  ai_recommendation_reason: string | null;
  created_at: string;
  updated_at: string;
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

// For clinic admin view - fetch by clinic
interface FetchAppointmentsByClinicParams {
  clinicId: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  practitionerId?: string;
  status?: AppointmentStatus;
}

// For patient view - fetch by patient
interface FetchAppointmentsByPatientParams {
  patientId: string;
  status?: AppointmentStatus;
}

type FetchAppointmentsParams = FetchAppointmentsByClinicParams | FetchAppointmentsByPatientParams;

// Type guard to check if params are for clinic-based query
function isClinicParams(params: FetchAppointmentsParams): params is FetchAppointmentsByClinicParams {
  return 'clinicId' in params;
}

// Type guard to check if params are for patient-based query
function isPatientParams(params: FetchAppointmentsParams): params is FetchAppointmentsByPatientParams {
  return 'patientId' in params;
}

interface UseGetAppointmentsOptions {
  enableRealtime?: boolean;
}

const useGetAppointments = (options: UseGetAppointmentsOptions = {}) => {
  const { enableRealtime = false } = options;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store current filter params for realtime updates
  const currentParamsRef = useRef<FetchAppointmentsParams | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  // Track query mode for realtime filtering
  const queryModeRef = useRef<'clinic' | 'patient' | null>(null);

  // Helper to fetch related data for an appointment
  const fetchAppointmentRelations = useCallback(async (appointmentId: string): Promise<Appointment | null> => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients (id, first_name, last_name, email, phone, date_of_birth, gender, blood_type, allergies, chronic_conditions, current_medications, medical_notes, insurance_provider, insurance_policy_number),
        practitioner:practitioners (id, name, specialization),
        service:clinic_services (id, name, duration_minutes, price),
        clinic:clinics (id, name, address)
      `)
      .eq('id', appointmentId)
      .single();

    if (error) {
      console.error('Failed to fetch appointment relations:', error);
      return null;
    }

    return data as Appointment;
  }, []);

  // Check if appointment matches current filters
  const matchesFilters = useCallback((appointment: RawAppointment): boolean => {
    const params = currentParamsRef.current;
    if (!params) return false;

    // Patient-based query
    if (isPatientParams(params)) {
      if (appointment.patient_id !== params.patientId) return false;
      if (params.status && appointment.status !== params.status) return false;
      return true;
    }

    // Clinic-based query
    if (isClinicParams(params)) {
      if (appointment.clinic_id !== params.clinicId) return false;
      if (params.startDate && appointment.appointment_date < params.startDate) return false;
      if (params.endDate && appointment.appointment_date > params.endDate) return false;
      if (params.practitionerId && appointment.practitioner_id !== params.practitionerId) return false;
      if (params.status && appointment.status !== params.status) return false;
      return true;
    }

    return false;
  }, []);

  // Handle realtime changes
  const handleRealtimeChange = useCallback(
    async (payload: RealtimePostgresChangesPayload<RawAppointment>) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      switch (eventType) {
        case 'INSERT': {
          if (newRecord && matchesFilters(newRecord)) {
            // Fetch the full appointment with relations
            const fullAppointment = await fetchAppointmentRelations(newRecord.id);
            if (fullAppointment) {
              setAppointments((prev) => {
                // Check if appointment already exists (avoid duplicates from race conditions)
                if (prev.some((a) => a.id === fullAppointment.id)) {
                  return prev;
                }
                // Insert in sorted order by date and time
                const newList = [...prev, fullAppointment];
                return newList.sort((a, b) => {
                  const dateCompare = a.appointment_date.localeCompare(b.appointment_date);
                  if (dateCompare !== 0) return dateCompare;
                  return a.appointment_time.localeCompare(b.appointment_time);
                });
              });
            }
          }
          break;
        }

        case 'UPDATE': {
          if (newRecord) {
            if (matchesFilters(newRecord)) {
              // Fetch updated appointment with relations
              const fullAppointment = await fetchAppointmentRelations(newRecord.id);
              if (fullAppointment) {
                setAppointments((prev) => {
                  const exists = prev.some((a) => a.id === newRecord.id);
                  if (exists) {
                    // Update existing
                    return prev.map((a) => (a.id === newRecord.id ? fullAppointment : a));
                  } else {
                    // Add new (filters might now match)
                    const newList = [...prev, fullAppointment];
                    return newList.sort((a, b) => {
                      const dateCompare = a.appointment_date.localeCompare(b.appointment_date);
                      if (dateCompare !== 0) return dateCompare;
                      return a.appointment_time.localeCompare(b.appointment_time);
                    });
                  }
                });
              }
            } else {
              // Remove if it no longer matches filters
              setAppointments((prev) => prev.filter((a) => a.id !== newRecord.id));
            }
          }
          break;
        }

        case 'DELETE': {
          if (oldRecord) {
            setAppointments((prev) => prev.filter((a) => a.id !== oldRecord.id));
          }
          break;
        }
      }
    },
    [matchesFilters, fetchAppointmentRelations]
  );

  // Subscribe to realtime changes for clinic
  const subscribeToClinicRealtime = useCallback(
    (clinicId: string) => {
      // Unsubscribe from existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Create new subscription with server-side filter on clinic_id
      const channel = supabase
        .channel(`appointments:clinic:${clinicId}`)
        .on<RawAppointment>(
          'postgres_changes',
          {
            event: '*', // Listen to INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'appointments',
            filter: `clinic_id=eq.${clinicId}`,
          },
          handleRealtimeChange
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to appointments realtime for clinic: ${clinicId}`);
          }
          if (status === 'CHANNEL_ERROR') {
            console.error('Realtime subscription error');
          }
        });

      channelRef.current = channel;
    },
    [handleRealtimeChange]
  );

  // Subscribe to realtime changes for patient
  const subscribeToPatientRealtime = useCallback(
    (patientId: string) => {
      // Unsubscribe from existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Create new subscription with server-side filter on patient_id
      const channel = supabase
        .channel(`appointments:patient:${patientId}`)
        .on<RawAppointment>(
          'postgres_changes',
          {
            event: '*', // Listen to INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'appointments',
            filter: `patient_id=eq.${patientId}`,
          },
          handleRealtimeChange
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to appointments realtime for patient: ${patientId}`);
          }
          if (status === 'CHANNEL_ERROR') {
            console.error('Realtime subscription error');
          }
        });

      channelRef.current = channel;
    },
    [handleRealtimeChange]
  );

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const fetchAppointments = useCallback(
    async (params: FetchAppointmentsParams) => {
      // Store current params for realtime filtering
      currentParamsRef.current = params;

      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('appointments')
          .select(`
            *,
            patient:patients (id, first_name, last_name, email, phone, date_of_birth, gender, blood_type, allergies, chronic_conditions, current_medications, medical_notes, insurance_provider, insurance_policy_number),
            practitioner:practitioners (id, name, specialization),
            service:clinic_services (id, name, duration_minutes, price),
            clinic:clinics (id, name, address)
          `)
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });

        // Apply filters based on query mode
        if (isPatientParams(params)) {
          // Patient-based query
          queryModeRef.current = 'patient';
          
          if (!params.patientId) {
            console.error('fetchAppointments called without patientId');
            return [];
          }

          query = query.eq('patient_id', params.patientId);
          
          if (params.status) {
            query = query.eq('status', params.status);
          }

          const { data, error: queryError } = await query;

          if (queryError) {
            throw queryError;
          }

          setAppointments((data as Appointment[]) ?? []);

          // Set up realtime subscription if enabled
          if (enableRealtime) {
            subscribeToPatientRealtime(params.patientId);
          }

          return (data as Appointment[]) ?? [];
        } else if (isClinicParams(params)) {
          // Clinic-based query
          queryModeRef.current = 'clinic';
          
          if (!params.clinicId) {
            console.error('fetchAppointments called without clinicId');
            return [];
          }

          query = query.eq('clinic_id', params.clinicId);

          if (params.startDate) {
            query = query.gte('appointment_date', params.startDate);
          }
          if (params.endDate) {
            query = query.lte('appointment_date', params.endDate);
          }
          if (params.practitionerId) {
            query = query.eq('practitioner_id', params.practitionerId);
          }
          if (params.status) {
            query = query.eq('status', params.status);
          }

          const { data, error: queryError } = await query;

          if (queryError) {
            throw queryError;
          }

          setAppointments((data as Appointment[]) ?? []);

          // Set up realtime subscription if enabled
          if (enableRealtime) {
            subscribeToClinicRealtime(params.clinicId);
          }

          return (data as Appointment[]) ?? [];
        }

        return [];
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
    [enableRealtime, subscribeToClinicRealtime, subscribeToPatientRealtime]
  );

  // Unsubscribe from realtime
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    setAppointments,
    unsubscribe,
  };
};

export default useGetAppointments;
