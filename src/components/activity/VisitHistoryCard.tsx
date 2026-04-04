'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Appointment } from '@/hooks/useGetAppointments';
import { ActivityLog } from '@/hooks/useActivityLogs';
import { ActivityTimeline } from './ActivityTimeline';
import { supabase } from '@/lib/supabase';

interface VisitHistoryCardProps {
  appointment: Appointment;
  perspective: 'patient' | 'clinic_admin' | 'practitioner';
  patientName?: string;
  defaultExpanded?: boolean;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'no-show': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'in-progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
}

export function VisitHistoryCard({
  appointment,
  perspective,
  patientName,
  defaultExpanded = false,
}: VisitHistoryCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logsLoaded, setLogsLoaded] = useState(false);

  // Lazy-load logs on first expand
  useEffect(() => {
    if (expanded && !logsLoaded) {
      supabase
        .from('activity_logs')
        .select('*')
        .eq('entity_id', appointment.id)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          setLogs((data as ActivityLog[]) ?? []);
          setLogsLoaded(true);
        });
    }
  }, [expanded, logsLoaded, appointment.id]);

  const practitionerInitials = appointment.practitioner?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('') || 'DR';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
      {/* Header — always visible */}
      <button
        className="w-full flex items-center justify-between gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="w-9 h-9 shrink-0">
            <AvatarFallback className="bg-clinic-teal/10 text-clinic-teal text-xs font-semibold">
              {practitionerInitials}
            </AvatarFallback>
          </Avatar>
          <div className="text-left min-w-0">
            <div className="font-semibold text-sm text-clinic-navy dark:text-white truncate">
              {appointment.practitioner?.name || 'Doctor'} — {appointment.service?.name || 'Consultation'}
            </div>
            <div className="text-xs text-clinic-text/50 dark:text-white/50">
              {format(parseISO(appointment.appointment_date), 'MMM d, yyyy')} · {appointment.appointment_time?.slice(0, 5)} · {appointment.clinic?.name || 'Clinic'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className={cn('text-xs', getStatusColor(appointment.status))}>
            {appointment.status}
          </Badge>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-clinic-text/40" />
          ) : (
            <ChevronRight className="w-4 h-4 text-clinic-text/40" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-4 space-y-3">
          {/* Details grid */}
          <div className="bg-clinic-bg/50 dark:bg-slate-700/50 rounded-lg p-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-clinic-text/50 dark:text-white/50">Service:</span>{' '}
              <span className="text-clinic-navy dark:text-white">{appointment.service?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-clinic-text/50 dark:text-white/50">Duration:</span>{' '}
              <span className="text-clinic-navy dark:text-white">{appointment.service?.duration_minutes || '—'} min</span>
            </div>
            <div>
              <span className="text-clinic-text/50 dark:text-white/50">Clinic:</span>{' '}
              <span className="text-clinic-navy dark:text-white">{appointment.clinic?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-clinic-text/50 dark:text-white/50">Booked by:</span>{' '}
              <span className="text-clinic-navy dark:text-white">
                {appointment.booked_by === 'patient'
                  ? perspective === 'patient' ? 'You' : patientName || 'Patient'
                  : 'Clinic'}
              </span>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="bg-clinic-bg/50 dark:bg-slate-700/50 rounded-lg p-3">
              <div className="text-xs text-clinic-text/50 dark:text-white/50 mb-1">Notes</div>
              <p className="text-sm text-clinic-navy dark:text-white">{appointment.notes}</p>
            </div>
          )}

          {/* Per-appointment activity timeline */}
          <div>
            <div className="text-xs text-clinic-text/50 dark:text-white/50 mb-2">Timeline</div>
            <ActivityTimeline logs={logs} perspective={perspective} patientName={patientName} />
          </div>
        </div>
      )}
    </div>
  );
}
