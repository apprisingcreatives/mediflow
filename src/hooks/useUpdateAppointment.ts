'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Appointment, AppointmentStatus } from './useGetAppointments';

interface UpdateAppointmentParams {
  appointmentId: string;
  practitionerId?: string;
  serviceId?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  notes?: string;
  status?: AppointmentStatus;
}

interface RescheduleParams {
  appointmentId: string;
  practitionerId: string;
  serviceId: string;
  newDate: string;
  newTime: string;
  durationMinutes: number;
}

const useUpdateAppointment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update appointment (general update)
  const updateAppointment = useCallback(
    async ({
      appointmentId,
      practitionerId,
      serviceId,
      appointmentDate,
      appointmentTime,
      notes,
      status,
    }: UpdateAppointmentParams): Promise<Appointment | null> => {
      try {
        setLoading(true);
        setError(null);

        // Build update object with only provided fields
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (practitionerId !== undefined) updateData.practitioner_id = practitionerId;
        if (serviceId !== undefined) updateData.service_id = serviceId;
        if (appointmentDate !== undefined) updateData.appointment_date = appointmentDate;
        if (appointmentTime !== undefined) updateData.appointment_time = appointmentTime;
        if (notes !== undefined) updateData.notes = notes;
        if (status !== undefined) updateData.status = status;

        const { data, error: updateError } = await supabase
          .from('appointments')
          .update(updateData)
          .eq('id', appointmentId)
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
          .single();

        if (updateError) {
          throw updateError;
        }

        return data;
      } catch (err) {
        console.error('Failed to update appointment:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update appointment';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Reschedule appointment with availability check
  const rescheduleAppointment = useCallback(
    async ({
      appointmentId,
      practitionerId,
      serviceId,
      newDate,
      newTime,
      durationMinutes,
    }: RescheduleParams): Promise<Appointment | null> => {
      try {
        setLoading(true);
        setError(null);

        // Check availability (excluding current appointment)
        const { data: isAvailable, error: rpcError } = await supabase.rpc(
          'check_appointment_availability',
          {
            p_practitioner_id: practitionerId,
            p_appointment_date: newDate,
            p_appointment_time: newTime,
            p_duration_minutes: durationMinutes,
            p_exclude_appointment_id: appointmentId,
          }
        );

        if (rpcError) {
          throw new Error('Failed to check availability');
        }

        if (!isAvailable) {
          throw new Error(
            'This time slot is not available. Please choose another time.'
          );
        }

        // Update the appointment
        const { data, error: updateError } = await supabase
          .from('appointments')
          .update({
            practitioner_id: practitionerId,
            service_id: serviceId,
            appointment_date: newDate,
            appointment_time: newTime,
            updated_at: new Date().toISOString(),
          })
          .eq('id', appointmentId)
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
          .single();

        if (updateError) {
          throw updateError;
        }

        return data;
      } catch (err) {
        console.error('Failed to reschedule appointment:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to reschedule appointment';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Cancel appointment
  const cancelAppointment = useCallback(
    async (appointmentId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const { error: updateError } = await supabase
          .from('appointments')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', appointmentId);

        if (updateError) {
          throw updateError;
        }

        return true;
      } catch (err) {
        console.error('Failed to cancel appointment:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to cancel appointment';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Update appointment status
  const updateStatus = useCallback(
    async (
      appointmentId: string,
      status: AppointmentStatus
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const { error: updateError } = await supabase
          .from('appointments')
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', appointmentId);

        if (updateError) {
          throw updateError;
        }

        return true;
      } catch (err) {
        console.error('Failed to update status:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update status';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    updateAppointment,
    rescheduleAppointment,
    cancelAppointment,
    updateStatus,
    loading,
    error,
    setError,
  };
};

export default useUpdateAppointment;
