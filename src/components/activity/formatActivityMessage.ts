import { ActivityLog } from '@/hooks/useActivityLogs';

type Perspective = 'patient' | 'clinic_admin' | 'practitioner';

const ACTION_COLORS: Record<string, string> = {
  appointment_completed: 'bg-green-500',
  appointment_checked_in: 'bg-green-500',
  appointment_confirmed: 'bg-blue-500',
  appointment_created: 'bg-purple-500',
  password_changed: 'bg-purple-500',
  appointment_rescheduled: 'bg-amber-500',
  profile_updated: 'bg-amber-500',
  appointment_cancelled: 'bg-red-500',
  appointment_no_show: 'bg-gray-400',
};

export function getActionColor(actionType: string): string {
  return ACTION_COLORS[actionType] || 'bg-gray-400';
}

export function formatActivityMessage(
  log: ActivityLog,
  perspective: Perspective,
  patientName?: string,
): string {
  const meta = log.metadata as Record<string, string>;
  const isPatient = perspective === 'patient';
  const subject = isPatient ? 'You' : (patientName || 'Patient');

  switch (log.action_type) {
    case 'appointment_created': {
      const details = [
        meta.service_name,
        meta.practitioner_name ? `with ${meta.practitioner_name}` : null,
        meta.date,
      ].filter(Boolean).join(' ');
      if (log.actor_role === 'patient') {
        return isPatient
          ? `You booked an appointment — ${details}`
          : `${subject} booked an appointment — ${details}`;
      }
      return `Appointment booked by clinic admin — ${details}`;
    }

    case 'appointment_confirmed':
      if (log.actor_role === 'patient') {
        return isPatient ? 'You confirmed the appointment' : `${subject} confirmed the appointment`;
      }
      return `Confirmed by ${meta.confirmed_by || 'staff'}`;

    case 'appointment_cancelled':
      if (log.actor_role === 'patient') {
        return isPatient ? 'You cancelled the appointment' : `${subject} cancelled the appointment`;
      }
      return `Cancelled by ${meta.cancelled_by || 'staff'}`;

    case 'appointment_rescheduled':
      return isPatient
        ? `You rescheduled — moved from ${meta.old_date} ${meta.old_time} to ${meta.new_date} ${meta.new_time}`
        : `${subject} rescheduled — moved from ${meta.old_date} ${meta.old_time} to ${meta.new_date} ${meta.new_time}`;

    case 'appointment_checked_in':
      return isPatient ? 'You checked in' : `${subject} checked in`;

    case 'appointment_completed':
      return `Marked complete by ${meta.completed_by || 'staff'}`;

    case 'appointment_no_show':
      return meta.source === 'auto'
        ? 'Automatically marked as no-show'
        : `Marked as no-show by ${meta.marked_by || 'staff'}`;

    case 'password_changed':
      return isPatient ? 'You changed your password' : `${subject} changed their password`;

    case 'profile_updated': {
      const fields = (log.metadata as { fields_changed?: string[] }).fields_changed;
      const fieldStr = fields?.length ? ` — changed ${fields.join(', ')}` : '';
      return isPatient ? `You updated your profile${fieldStr}` : `${subject} updated their profile${fieldStr}`;
    }

    default:
      return (log.action_type as string).replace(/_/g, ' ');
  }
}
