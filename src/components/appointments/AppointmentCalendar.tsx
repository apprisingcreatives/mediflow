'use client';

import { useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Appointment, APPOINTMENT_STATUSES } from '@/hooks/useGetAppointments';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onDateClick: (date: Date) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  isLoading?: boolean;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AppointmentCalendar({
  appointments,
  currentMonth,
  onMonthChange,
  onDateClick,
  onAppointmentClick,
  isLoading = false,
}: AppointmentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};

    appointments.forEach((apt) => {
      const dateKey = apt.appointment_date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(apt);
    });

    // Sort appointments by time within each day
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) =>
        a.appointment_time.localeCompare(b.appointment_time)
      );
    });

    return grouped;
  }, [appointments]);

  const handlePrevMonth = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick(date);
  };

  const getStatusColor = (status: string) => {
    const statusConfig = APPOINTMENT_STATUSES.find((s) => s.value === status);
    return statusConfig?.color || 'bg-gray-100 text-gray-600';
  };

  const formatTime = (time: string) => {
    // Convert HH:MM:SS to HH:MM AM/PM
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass overflow-hidden'>
      {/* Calendar Header */}
      <div className='p-4 border-b border-clinic-navy/10 dark:border-white/10'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-display font-bold text-clinic-navy dark:text-white'>
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='icon'
              onClick={handlePrevMonth}
              className='h-8 w-8'
            >
              <ChevronLeft className='w-4 h-4' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onMonthChange(new Date())}
              className='h-8'
            >
              Today
            </Button>
            <Button
              variant='outline'
              size='icon'
              onClick={handleNextMonth}
              className='h-8 w-8'
            >
              <ChevronRight className='w-4 h-4' />
            </Button>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className='absolute inset-0 bg-white/50 dark:bg-slate-800/50 flex items-center justify-center z-10'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-clinic-teal' />
        </div>
      )}

      {/* Weekday Headers */}
      <div className='grid grid-cols-7 border-b border-clinic-navy/10 dark:border-white/10'>
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className='p-2 text-center text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase'
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className='grid grid-cols-7'>
        {calendarDays.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayAppointments = appointmentsByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);

          return (
            <div
              key={index}
              className={cn(
                'min-h-[120px] border-b border-r border-clinic-navy/10 dark:border-white/10 p-1 cursor-pointer transition-colors',
                !isCurrentMonth && 'bg-clinic-navy/5 dark:bg-white/5',
                isSelected && 'bg-clinic-teal/10',
                'hover:bg-clinic-teal/5'
              )}
              onClick={() => handleDateClick(day)}
            >
              {/* Date Number */}
              <div className='flex items-center justify-between mb-1'>
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-7 h-7 text-sm rounded-full',
                    isTodayDate &&
                      'bg-clinic-teal text-white font-semibold',
                    !isTodayDate &&
                      isCurrentMonth &&
                      'text-clinic-navy dark:text-white',
                    !isCurrentMonth && 'text-clinic-text/40 dark:text-white/40'
                  )}
                >
                  {format(day, 'd')}
                </span>
                {isCurrentMonth && (
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-clinic-teal/10'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDateClick(day);
                    }}
                  >
                    <Plus className='w-3 h-3' />
                  </Button>
                )}
              </div>

              {/* Appointments */}
              <div className='space-y-1 overflow-hidden'>
                {dayAppointments.slice(0, 3).map((apt) => (
                  <div
                    key={apt.id}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-xs truncate cursor-pointer transition-opacity hover:opacity-80',
                      getStatusColor(apt.status)
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick(apt);
                    }}
                    title={`${formatTime(apt.appointment_time)} - ${apt.patient?.first_name} ${apt.patient?.last_name}`}
                  >
                    <span className='font-medium'>
                      {formatTime(apt.appointment_time)}
                    </span>{' '}
                    {apt.patient?.first_name?.[0]}. {apt.patient?.last_name}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className='text-xs text-clinic-text/60 dark:text-white/60 px-1.5'>
                    +{dayAppointments.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AppointmentCalendar;
