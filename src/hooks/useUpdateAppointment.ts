'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
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

        // Get current appointment for logging
        const { data: currentAppointment } = await supabase
          .from('appointments')
          .select('appointment_date, appointment_time, patient_id, clinic_id')
          .eq('id', appointmentId)
          .single();

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

        // Log activity
        const { data: { user } } = await supabase.auth.getUser();
        if (user && data) {
          await supabase.from('activity_logs').insert({
            patient_id: currentAppointment?.patient_id || data.patient_id,
            clinic_id: currentAppointment?.clinic_id || data.clinic_id,
            actor_id: user.id,
            actor_role: 'patient',
            action_type: 'appointment_rescheduled',
            entity_type: 'appointment',
            entity_id: appointmentId,
            metadata: {
              old_date: currentAppointment?.appointment_date || '',
              old_time: currentAppointment?.appointment_time || '',
              new_date: newDate,
              new_time: newTime,
            },
          }).then(({ error: logError }) => {
            if (logError) console.error('Failed to log activity:', logError);
          });
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

  // Cancel appointment via API route (triggers waitlist auto-book + rebooking SMS)
  const cancelAppointment = useCallback(
    async (appointmentId: string, reason?: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('Not authenticated');
        }

        await axios.post(
          `/api/appointments/${appointmentId}/cancel`,
          { reason, source: 'web' },
          { headers: { Authorization: `Bearer ${session.access_token}` } },
        );

        return true;
      } catch (err: any) {
        console.error('Failed to cancel appointment:', err);
        const errorMessage =
          err?.response?.data?.error ||
          (err instanceof Error ? err.message : 'Failed to cancel appointment');
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
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

        // If status is 'completed', update patient_clinics visit timestamps
        if (status === 'completed') {
          // Get appointment details to find patient_id and clinic_id
          const { data: appointment, error: fetchError } = await supabase
            .from('appointments')
            .select('patient_id, clinic_id, appointment_date')
            .eq('id', appointmentId)
            .single();

          if (!fetchError && appointment) {
            const visitDate = appointment.appointment_date;

            // Get current patient_clinics record
            const { data: patientClinic, error: pcFetchError } = await supabase
              .from('patient_clinics')
              .select('id, first_visit_at')
              .eq('patient_id', appointment.patient_id)
              .eq('clinic_id', appointment.clinic_id)
              .single();

            if (!pcFetchError && patientClinic) {
              // Build update object
              const updateData: { last_visit_at: string; first_visit_at?: string } = {
                last_visit_at: visitDate,
              };

              // Set first_visit_at only if it's null
              if (!patientClinic.first_visit_at) {
                updateData.first_visit_at = visitDate;
              }

              const { error: pcUpdateError } = await supabase
                .from('patient_clinics')
                .update(updateData)
                .eq('id', patientClinic.id);

              if (pcUpdateError) {
                console.error('Failed to update patient_clinics visit timestamps:', pcUpdateError);
                // Don't fail the status update, just log the error
              }
            }
          }
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
