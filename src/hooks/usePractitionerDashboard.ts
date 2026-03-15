'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Appointment, AppointmentStatus } from './useGetAppointments';
import { PractitionerWorkingHours } from './useGetPractitioners';

export interface PractitionerProfile {
  id: string;
  clinic_id: string;
  auth_user_id: string | null;
  name: string;
  email: string | null;
  specialization: string | null;
  bio: string | null;
  image_url: string | null;
  is_active: boolean;
  role: string | null;
  created_at: string;
  updated_at: string;
  clinic?: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
  } | null;
}

interface RawAppointment {
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
}

interface FetchAppointmentsParams {
  practitionerId: string;
  clinicId: string;
  startDate?: string;
  endDate?: string;
  status?: AppointmentStatus;
}

interface UpdateWorkingHoursParams {
  practitionerId: string;
  workingHours: Omit<PractitionerWorkingHours, 'id' | 'practitioner_id'>[];
}

interface UpdateProfileParams {
  practitionerId: string;
  name?: string;
  specialization?: string;
  bio?: string;
  image_url?: string;
}

interface UsePractitionerDashboardOptions {
  enableRealtime?: boolean;
}

const usePractitionerDashboard = (options: UsePractitionerDashboardOptions = {}) => {
  const { enableRealtime = false } = options;

  // Profile state
  const [profile, setProfile] = useState<PractitionerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);

  // Working hours state
  const [workingHours, setWorkingHours] = useState<PractitionerWorkingHours[]>([]);
  const [workingHoursLoading, setWorkingHoursLoading] = useState(false);
  const [workingHoursError, setWorkingHoursError] = useState<string | null>(null);

  // Realtime
  const channelRef = useRef<RealtimeChannel | null>(null);
  const currentParamsRef = useRef<FetchAppointmentsParams | null>(null);

  // Fetch practitioner profile for a specific clinic
  const fetchProfile = useCallback(async (clinicId: string): Promise<PractitionerProfile | null> => {
    try {
      setProfileLoading(true);
      setProfileError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('practitioners')
        .select(`
          *,
          clinic:clinics (id, name, address, phone)
        `)
        .eq('auth_user_id', user.id)
        .eq('clinic_id', clinicId)
        .single();

      if (error) {
        throw error;
      }

      setProfile(data as PractitionerProfile);
      return data as PractitionerProfile;
    } catch (err) {
      console.error('Failed to fetch practitioner profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setProfileError(errorMessage);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Fetch practitioner's appointments
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

  const matchesFilters = useCallback((appointment: RawAppointment): boolean => {
    const params = currentParamsRef.current;
    if (!params) return false;

    if (appointment.practitioner_id !== params.practitionerId) return false;
    if (appointment.clinic_id !== params.clinicId) return false;
    if (params.startDate && appointment.appointment_date < params.startDate) return false;
    if (params.endDate && appointment.appointment_date > params.endDate) return false;
    if (params.status && appointment.status !== params.status) return false;
    return true;
  }, []);

  const handleRealtimeChange = useCallback(
    async (payload: RealtimePostgresChangesPayload<RawAppointment>) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      switch (eventType) {
        case 'INSERT': {
          if (newRecord && matchesFilters(newRecord)) {
            const fullAppointment = await fetchAppointmentRelations(newRecord.id);
            if (fullAppointment) {
              setAppointments((prev) => {
                if (prev.some((a) => a.id === fullAppointment.id)) return prev;
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
              const fullAppointment = await fetchAppointmentRelations(newRecord.id);
              if (fullAppointment) {
                setAppointments((prev) => {
                  const exists = prev.some((a) => a.id === newRecord.id);
                  if (exists) {
                    return prev.map((a) => (a.id === newRecord.id ? fullAppointment : a));
                  } else {
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

  const subscribeToRealtime = useCallback(
    (practitionerId: string) => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel = supabase
        .channel(`appointments:practitioner:${practitionerId}`)
        .on<RawAppointment>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
            filter: `practitioner_id=eq.${practitionerId}`,
          },
          handleRealtimeChange
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to appointments realtime for practitioner: ${practitionerId}`);
          }
        });

      channelRef.current = channel;
    },
    [handleRealtimeChange]
  );

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
      currentParamsRef.current = params;

      try {
        setAppointmentsLoading(true);
        setAppointmentsError(null);

        let query = supabase
          .from('appointments')
          .select(`
            *,
            patient:patients (id, first_name, last_name, email, phone, date_of_birth, gender, blood_type, allergies, chronic_conditions, current_medications, medical_notes, insurance_provider, insurance_policy_number),
            practitioner:practitioners (id, name, specialization),
            service:clinic_services (id, name, duration_minutes, price),
            clinic:clinics (id, name, address)
          `)
          .eq('practitioner_id', params.practitionerId)
          .eq('clinic_id', params.clinicId)
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });

        if (params.startDate) {
          query = query.gte('appointment_date', params.startDate);
        }
        if (params.endDate) {
          query = query.lte('appointment_date', params.endDate);
        }
        if (params.status) {
          query = query.eq('status', params.status);
        }

        const { data, error } = await query;

        if (error) throw error;

        setAppointments((data as Appointment[]) ?? []);

        if (enableRealtime) {
          subscribeToRealtime(params.practitionerId);
        }

        return (data as Appointment[]) ?? [];
      } catch (err) {
        console.error('Failed to fetch appointments:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch appointments';
        setAppointmentsError(errorMessage);
        return [];
      } finally {
        setAppointmentsLoading(false);
      }
    },
    [enableRealtime, subscribeToRealtime]
  );

  // Fetch working hours
  const fetchWorkingHours = useCallback(async (practitionerId: string): Promise<PractitionerWorkingHours[]> => {
    try {
      setWorkingHoursLoading(true);
      setWorkingHoursError(null);

      const { data, error } = await supabase
        .from('practitioner_working_hours')
        .select('*')
        .eq('practitioner_id', practitionerId)
        .order('day_of_week', { ascending: true });

      if (error) throw error;

      setWorkingHours((data as PractitionerWorkingHours[]) ?? []);
      return (data as PractitionerWorkingHours[]) ?? [];
    } catch (err) {
      console.error('Failed to fetch working hours:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch working hours';
      setWorkingHoursError(errorMessage);
      return [];
    } finally {
      setWorkingHoursLoading(false);
    }
  }, []);

  // Update working hours (replace all for the practitioner)
  const updateWorkingHours = useCallback(
    async ({ practitionerId, workingHours: newWorkingHours }: UpdateWorkingHoursParams): Promise<boolean> => {
      try {
        setWorkingHoursLoading(true);
        setWorkingHoursError(null);

        // Delete existing working hours
        const { error: deleteError } = await supabase
          .from('practitioner_working_hours')
          .delete()
          .eq('practitioner_id', practitionerId);

        if (deleteError) throw deleteError;

        // Insert new working hours
        if (newWorkingHours.length > 0) {
          const hoursToInsert = newWorkingHours.map((h) => ({
            practitioner_id: practitionerId,
            day_of_week: h.day_of_week,
            start_time: h.start_time,
            end_time: h.end_time,
            is_available: h.is_available,
          }));

          const { error: insertError } = await supabase
            .from('practitioner_working_hours')
            .insert(hoursToInsert);

          if (insertError) throw insertError;
        }

        // Refresh working hours
        await fetchWorkingHours(practitionerId);
        return true;
      } catch (err) {
        console.error('Failed to update working hours:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to update working hours';
        setWorkingHoursError(errorMessage);
        return false;
      } finally {
        setWorkingHoursLoading(false);
      }
    },
    [fetchWorkingHours]
  );

  // Update profile
  const updateProfile = useCallback(
    async ({ practitionerId, ...updates }: UpdateProfileParams): Promise<PractitionerProfile | null> => {
      try {
        setProfileLoading(true);
        setProfileError(null);

        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.specialization !== undefined) updateData.specialization = updates.specialization;
        if (updates.bio !== undefined) updateData.bio = updates.bio;
        if (updates.image_url !== undefined) updateData.image_url = updates.image_url;

        const { data, error } = await supabase
          .from('practitioners')
          .update(updateData)
          .eq('id', practitionerId)
          .select(`
            *,
            clinic:clinics (id, name, address, phone)
          `)
          .single();

        if (error) throw error;

        setProfile(data as PractitionerProfile);
        return data as PractitionerProfile;
      } catch (err) {
        console.error('Failed to update profile:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
        setProfileError(errorMessage);
        return null;
      } finally {
        setProfileLoading(false);
      }
    },
    []
  );

  // Update appointment status
  const updateAppointmentStatus = useCallback(
    async (appointmentId: string, status: AppointmentStatus): Promise<boolean> => {
      try {
        setAppointmentsLoading(true);
        setAppointmentsError(null);

        const { error } = await supabase
          .from('appointments')
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', appointmentId);

        if (error) throw error;

        // Update local state
        setAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? { ...a, status } : a))
        );

        return true;
      } catch (err) {
        console.error('Failed to update appointment status:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
        setAppointmentsError(errorMessage);
        return false;
      } finally {
        setAppointmentsLoading(false);
      }
    },
    []
  );

  // Add notes to appointment
  const updateAppointmentNotes = useCallback(
    async (appointmentId: string, notes: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('appointments')
          .update({
            notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', appointmentId);

        if (error) throw error;

        setAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? { ...a, notes } : a))
        );

        return true;
      } catch (err) {
        console.error('Failed to update appointment notes:', err);
        return false;
      }
    },
    []
  );

  // Unsubscribe from realtime
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  return {
    // Profile
    profile,
    profileLoading,
    profileError,
    fetchProfile,
    updateProfile,

    // Appointments
    appointments,
    appointmentsLoading,
    appointmentsError,
    fetchAppointments,
    updateAppointmentStatus,
    updateAppointmentNotes,

    // Working hours
    workingHours,
    workingHoursLoading,
    workingHoursError,
    fetchWorkingHours,
    updateWorkingHours,

    // Realtime
    unsubscribe,
  };
};

export default usePractitionerDashboard;
