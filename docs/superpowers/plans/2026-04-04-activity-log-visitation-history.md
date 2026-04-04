# Activity Log & Visitation History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an append-only activity log tracking all patient actions, and surface visitation history with per-appointment timelines across patient, clinic admin, and practitioner views.

**Architecture:** Create `activity_logs` table with RLS policies, insert log entries at the application layer alongside existing actions, build shared `ActivityTimeline` and `VisitHistoryCard` components, add a patient history page and clinic admin patient history page, and enhance the patients list page with card/list toggle and action popover.

**Tech Stack:** Supabase (PostgreSQL, RLS, pg_cron), Next.js 14 App Router, React, TypeScript, shadcn/ui (Tabs, DropdownMenu, Table)

**Spec:** `docs/superpowers/specs/2026-04-04-activity-log-visitation-history-design.md`

---

### Task 1: Create `activity_logs` table migration

**Files:**
- Create: `supabase/migrations/20260405000003_activity_logs.sql`

- [ ] **Step 1: Create migration file**

```sql
-- =============================================================================
-- Activity Logs: append-only audit trail for patient activity
-- =============================================================================

-- 1. Create activity_logs table
CREATE TABLE public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id   UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  actor_id    UUID NOT NULL,
  actor_role  TEXT NOT NULL CHECK (actor_role IN ('patient', 'clinic_admin', 'practitioner', 'system')),
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id   UUID,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexes
CREATE INDEX idx_activity_logs_patient_time ON public.activity_logs (patient_id, created_at DESC);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs (entity_id, created_at ASC);
CREATE INDEX idx_activity_logs_clinic_patient ON public.activity_logs (clinic_id, patient_id, created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 4. Patient can read own logs
CREATE POLICY "patients_read_own_logs" ON public.activity_logs
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE auth_user_id = auth.uid()
    )
  );

-- 5. Patient can insert own logs
CREATE POLICY "patients_insert_own_logs" ON public.activity_logs
  FOR INSERT WITH CHECK (
    patient_id IN (
      SELECT id FROM public.patients WHERE auth_user_id = auth.uid()
    )
  );

-- 6. Clinic admin can read booking logs for their clinic
CREATE POLICY "clinic_admins_read_logs" ON public.activity_logs
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM public.clinic_admins WHERE auth_user_id = auth.uid()
    )
    AND action_type NOT IN ('password_changed', 'profile_updated')
  );

-- 7. Clinic admin can insert booking logs
CREATE POLICY "clinic_admins_insert_logs" ON public.activity_logs
  FOR INSERT WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM public.clinic_admins WHERE auth_user_id = auth.uid()
    )
  );

-- 8. Practitioner can read booking logs for their clinic
CREATE POLICY "practitioners_read_logs" ON public.activity_logs
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM public.practitioners WHERE auth_user_id = auth.uid() AND is_active = true
    )
    AND action_type NOT IN ('password_changed', 'profile_updated')
  );

-- 9. Practitioner can insert booking logs
CREATE POLICY "practitioners_insert_logs" ON public.activity_logs
  FOR INSERT WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM public.practitioners WHERE auth_user_id = auth.uid() AND is_active = true
    )
  );

-- 10. Update pg_cron auto no-show to also insert activity logs
SELECT cron.unschedule('auto-no-show-detection');
SELECT cron.schedule(
  'auto-no-show-detection',
  '*/5 * * * *',
  $$
  WITH updated AS (
    UPDATE public.appointments
    SET status = 'no-show', updated_at = now()
    WHERE status = 'confirmed'
      AND (
        appointment_date < CURRENT_DATE
        OR (
          appointment_date = CURRENT_DATE
          AND appointment_time + INTERVAL '30 minutes' < CURRENT_TIME
        )
      )
    RETURNING id, patient_id, clinic_id
  )
  INSERT INTO public.activity_logs (patient_id, clinic_id, actor_id, actor_role, action_type, entity_type, entity_id, metadata)
  SELECT patient_id, clinic_id, '00000000-0000-0000-0000-000000000000', 'system', 'appointment_no_show', 'appointment', id, '{"source": "auto"}'::jsonb
  FROM updated;
  $$
);
```

- [ ] **Step 2: Apply migration**

Run: `npx supabase db push` or apply via Supabase dashboard.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260405000003_activity_logs.sql
git commit -m "feat: add activity_logs table with RLS and update auto no-show cron"
```

---

### Task 2: Create `useActivityLogs` hook and types

**Files:**
- Create: `src/hooks/useActivityLogs.ts`

- [ ] **Step 1: Create the hook**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ActivityLog {
  id: string;
  patient_id: string;
  clinic_id: string | null;
  actor_id: string;
  actor_role: 'patient' | 'clinic_admin' | 'practitioner' | 'system';
  action_type: ActivityActionType;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type ActivityActionType =
  | 'appointment_created'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'appointment_checked_in'
  | 'appointment_completed'
  | 'appointment_no_show'
  | 'password_changed'
  | 'profile_updated';

interface FetchByPatientParams {
  patientId: string;
  clinicId?: string;
}

interface FetchByEntityParams {
  entityId: string;
}

type FetchLogsParams = FetchByPatientParams | FetchByEntityParams;

function isEntityParams(params: FetchLogsParams): params is FetchByEntityParams {
  return 'entityId' in params;
}

const useActivityLogs = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (params: FetchLogsParams) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('activity_logs')
        .select('*');

      if (isEntityParams(params)) {
        query = query
          .eq('entity_id', params.entityId)
          .order('created_at', { ascending: true });
      } else {
        query = query.eq('patient_id', params.patientId);
        if (params.clinicId) {
          query = query.eq('clinic_id', params.clinicId);
        }
        query = query.order('created_at', { ascending: false });
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setLogs((data as ActivityLog[]) ?? []);
      return (data as ActivityLog[]) ?? [];
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activity logs';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { logs, loading, error, fetchLogs };
};

export default useActivityLogs;
```

- [ ] **Step 2: Export from hooks barrel**

In `src/hooks/index.ts`, add:

```typescript
export { default as useActivityLogs } from './useActivityLogs';
export type { ActivityLog, ActivityActionType } from './useActivityLogs';
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useActivityLogs.ts src/hooks/index.ts
git commit -m "feat: add useActivityLogs hook for fetching activity log entries"
```

---

### Task 3: Create `formatActivityMessage` helper and `ActivityTimeline` component

**Files:**
- Create: `src/components/activity/formatActivityMessage.ts`
- Create: `src/components/activity/ActivityTimeline.tsx`

- [ ] **Step 1: Create the formatter**

```typescript
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
      return log.action_type.replace(/_/g, ' ');
  }
}
```

- [ ] **Step 2: Create the ActivityTimeline component**

```tsx
'use client';

import { format, parseISO } from 'date-fns';
import { ActivityLog } from '@/hooks/useActivityLogs';
import { formatActivityMessage, getActionColor } from './formatActivityMessage';

interface ActivityTimelineProps {
  logs: ActivityLog[];
  perspective: 'patient' | 'clinic_admin' | 'practitioner';
  patientName?: string;
}

export function ActivityTimeline({ logs, perspective, patientName }: ActivityTimelineProps) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-clinic-text/50 dark:text-white/50">No activity recorded.</p>
    );
  }

  return (
    <div className="pl-4 border-l-2 border-clinic-navy/10 dark:border-white/10 space-y-1">
      {logs.map((log) => (
        <div key={log.id} className="relative py-1.5">
          <span
            className={`absolute -left-[21px] top-[10px] w-2.5 h-2.5 rounded-full ${getActionColor(log.action_type)}`}
          />
          <div className="text-xs text-clinic-text/50 dark:text-white/50">
            {format(parseISO(log.created_at), 'MMM d, yyyy · h:mm a')}
          </div>
          <div className="text-sm text-clinic-navy dark:text-white">
            {formatActivityMessage(log, perspective, patientName)}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/activity/formatActivityMessage.ts src/components/activity/ActivityTimeline.tsx
git commit -m "feat: add ActivityTimeline component and formatActivityMessage helper"
```

---

### Task 4: Create `VisitHistoryCard` component

**Files:**
- Create: `src/components/activity/VisitHistoryCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/activity/VisitHistoryCard.tsx
git commit -m "feat: add VisitHistoryCard expandable component with lazy-loaded timeline"
```

---

### Task 5: Insert activity logs in all existing action paths

**Files:**
- Modify: `src/components/appointments/AppointmentActions.tsx:58-75`
- Modify: `src/hooks/usePatientBooking.ts:200-212`
- Modify: `src/hooks/useCreateAppointment.ts:167-210`
- Modify: `src/hooks/useUpdateAppointment.ts:140-174`
- Modify: `src/components/patient/dashboard/UpcomingAppointments.tsx:125-140`
- Modify: `src/components/auth/change-password-form.tsx:84-97`
- Modify: `src/app/api/appointments/route.ts:94-117`
- Modify: `src/app/api/appointments/[appointmentId]/checkin/route.ts:77-84,172-179`

This is the largest task. Each file gets a `supabase.from('activity_logs').insert(...)` call after the existing action succeeds. Log insertion failures should be caught and logged but not block the main action.

- [ ] **Step 1: Add logging to `AppointmentActions.tsx`**

In `src/components/appointments/AppointmentActions.tsx`, the `updateStatus` function (line 58) currently does:

```typescript
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
  } catch ...
```

Replace the `updateStatus` function body (lines 58-75) with:

```typescript
  const updateStatus = async (newStatus: string) => {
    setLoading(newStatus);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', appointment.id);

      if (updateError) throw updateError;

      // Log activity
      const actionMap: Record<string, string> = {
        confirmed: 'appointment_confirmed',
        completed: 'appointment_completed',
        'no-show': 'appointment_no_show',
        cancelled: 'appointment_cancelled',
      };
      const actionType = actionMap[newStatus];
      if (actionType) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const metadata: Record<string, string> = {};
          if (newStatus === 'confirmed') metadata.confirmed_by = viewerRole;
          if (newStatus === 'completed') metadata.completed_by = viewerRole;
          if (newStatus === 'cancelled') metadata.cancelled_by = viewerRole;
          if (newStatus === 'no-show') metadata.source = 'manual';

          await supabase.from('activity_logs').insert({
            patient_id: appointment.patient_id,
            clinic_id: appointment.clinic_id,
            actor_id: user.id,
            actor_role: viewerRole,
            action_type: actionType,
            entity_type: 'appointment',
            entity_id: appointment.id,
            metadata,
          }).then(({ error: logError }) => {
            if (logError) console.error('Failed to log activity:', logError);
          });
        }
      }

      onStatusChange?.();
    } catch (err) {
      console.error(`Failed to update status to ${newStatus}:`, err);
      setError('Failed to update. Please try again.');
    } finally {
      setLoading(null);
    }
  };
```

- [ ] **Step 2: Add logging to `usePatientBooking.ts`**

In `src/hooks/usePatientBooking.ts`, after the successful insert (line 211), before `return true;`, add:

```typescript
        // Log activity
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const service = services.find((s) => s.id === selectedServiceId);
          const practitioner = practitioners.find((p) => p.id === selectedPractitionerId);
          await supabase.from('activity_logs').insert({
            patient_id: patientId,
            clinic_id: selectedClinicId,
            actor_id: user.id,
            actor_role: 'patient',
            action_type: 'appointment_created',
            entity_type: 'appointment',
            entity_id: null, // insert doesn't return id in this path
            metadata: {
              practitioner_name: practitioner?.name || '',
              service_name: service?.name || '',
              date: format(selectedDate!, 'yyyy-MM-dd'),
              time: selectedTime,
            },
          }).then(({ error: logError }) => {
            if (logError) console.error('Failed to log activity:', logError);
          });
        }
```

- [ ] **Step 3: Add logging to `useCreateAppointment.ts`**

In `src/hooks/useCreateAppointment.ts`, after the successful insert returns `data` (line 204), before `return data;` (line 210), add:

```typescript
        // Log activity
        const { data: { user } } = await supabase.auth.getUser();
        if (user && data) {
          await supabase.from('activity_logs').insert({
            patient_id: patientId,
            clinic_id: clinicId,
            actor_id: user.id,
            actor_role: bookedBy === 'patient' ? 'patient' : 'clinic_admin',
            action_type: 'appointment_created',
            entity_type: 'appointment',
            entity_id: data.id,
            metadata: {
              practitioner_name: data.practitioner?.name || '',
              service_name: data.service?.name || '',
              date: appointmentDate,
              time: appointmentTime,
            },
          }).then(({ error: logError }) => {
            if (logError) console.error('Failed to log activity:', logError);
          });
        }
```

- [ ] **Step 4: Add logging to `useUpdateAppointment.ts` reschedule**

In `src/hooks/useUpdateAppointment.ts`, inside `rescheduleAppointment` (line 105), after the successful update returns `data` (line 174), before `return data;` (line 180), add:

```typescript
        // Log activity - need old date/time from current appointment
        const { data: { user } } = await supabase.auth.getUser();
        if (user && data) {
          await supabase.from('activity_logs').insert({
            patient_id: data.patient_id,
            clinic_id: data.clinic_id,
            actor_id: user.id,
            actor_role: 'patient',
            action_type: 'appointment_rescheduled',
            entity_type: 'appointment',
            entity_id: appointmentId,
            metadata: {
              old_date: '', // not available in this context
              old_time: '',
              new_date: newDate,
              new_time: newTime,
            },
          }).then(({ error: logError }) => {
            if (logError) console.error('Failed to log activity:', logError);
          });
        }
```

To capture old date/time properly, first read the appointment before updating. Add before the availability check (line 118):

```typescript
        // Get current appointment for logging
        const { data: currentAppointment } = await supabase
          .from('appointments')
          .select('appointment_date, appointment_time, patient_id, clinic_id')
          .eq('id', appointmentId)
          .single();
```

Then use `currentAppointment` in the metadata:

```typescript
            metadata: {
              old_date: currentAppointment?.appointment_date || '',
              old_time: currentAppointment?.appointment_time || '',
              new_date: newDate,
              new_time: newTime,
            },
```

And use `currentAppointment` for patient_id/clinic_id:

```typescript
            patient_id: currentAppointment?.patient_id || data.patient_id,
            clinic_id: currentAppointment?.clinic_id || data.clinic_id,
```

- [ ] **Step 5: Add logging to `UpcomingAppointments.tsx` handleCheckIn**

In `src/components/patient/dashboard/UpcomingAppointments.tsx`, inside `handleCheckIn` (line 125), after the successful update (line 133), before `setCheckingIn(false)`, add:

```typescript
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
```

- [ ] **Step 6: Add logging to `change-password-form.tsx`**

In `src/components/auth/change-password-form.tsx`, after the successful password update (line 92), before `setIsSuccess(true)`, add:

```typescript
      // Log activity
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        // Get patient record for patient_id
        const { data: patientRecord } = await supabase
          .from('patients')
          .select('id')
          .eq('auth_user_id', currentUser.id)
          .single();

        if (patientRecord) {
          await supabase.from('activity_logs').insert({
            patient_id: patientRecord.id,
            clinic_id: null,
            actor_id: currentUser.id,
            actor_role: 'patient',
            action_type: 'password_changed',
            entity_type: 'account',
            entity_id: null,
            metadata: {},
          }).then(({ error: logError }) => {
            if (logError) console.error('Failed to log activity:', logError);
          });
        }
      }
```

- [ ] **Step 7: Add logging to check-in API route**

In `src/app/api/appointments/[appointmentId]/checkin/route.ts`:

For the GET handler (around line 77-84), after the successful status update, add:

```typescript
    // Log activity
    await supabase.from('activity_logs').insert({
      patient_id: appointment.patient_id,
      clinic_id: appointment.clinic_id,
      actor_id: user.id,
      actor_role: 'patient',
      action_type: 'appointment_checked_in',
      entity_type: 'appointment',
      entity_id: appointment.id,
      metadata: {},
    });
```

For the POST handler (around line 172-179), after the successful status update, add the same insert.

- [ ] **Step 8: Add logging to appointment API route (POST)**

In `src/app/api/appointments/route.ts`, after the successful appointment insert (line 108), add:

```typescript
    // Log activity
    await supabase.from('activity_logs').insert({
      patient_id: patient.id,
      clinic_id: clinic_id || null,
      actor_id: user.id,
      actor_role: 'patient',
      action_type: 'appointment_created',
      entity_type: 'appointment',
      entity_id: appointment.id,
      metadata: {
        practitioner_name: practitionerName,
        service_name: serviceName,
        date: appointment_date,
        time: appointment_time,
      },
    });
```

Note: `practitionerName` and `serviceName` are already fetched later in the file (lines 119-148). Move or duplicate the fetch to before the log insert, or insert the log after those fetches.

- [ ] **Step 9: Commit**

```bash
git add src/components/appointments/AppointmentActions.tsx src/hooks/usePatientBooking.ts src/hooks/useCreateAppointment.ts src/hooks/useUpdateAppointment.ts src/components/patient/dashboard/UpcomingAppointments.tsx src/components/auth/change-password-form.tsx src/app/api/appointments/route.ts "src/app/api/appointments/[appointmentId]/checkin/route.ts"
git commit -m "feat: insert activity log entries in all appointment and account action paths"
```

---

### Task 6: Create patient history page (`/patient/history`)

**Files:**
- Create: `src/app/(dashboard)/patient/history/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import useGetAppointments from '@/hooks/useGetAppointments';
import useActivityLogs from '@/hooks/useActivityLogs';
import { VisitHistoryCard } from '@/components/activity/VisitHistoryCard';
import { ActivityTimeline } from '@/components/activity/ActivityTimeline';

export default function PatientHistoryPage() {
  const router = useRouter();
  const { user, patient, isLoading: authLoading } = useAuth();
  const { appointments, loading: apptLoading, fetchAppointments } = useGetAppointments();
  const { logs, loading: logsLoading, fetchLogs } = useActivityLogs();

  useEffect(() => {
    if (!authLoading && !patient) {
      router.push('/');
      return;
    }
    if (patient) {
      fetchAppointments({ patientId: patient.id });
      fetchLogs({ patientId: patient.id });
    }
  }, [patient, authLoading, router, fetchAppointments, fetchLogs]);

  if (authLoading || apptLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-clinic-teal" />
      </div>
    );
  }

  // All appointments sorted by date descending for history
  const pastAppointments = [...appointments]
    .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date) || b.appointment_time.localeCompare(a.appointment_time));

  const totalVisits = appointments.filter((a) => a.status === 'completed').length;

  return (
    <div className="min-h-screen bg-clinic-bg dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push('/patient')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-display font-bold text-clinic-navy dark:text-white">
              My History
            </h1>
            <p className="text-sm text-clinic-text/60 dark:text-white/60">
              Your past visits and activity
            </p>
          </div>
          <div className="ml-auto">
            <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
              {totalVisits} completed visits
            </span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="visits">
          <TabsList className="mb-6">
            <TabsTrigger value="visits">Visit History</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="visits" className="space-y-3">
            {pastAppointments.length === 0 ? (
              <p className="text-center py-12 text-clinic-text/50 dark:text-white/50">
                No appointments yet.
              </p>
            ) : (
              pastAppointments.map((appointment, index) => (
                <VisitHistoryCard
                  key={appointment.id}
                  appointment={appointment}
                  perspective="patient"
                  defaultExpanded={index === 0}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="activity">
            {logsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-clinic-teal" />
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                <ActivityTimeline logs={logs} perspective="patient" />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(dashboard)/patient/history/page.tsx"
git commit -m "feat: add patient history page with visit history and activity log tabs"
```

---

### Task 7: Add `RecentVisitsCard` to patient dashboard

**Files:**
- Create: `src/components/patient/dashboard/RecentVisitsCard.tsx`
- Modify: `src/app/(dashboard)/patient/page.tsx:148-155`

- [ ] **Step 1: Create RecentVisitsCard**

```tsx
'use client';

import { format, parseISO } from 'date-fns';
import { Calendar, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Appointment } from '@/hooks/useGetAppointments';

interface RecentVisitsCardProps {
  appointments: Appointment[];
  loading: boolean;
  maxDisplay?: number;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    'no-show': 'bg-gray-100 text-gray-600',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
}

export function RecentVisitsCard({ appointments, loading, maxDisplay = 3 }: RecentVisitsCardProps) {
  const router = useRouter();

  const pastAppointments = appointments
    .filter((a) => ['completed', 'cancelled', 'no-show'].includes(a.status))
    .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))
    .slice(0, maxDisplay);

  if (loading || pastAppointments.length === 0) return null;

  return (
    <Card className="border-0 shadow-glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-lg font-semibold text-clinic-navy dark:text-white">
          Recent Visits
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-clinic-teal"
          onClick={() => router.push('/patient/history')}
        >
          View All
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {pastAppointments.map((appointment) => (
          <div
            key={appointment.id}
            className="flex items-center justify-between py-2 border-b last:border-0 border-clinic-navy/5 dark:border-white/5"
          >
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-medium text-clinic-navy dark:text-white shrink-0">
                {format(parseISO(appointment.appointment_date), 'MMM d')}
              </span>
              <span className="text-clinic-text/60 dark:text-white/60 truncate">
                — {appointment.practitioner?.name || 'Doctor'} — {appointment.service?.name || 'Visit'}
              </span>
            </div>
            <Badge variant="outline" className={cn('text-xs shrink-0 ml-2', getStatusColor(appointment.status))}>
              {appointment.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Add RecentVisitsCard to patient dashboard**

In `src/app/(dashboard)/patient/page.tsx`, add import:

```typescript
import { RecentVisitsCard } from '@/components/patient/dashboard/RecentVisitsCard';
```

Then after the `<UpcomingAppointments>` component (around line 154), add:

```tsx
            <RecentVisitsCard
              appointments={appointments}
              loading={appointmentsLoading}
            />
```

- [ ] **Step 3: Export from barrel**

In `src/components/patient/dashboard/index.ts`, add:

```typescript
export { RecentVisitsCard } from './RecentVisitsCard';
```

- [ ] **Step 4: Commit**

```bash
git add src/components/patient/dashboard/RecentVisitsCard.tsx "src/app/(dashboard)/patient/page.tsx" src/components/patient/dashboard/index.ts
git commit -m "feat: add RecentVisitsCard to patient dashboard with link to history page"
```

---

### Task 8: Create clinic admin patient history page

**Files:**
- Create: `src/app/(clinic)/clinic/[clinicId]/patients/[patientId]/history/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { Appointment } from '@/hooks/useGetAppointments';
import { ActivityLog } from '@/hooks/useActivityLogs';
import { VisitHistoryCard } from '@/components/activity/VisitHistoryCard';
import { ActivityTimeline } from '@/components/activity/ActivityTimeline';
import { useClinicContext } from '../../../layout';

interface PatientInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}

export default function PatientHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const { clinicId } = useClinicContext();
  const patientId = params.patientId as string;

  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId || !clinicId) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch patient info
      const { data: patientData } = await supabase
        .from('patients')
        .select('id, first_name, last_name, email, phone')
        .eq('id', patientId)
        .single();

      setPatient(patientData);

      // Fetch appointments for this patient at this clinic
      const { data: apptData } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients (id, first_name, last_name, email, phone),
          practitioner:practitioners (id, name, specialization),
          service:clinic_services (id, name, duration_minutes, price),
          clinic:clinics (id, name, address)
        `)
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      setAppointments((apptData as Appointment[]) ?? []);

      // Fetch activity logs for this patient at this clinic
      const { data: logData } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      setLogs((logData as ActivityLog[]) ?? []);
      setLoading(false);
    };

    fetchData();
  }, [patientId, clinicId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-clinic-teal" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-24 text-clinic-text/50 dark:text-white/50">
        Patient not found.
      </div>
    );
  }

  const patientName = `${patient.first_name} ${patient.last_name}`;
  const initials = `${patient.first_name[0]}${patient.last_name[0]}`;
  const totalVisits = appointments.filter((a) => a.status === 'completed').length;
  const lastVisit = appointments.find((a) => a.status === 'completed');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push(`/clinic/${clinicId}/patients`)}
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Patients
      </Button>

      {/* Patient header */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-clinic-navy/10 dark:border-white/10">
        <Avatar className="w-12 h-12">
          <AvatarFallback className="bg-clinic-teal text-white font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="text-lg font-display font-bold text-clinic-navy dark:text-white">
            {patientName}
          </h1>
          <div className="flex items-center gap-4 text-sm text-clinic-text/60 dark:text-white/60">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> {patient.email}
            </span>
            {patient.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {patient.phone}
              </span>
            )}
          </div>
        </div>
        <div className="ml-auto flex gap-2 shrink-0">
          <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
            {totalVisits} visits
          </span>
          {lastVisit && (
            <span className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full text-xs font-medium">
              Last: {lastVisit.appointment_date}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="visits">
        <TabsList className="mb-6">
          <TabsTrigger value="visits">Visit History</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="visits" className="space-y-3">
          {appointments.length === 0 ? (
            <p className="text-center py-12 text-clinic-text/50 dark:text-white/50">
              No appointments found for this patient at this clinic.
            </p>
          ) : (
            appointments.map((appointment, index) => (
              <VisitHistoryCard
                key={appointment.id}
                appointment={appointment}
                perspective="clinic_admin"
                patientName={patientName}
                defaultExpanded={index === 0}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="activity">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <ActivityTimeline logs={logs} perspective="clinic_admin" patientName={patientName} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(clinic)/clinic/[clinicId]/patients/[patientId]/history/page.tsx"
git commit -m "feat: add clinic admin patient history page with visit history and activity log"
```

---

### Task 9: Add popover menu and list view toggle to patients page

**Files:**
- Modify: `src/app/(clinic)/clinic/[clinicId]/patients/page.tsx`

- [ ] **Step 1: Add imports**

Add to existing imports in `src/app/(clinic)/clinic/[clinicId]/patients/page.tsx`:

```typescript
import { LayoutGrid, List, FileText, MessageSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
```

- [ ] **Step 2: Add view toggle state**

Inside the main component function, add:

```typescript
const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
```

- [ ] **Step 3: Add view toggle buttons to the header**

Find the header section with "Patients" title and "Add Patient" button. Between the search input and the filter/add-patient buttons, add the view toggle:

```tsx
              {/* View Toggle */}
              <div className="flex bg-white dark:bg-slate-800 border border-clinic-navy/10 dark:border-white/10 rounded-lg overflow-hidden">
                <button
                  className={cn(
                    'p-2 transition-colors',
                    viewMode === 'card' ? 'bg-clinic-teal text-white' : 'text-clinic-text/50 hover:bg-clinic-bg'
                  )}
                  onClick={() => setViewMode('card')}
                  title="Card view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  className={cn(
                    'p-2 transition-colors',
                    viewMode === 'list' ? 'bg-clinic-teal text-white' : 'text-clinic-text/50 hover:bg-clinic-bg'
                  )}
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
```

- [ ] **Step 4: Replace the `MoreVertical` button in `PatientCard` with a `DropdownMenu`**

In the `PatientCard` component, replace:

```tsx
        <Button variant='ghost' size='icon'>
          <MoreVertical className='w-4 h-4' />
        </Button>
```

With:

```tsx
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon'>
              <MoreVertical className='w-4 h-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/clinic/${clinicId}/patients/${patient.id}/history`)}
            >
              <FileText className="w-4 h-4 mr-2 text-clinic-teal" />
              Visit History
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <MessageSquare className="w-4 h-4 mr-2 text-clinic-teal" />
              Message
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
```

The `PatientCard` component needs access to `router` and `clinicId`. Add `useRouter` and `useParams` inside it (or pass via props from the parent). Since `useClinicContext` is already used in the parent, pass `clinicId` as a prop:

Update `PatientCard` props:

```typescript
function PatientCard({ patient, clinicId }: { patient: Patient; clinicId: string }) {
  const router = useRouter();
```

And update the rendering to pass `clinicId`:

```tsx
<PatientCard key={patient.id} patient={patient} clinicId={clinicId} />
```

- [ ] **Step 5: Add list view rendering**

After the existing card grid, add conditional rendering:

```tsx
        {viewMode === 'card' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} clinicId={clinicId} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <PatientRow key={patient.id} patient={patient} clinicId={clinicId} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
```

- [ ] **Step 6: Create `PatientRow` component**

Add a new component in the same file:

```tsx
function PatientRow({ patient, clinicId }: { patient: Patient; clinicId: string }) {
  const router = useRouter();

  const getStatusBadge = () => {
    if (patient.is_active && patient.onboarding_completed) {
      return (
        <span className='flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700'>
          <CheckCircle2 className='w-3 h-3' />
          Active
        </span>
      );
    }
    if (patient.auth_user_id) {
      return (
        <span className='flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700'>
          <Clock className='w-3 h-3' />
          Pending
        </span>
      );
    }
    return (
      <span className='flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600'>
        <UserX className='w-3 h-3' />
        Inactive
      </span>
    );
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-clinic-teal/10 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-clinic-teal" />
          </div>
          <span className="font-semibold text-clinic-navy dark:text-white">
            {patient.first_name} {patient.last_name}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-clinic-text/70 dark:text-white/70">{patient.email}</TableCell>
      <TableCell className="text-clinic-text/70 dark:text-white/70">{patient.phone || '—'}</TableCell>
      <TableCell>{getStatusBadge()}</TableCell>
      <TableCell className="text-clinic-text/50 dark:text-white/50 text-sm">
        {new Date(patient.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon'>
              <MoreVertical className='w-4 h-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/clinic/${clinicId}/patients/${patient.id}/history`)}
            >
              <FileText className="w-4 h-4 mr-2 text-clinic-teal" />
              Visit History
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <MessageSquare className="w-4 h-4 mr-2 text-clinic-teal" />
              Message
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add "src/app/(clinic)/clinic/[clinicId]/patients/page.tsx"
git commit -m "feat: add card/list view toggle and action popover to patients page"
```

---

### Task 10: Final integration verification

- [ ] **Step 1: Verify the complete flow**

Test these scenarios:

1. **Patient books appointment** → activity log shows "appointment_created" entry
2. **Clinic admin confirms** → activity log shows "appointment_confirmed" entry
3. **Patient checks in** → activity log shows "appointment_checked_in" entry
4. **Practitioner marks complete** → activity log shows "appointment_completed" entry
5. **Patient cancels** → activity log shows "appointment_cancelled" entry
6. **Patient reschedules** → activity log shows "appointment_rescheduled" with old/new dates
7. **Patient changes password** → activity log shows "password_changed" (only visible to patient)
8. **Patient history page** → `/patient/history` shows Visit History tab with expandable cards + Activity Log tab
9. **Clinic admin patient history** → `/clinic/[id]/patients/[id]/history` shows same tabs but no password/profile entries
10. **Patients page toggle** → card view ↔ list view, ⋮ popover with "Visit History" link works in both
11. **Dashboard Recent Visits card** → shows last 3 completed/cancelled/no-show appointments

- [ ] **Step 2: Commit any fixes**

```bash
git add -A
git commit -m "fix: integration fixes for activity log and visitation history"
```

---

**Self-review results:**

1. **Spec coverage:** All 9 spec sections have corresponding tasks. Section 1 (database) → Task 1. Section 2 (where logs created) → Task 5. Section 3 (hook) → Task 2. Section 4 (RecentVisitsCard) → Task 7. Section 5 (patient history page) → Task 6. Section 6 (clinic admin history page) → Task 8. Section 7 (patients page toggle) → Task 9. Section 8 (shared components) → Tasks 3-4. Section 9 (formatActivityMessage) → Task 3.

2. **Placeholder scan:** No TBD/TODO found. All code blocks are complete.

3. **Type consistency:** `ActivityLog` interface is defined in Task 2 and used consistently in Tasks 3, 4, 6, 8. `ActivityActionType` values match between Task 1 (SQL) and Task 2 (TypeScript). `formatActivityMessage` signature matches between Task 3 (definition) and Tasks 3-4 (usage). `VisitHistoryCard` props match between Task 4 (definition) and Tasks 6, 8 (usage). `perspective` type is consistently `'patient' | 'clinic_admin' | 'practitioner'` everywhere.
