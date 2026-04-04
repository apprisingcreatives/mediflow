'use client';

import { useState } from 'react';
import { parseISO, isToday } from 'date-fns';
import { Loader2, CheckCircle, XCircle, UserX, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Appointment } from '@/hooks/useGetAppointments';
import { supabase } from '@/lib/supabase';

type ViewerRole = 'patient' | 'practitioner' | 'clinic_admin';

interface AppointmentActionsProps {
  appointment: Appointment;
  viewerRole: ViewerRole;
  onStatusChange?: () => void;
  layout?: 'row' | 'column';
}

function isMinutesPastAppointment(
  appointmentDate: string,
  appointmentTime: string,
  minutes: number
): boolean {
  const date = parseISO(appointmentDate);
  if (!isToday(date)) {
    return new Date(appointmentDate) < new Date(new Date().toDateString());
  }

  const now = new Date();
  const [hours, mins] = appointmentTime.split(':').map(Number);
  const appointmentDateTime = new Date();
  appointmentDateTime.setHours(hours, mins, 0, 0);
  appointmentDateTime.setMinutes(appointmentDateTime.getMinutes() + minutes);

  return now >= appointmentDateTime;
}

export function AppointmentActions({
  appointment,
  viewerRole,
  onStatusChange,
  layout = 'column',
}: AppointmentActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (newStatus: string) => {
    setLoading(newStatus);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', appointment.id);

      if (updateError) throw updateError;
      onStatusChange?.();
    } catch (err) {
      console.error(`Failed to update status to ${newStatus}:`, err);
      setError('Failed to update. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const { status, booked_by } = appointment;
  const buttons: React.ReactNode[] = [];

  // --- CONFIRM button ---
  if (status === 'scheduled') {
    const canConfirm =
      (booked_by === 'patient' && (viewerRole === 'practitioner' || viewerRole === 'clinic_admin')) ||
      (booked_by === 'clinic_admin' && viewerRole === 'patient');

    if (canConfirm) {
      buttons.push(
        <Button
          key="confirm"
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={loading !== null}
          onClick={() => updateStatus('confirmed')}
        >
          {loading === 'confirmed' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4 mr-1" />
              Confirm
            </>
          )}
        </Button>
      );
    }
  }

  // --- MARK COMPLETE button ---
  if (status === 'in-progress' && (viewerRole === 'practitioner' || viewerRole === 'clinic_admin')) {
    buttons.push(
      <Button
        key="complete"
        size="sm"
        className="bg-green-600 hover:bg-green-700 text-white"
        disabled={loading !== null}
        onClick={() => updateStatus('completed')}
      >
        {loading === 'completed' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <CheckCircle className="w-4 h-4 mr-1" />
            Mark Complete
          </>
        )}
      </Button>
    );
  }

  // --- NO SHOW button ---
  if (
    status === 'confirmed' &&
    (viewerRole === 'practitioner' || viewerRole === 'clinic_admin') &&
    isMinutesPastAppointment(appointment.appointment_date, appointment.appointment_time, 15)
  ) {
    buttons.push(
      <AlertDialog key="noshow">
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20"
            disabled={loading !== null}
          >
            {loading === 'no-show' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserX className="w-4 h-4 mr-1" />
                No Show
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as No Show?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the appointment as a no-show. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => updateStatus('no-show')}
            >
              Mark No Show
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // --- CANCEL button ---
  if (
    viewerRole === 'patient' &&
    (status === 'scheduled' ||
      (status === 'confirmed' &&
        !isMinutesPastAppointment(appointment.appointment_date, appointment.appointment_time, 0)))
  ) {
    buttons.push(
      <AlertDialog key="cancel">
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
            disabled={loading !== null}
          >
            {loading === 'cancelled' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-1" />
                Cancel
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? You can always book a new one later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => updateStatus('cancelled')}
            >
              Cancel Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (buttons.length === 0 && !error) return null;

  return (
    <div className={`flex gap-2 ${layout === 'column' ? 'flex-col' : 'flex-row flex-wrap'}`}>
      {buttons}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default AppointmentActions;
