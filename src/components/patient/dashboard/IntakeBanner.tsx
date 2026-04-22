'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parse } from 'date-fns';
import { ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import usePendingIntakes from '@/hooks/usePendingIntakes';

interface IntakeBannerProps {
  patientId: string;
}

function formatAppointmentDate(dateStr: string): string {
  try {
    return format(new Date(dateStr + 'T00:00:00'), 'MMMM d, yyyy');
  } catch {
    return dateStr;
  }
}

function formatAppointmentTime(timeStr: string): string {
  try {
    return format(parse(timeStr, 'HH:mm:ss', new Date()), 'h:mm a');
  } catch {
    return timeStr;
  }
}

export function IntakeBanner({ patientId }: IntakeBannerProps) {
  const router = useRouter();
  const { pendingIntakes } = usePendingIntakes(patientId);
  const [expanded, setExpanded] = useState(false);

  if (pendingIntakes.length === 0) return null;

  const nearest = pendingIntakes[0];

  if (pendingIntakes.length === 1) {
    return (
      <div className='mb-6'>
        <div className='flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3'>
          <div className='flex items-center gap-3 min-w-0'>
            <div className='w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0'>
              <ClipboardList className='w-5 h-5 text-amber-600 dark:text-amber-400' />
            </div>
            <div className='min-w-0'>
              <p className='text-sm font-medium text-amber-900 dark:text-amber-100'>
                Pre-Visit Intake Required
              </p>
              <p className='text-xs text-amber-700 dark:text-amber-300 truncate'>
                {nearest.clinic_name} —{' '}
                {formatAppointmentDate(nearest.appointment_date)} at{' '}
                {formatAppointmentTime(nearest.appointment_time)}
              </p>
            </div>
          </div>
          <Button
            size='sm'
            onClick={() => router.push(`/appointments/${nearest.id}/intake`)}
            className='bg-amber-600 hover:bg-amber-700 text-white shrink-0'
          >
            Complete Intake
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='mb-6 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 overflow-hidden'>
      <button
        type='button'
        onClick={() => setExpanded(!expanded)}
        className='flex items-center justify-between gap-4 w-full px-4 py-3 text-left'
      >
        <div className='flex items-center gap-3 min-w-0'>
          <div className='w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0'>
            <ClipboardList className='w-5 h-5 text-amber-600 dark:text-amber-400' />
          </div>
          <div className='min-w-0'>
            <p className='text-sm font-medium text-amber-900 dark:text-amber-100'>
              You have {pendingIntakes.length} pending intake forms
            </p>
            <p className='text-xs text-amber-700 dark:text-amber-300 truncate'>
              Next: {nearest.clinic_name} —{' '}
              {formatAppointmentDate(nearest.appointment_date)} at{' '}
              {formatAppointmentTime(nearest.appointment_time)}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className='w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0' />
        ) : (
          <ChevronDown className='w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0' />
        )}
      </button>

      {expanded && (
        <div className='border-t border-amber-200 dark:border-amber-800 divide-y divide-amber-200 dark:divide-amber-800'>
          {pendingIntakes.map((intake) => (
            <div
              key={intake.id}
              className='flex items-center justify-between gap-4 px-4 py-2.5 pl-16'
            >
              <div className='min-w-0'>
                <p className='text-sm text-amber-900 dark:text-amber-100'>
                  {intake.clinic_name}
                </p>
                <p className='text-xs text-amber-700 dark:text-amber-300 truncate'>
                  {formatAppointmentDate(intake.appointment_date)} at{' '}
                  {formatAppointmentTime(intake.appointment_time)}
                </p>
              </div>
              <Button
                size='sm'
                onClick={() => router.push(`/appointments/${intake.id}/intake`)}
                className='bg-amber-600 hover:bg-amber-700 text-white shrink-0'
              >
                Complete
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default IntakeBanner;
