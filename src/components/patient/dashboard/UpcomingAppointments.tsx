'use client';

import { useState } from 'react';
import { format, parseISO, isToday } from 'date-fns';
import { Calendar, Clock, MapPin, ChevronRight, Plus, Loader2, CheckCircle, CreditCard, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Appointment } from '@/hooks/useGetAppointments';
import { supabase } from '@/lib/supabase';
import { RescheduleModal } from './RescheduleModal';
import { formatTime, getStatusColor } from './utils';
import { AppointmentActions } from '@/components/appointments/AppointmentActions';
import { usePayAppointment } from '@/hooks/usePayAppointment';
import { PaymentReceiptDialog } from './PaymentReceiptDialog';

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
  loading: boolean;
  onBookAppointment: () => void;
  canBookAppointment: boolean;
  maxDisplay?: number;
}

export function UpcomingAppointments({
  appointments,
  loading,
  onBookAppointment,
  canBookAppointment,
  maxDisplay = 3,
}: UpcomingAppointmentsProps) {
  return (
    <Card className="border-0 shadow-glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-lg font-semibold text-clinic-navy dark:text-white">
          Upcoming Appointments
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-clinic-teal">
          View All
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-clinic-teal" />
          </div>
        ) : appointments.length === 0 ? (
          <EmptyState
            onBookAppointment={onBookAppointment}
            canBookAppointment={canBookAppointment}
          />
        ) : (
          appointments
            .slice(0, maxDisplay)
            .map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
        )}
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps {
  onBookAppointment: () => void;
  canBookAppointment: boolean;
}

function EmptyState({ onBookAppointment, canBookAppointment }: EmptyStateProps) {
  return (
    <div className="text-center py-8">
      <Calendar className="w-12 h-12 text-clinic-navy/20 mx-auto mb-4" />
      <p className="text-clinic-text/60 dark:text-white/60">No upcoming appointments</p>
      <Button
        className="mt-4 bg-clinic-teal hover:bg-clinic-teal/90"
        onClick={onBookAppointment}
        disabled={!canBookAppointment}
      >
        <Plus className="w-4 h-4 mr-2" />
        Book an Appointment
      </Button>
    </div>
  );
}

/**
 * Check if it's currently within the check-in window for an appointment.
 * Patients can check in starting 15 minutes before the appointment time,
 * and up to 30 minutes after.
 */
function isWithinCheckInWindow(appointmentDate: string, appointmentTime: string): boolean {
  const date = parseISO(appointmentDate);
  if (!isToday(date)) return false;

  const now = new Date();
  const [hours, minutes] = appointmentTime.split(':').map(Number);
  const appointmentDateTime = new Date();
  appointmentDateTime.setHours(hours, minutes, 0, 0);

  const windowStart = new Date(appointmentDateTime);
  windowStart.setMinutes(windowStart.getMinutes() - 15);

  const windowEnd = new Date(appointmentDateTime);
  windowEnd.setMinutes(windowEnd.getMinutes() + 30);

  return now >= windowStart && now <= windowEnd;
}

interface AppointmentCardProps {
  appointment: Appointment;
}

function AppointmentCard({ appointment }: AppointmentCardProps) {
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const { pay, loading: paying, error: payError } = usePayAppointment();
  const [receiptOpen, setReceiptOpen] = useState(false);

  const showPayButton =
    ['scheduled', 'confirmed'].includes(appointment.status) &&
    appointment.payment_status === 'pending' &&
    appointment.payment_amount &&
    appointment.payment_amount > 0;

  const showReceiptButton = ['paid', 'refunded'].includes(appointment.payment_status);

  const canCheckIn =
    appointment.status === 'confirmed' &&
    isWithinCheckInWindow(appointment.appointment_date, appointment.appointment_time);

  const isCheckedIn = appointment.status === 'in-progress';

  const handleCheckIn = async () => {
    setCheckingIn(true);
    setCheckInError(null);

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'in-progress' })
        .eq('id', appointment.id);

      if (error) throw error;

      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_logs').insert({
          patient_id: appointment.patient_id,
          clinic_id: appointment.clinic_id,
          actor_id: user.id,
          actor_role: 'patient',
          action_type: 'appointment_checked_in',
          entity_type: 'appointment',
          entity_id: appointment.id,
          metadata: {},
        }).then(({ error: logError }) => {
          if (logError) console.error('Failed to log activity:', logError);
        });
      }
    } catch (err) {
      console.error('Check-in failed:', err);
      setCheckInError('Failed to check in. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-clinic-bg/50 dark:bg-slate-700/50">
      <Avatar className="w-12 h-12">
        <AvatarFallback className="bg-clinic-teal text-white">
          {appointment.practitioner?.name
            ?.split(' ')
            .map((n) => n[0])
            .join('') || 'DR'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-clinic-navy dark:text-white">
            {appointment.practitioner?.name || 'Doctor'}
          </h4>
          <Badge
            variant="outline"
            className={cn('text-xs', getStatusColor(appointment.status))}
          >
            {appointment.status}
          </Badge>
        </div>
        <p className="text-sm text-clinic-text/60 dark:text-white/60">
          {appointment.practitioner?.specialization ||
            appointment.service?.name ||
            'Consultation'}
        </p>
        <div className="flex items-center gap-4 mt-2 text-sm">
          <span className="flex items-center gap-1 text-clinic-navy dark:text-white">
            <Calendar className="w-4 h-4 text-clinic-teal" />
            {format(parseISO(appointment.appointment_date), 'MMM d, yyyy')}
          </span>
          <span className="flex items-center gap-1 text-clinic-navy dark:text-white">
            <Clock className="w-4 h-4 text-clinic-teal" />
            {formatTime(appointment.appointment_time)}
          </span>
        </div>
        {appointment.clinic && (
          <p className="text-xs text-clinic-text/50 dark:text-white/50 mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {appointment.clinic.name}
          </p>
        )}
        {checkInError && (
          <p className="text-xs text-red-500 mt-1">{checkInError}</p>
        )}
        {payError && (
          <p className="text-xs text-red-500 mt-1">{payError}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {/* Check In button - patient only, time-gated */}
        {isCheckedIn ? (
          <Button size="sm" disabled className="bg-green-500 text-white">
            <CheckCircle className="w-4 h-4 mr-1" />
            Checked In
          </Button>
        ) : appointment.status === 'confirmed' ? (
          <Button
            size="sm"
            className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
            disabled={!canCheckIn || checkingIn}
            onClick={handleCheckIn}
            title={
              !isWithinCheckInWindow(appointment.appointment_date, appointment.appointment_time)
                ? 'Check-in opens 15 minutes before your appointment'
                : undefined
            }
          >
            {checkingIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Check In'
            )}
          </Button>
        ) : null}

        {/* Pay Now button for unpaid appointments */}
        {showPayButton && (
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={paying}
            onClick={() => pay(appointment.id)}
          >
            {paying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-1" />
                Pay Now
              </>
            )}
          </Button>
        )}

        {/* Payment status indicator */}
        {appointment.payment_status === 'paid' && (
          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
            Paid
          </Badge>
        )}
        {appointment.payment_status === 'refund_pending' && (
          <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
            Refund Pending
          </Badge>
        )}
        {appointment.payment_status === 'refunded' && (
          <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
            Refunded
          </Badge>
        )}

        {/* View Receipt */}
        {showReceiptButton && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setReceiptOpen(true)}
          >
            <Receipt className="w-3 h-3 mr-1" />
            Receipt
          </Button>
        )}

        {/* Context-aware action buttons (Confirm, Cancel) */}
        <AppointmentActions
          appointment={appointment}
          viewerRole="patient"
        />

        {/* Reschedule - only for scheduled/confirmed */}
        {['scheduled', 'confirmed'].includes(appointment.status) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRescheduleOpen(true)}
          >
            Reschedule
          </Button>
        )}
      </div>

      {showReceiptButton && (
        <PaymentReceiptDialog
          appointmentId={appointment.id}
          isOpen={receiptOpen}
          onClose={() => setReceiptOpen(false)}
        />
      )}

      <RescheduleModal
        appointment={appointment}
        isOpen={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
      />
    </div>
  );
}

export default UpcomingAppointments;
