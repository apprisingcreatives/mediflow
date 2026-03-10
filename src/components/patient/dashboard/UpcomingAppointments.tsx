'use client';

import { format, parseISO } from 'date-fns';
import { Calendar, Clock, MapPin, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Appointment } from '@/hooks/useGetAppointments';
import { formatTime, getStatusColor } from './utils';

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

interface AppointmentCardProps {
  appointment: Appointment;
}

function AppointmentCard({ appointment }: AppointmentCardProps) {
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
      </div>
      <div className="flex flex-col gap-2">
        <Button size="sm" className="bg-clinic-teal hover:bg-clinic-teal/90 text-white">
          Check In
        </Button>
        <Button variant="outline" size="sm">
          Reschedule
        </Button>
      </div>
    </div>
  );
}

export default UpcomingAppointments;
