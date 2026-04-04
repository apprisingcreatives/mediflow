'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Appointment } from '@/hooks/useGetAppointments';
import { TimeSlot } from '@/hooks/usePatientBooking';
import { supabase } from '@/lib/supabase';
import useUpdateAppointment from '@/hooks/useUpdateAppointment';
import { formatTime } from './utils';

interface RescheduleModalProps {
  appointment: Appointment;
  isOpen: boolean;
  onClose: () => void;
}

export function RescheduleModal({
  appointment,
  isOpen,
  onClose,
}: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { rescheduleAppointment, loading: submitting } = useUpdateAppointment();

  const durationMinutes = appointment.service?.duration_minutes ?? 30;

  // Fetch time slots when date changes
  const fetchTimeSlots = useCallback(async () => {
    if (!selectedDate || !appointment.practitioner_id) {
      setTimeSlots([]);
      return;
    }

    try {
      setLoadingTimeSlots(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data, error: rpcError } = await supabase.rpc(
        'get_available_time_slots',
        {
          p_practitioner_id: appointment.practitioner_id,
          p_date: dateStr,
          p_service_duration_minutes: durationMinutes,
          p_exclude_appointment_id: appointment.id,
        },
      );

      if (rpcError) throw rpcError;
      setTimeSlots(data || []);
    } catch (err) {
      console.error('Failed to fetch time slots:', err);
      setTimeSlots([]);
    } finally {
      setLoadingTimeSlots(false);
    }
  }, [
    selectedDate,
    appointment.practitioner_id,
    appointment.id,
    durationMinutes,
  ]);

  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(undefined);
      setSelectedTime('');
      setTimeSlots([]);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime('');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;

    setError(null);
    const result = await rescheduleAppointment({
      appointmentId: appointment.id,
      practitionerId: appointment.practitioner_id || '',
      serviceId: appointment.service_id || '',
      newDate: format(selectedDate, 'yyyy-MM-dd'),
      newTime: selectedTime,
      durationMinutes,
    });

    if (result) {
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } else {
      setError(
        'This time slot is no longer available. Please choose another time.',
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-[450px] bg-white dark:bg-slate-800 max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-xl font-display font-bold text-clinic-navy dark:text-white'>
            Reschedule Appointment
          </DialogTitle>
          <DialogDescription className='text-clinic-text/60 dark:text-white/60'>
            Pick a new date and time for your appointment with{' '}
            <span className='font-medium text-clinic-navy dark:text-white'>
              {appointment.practitioner?.name}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-5 py-4'>
          {error && (
            <div className='p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400'>
              {error}
            </div>
          )}

          {success && (
            <div className='p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-600 dark:text-green-400'>
              Appointment rescheduled successfully!
            </div>
          )}

          {/* Current appointment info */}
          <div className='p-3 bg-clinic-bg/50 dark:bg-slate-700/50 rounded-lg space-y-1'>
            <p className='text-xs font-medium text-clinic-text/50 dark:text-white/50 uppercase tracking-wide'>
              Current Schedule
            </p>
            <p className='text-sm text-clinic-navy dark:text-white'>
              {format(
                new Date(appointment.appointment_date + 'T00:00:00'),
                'EEEE, MMMM d, yyyy',
              )}
              {' at '}
              {formatTime(appointment.appointment_time)}
            </p>
            <p className='text-xs text-clinic-text/60 dark:text-white/60'>
              {appointment.service?.name} ({durationMinutes} min)
            </p>
          </div>

          {/* Date Selection */}
          <div className='space-y-2'>
            <Label className='text-sm font-medium'>New Date</Label>
            <Popover modal={true}>
              <PopoverTrigger asChild>
                <Button
                  type='button'
                  variant='outline'
                  disabled={success}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {selectedDate
                    ? format(selectedDate, 'PPP')
                    : 'Pick a new date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0 z-[100]' align='start'>
                <Calendar
                  mode='single'
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className='space-y-2'>
            <Label className='text-sm font-medium'>New Time</Label>
            {loadingTimeSlots ? (
              <div className='flex items-center justify-center p-4 border rounded-lg'>
                <Loader2 className='w-5 h-5 animate-spin text-clinic-teal mr-2' />
                <span className='text-sm text-clinic-text/60'>
                  Loading available times...
                </span>
              </div>
            ) : timeSlots.length > 0 ? (
              <div className='grid grid-cols-4 gap-2 max-h-[150px] overflow-y-auto p-1'>
                {timeSlots.map((slot) => (
                  <Button
                    key={slot.time_slot}
                    type='button'
                    variant={
                      selectedTime === slot.time_slot ? 'default' : 'outline'
                    }
                    size='sm'
                    disabled={!slot.is_available || success}
                    onClick={() => {
                      setSelectedTime(slot.time_slot);
                      setError(null);
                    }}
                    className={cn(
                      'text-xs',
                      selectedTime === slot.time_slot &&
                        'bg-clinic-teal hover:bg-clinic-teal/90',
                      !slot.is_available && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    <Clock className='w-3 h-3 mr-1' />
                    {formatTime(slot.time_slot)}
                  </Button>
                ))}
              </div>
            ) : (
              <div className='p-4 border rounded-lg text-center text-sm text-clinic-text/60'>
                {!selectedDate
                  ? 'Select a date to see available times'
                  : 'No available time slots for this date'}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className='flex justify-end gap-3 pt-4 border-t'>
          <Button variant='outline' onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedDate || !selectedTime || submitting || success}
            className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'
          >
            {submitting ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Rescheduling...
              </>
            ) : success ? (
              'Done!'
            ) : (
              'Reschedule'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RescheduleModal;
