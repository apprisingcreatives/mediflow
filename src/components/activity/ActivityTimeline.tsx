'use client';

import { format, parseISO } from 'date-fns';
import { ActivityLog } from '@/hooks/useActivityLogs';
import { formatActivityMessage, getActionColor } from './formatActivityMessage';

interface ActivityTimelineProps {
  logs: ActivityLog[];
  perspective: 'patient' | 'clinic_admin' | 'practitioner';
  patientName?: string;
}

export function ActivityTimeline({
  logs,
  perspective,
  patientName,
}: ActivityTimelineProps) {
  if (logs.length === 0) {
    return (
      <p className='text-sm text-clinic-text/50 dark:text-white/50'>
        No activity recorded.
      </p>
    );
  }

  return (
    <div className='pl-4 border-l-2 border-clinic-navy/10 dark:border-white/10 space-y-1 '>
      {logs.map((log) => (
        <div key={log.id} className='relative py-1.5'>
          <span
            className={`absolute -left-[21px] top-[10px] w-2.5 h-2.5 rounded-full ${getActionColor(log.action_type)}`}
          />
          <div className='text-xs text-clinic-text/50 dark:text-white/50'>
            {format(parseISO(log.created_at), 'MMM d, yyyy · h:mm a')}
          </div>
          <div className='text-sm text-clinic-navy dark:text-white'>
            {formatActivityMessage(log, perspective, patientName)}
          </div>
        </div>
      ))}
    </div>
  );
}
