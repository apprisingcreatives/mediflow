# Appointment Status Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace unrestricted status dropdowns with context-aware action buttons, add bidirectional confirmation, and implement automatic no-show detection.

**Architecture:** Add `booked_by` column to track who created the appointment. Replace status dropdowns in practitioner and clinic admin views with contextual action buttons based on current status + time conditions. Add pg_cron job for automatic no-show marking after 30 minutes.

**Tech Stack:** Supabase (PostgreSQL, pg_cron), Next.js, React, TypeScript

**Spec:** `docs/superpowers/specs/2026-04-04-appointment-status-flow-design.md`

---

### Task 1: Add `booked_by` column and pg_cron job

**Files:**
- Create: `supabase/migrations/20260405000002_appointment_status_flow.sql`

- [ ] **Step 1: Create migration file**

```sql
-- =============================================================================
-- Appointment Status Flow: booked_by column + auto no-show cron
-- =============================================================================

-- 1. Add booked_by column to track who created the appointment
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS booked_by TEXT NOT NULL DEFAULT 'patient'
  CHECK (booked_by IN ('patient', 'clinic_admin'));

-- 2. Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- 3. Schedule auto no-show detection every 5 minutes
-- Marks confirmed appointments as no-show if 30+ minutes past appointment time
SELECT cron.schedule(
  'auto-no-show-detection',
  '*/5 * * * *',
  $$
  UPDATE public.appointments
  SET status = 'no-show', updated_at = now()
  WHERE status = 'confirmed'
    AND (
      appointment_date < CURRENT_DATE
      OR (
        appointment_date = CURRENT_DATE
        AND appointment_time + INTERVAL '30 minutes' < CURRENT_TIME
      )
    );
  $$
);
```

- [ ] **Step 2: Apply migration to local Supabase**

Run: `PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f supabase/migrations/20260405000002_appointment_status_flow.sql`

Expected: `ALTER TABLE`, `CREATE EXTENSION`, `schedule` output with no errors.

- [ ] **Step 3: Verify column exists and cron is scheduled**

Run: `PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'booked_by';"` and `PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT jobname, schedule, command FROM cron.job;"`

Expected: `booked_by` column with default `'patient'`, and `auto-no-show-detection` job listed.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260405000002_appointment_status_flow.sql
git commit -m "feat: add booked_by column and pg_cron auto no-show detection"
```

---

### Task 2: Set `booked_by` on appointment creation

**Files:**
- Modify: `src/hooks/useCreateAppointment.ts:104-177` (createAppointment function)
- Modify: `src/hooks/usePatientBooking.ts:200-210` (insert statement)
- Modify: `src/app/api/appointments/route.ts:93-107` (API insert)

- [ ] **Step 1: Update `CreateAppointmentParams` interface and insert in `useCreateAppointment.ts`**

In `src/hooks/useCreateAppointment.ts`, add `booked_by` to the interface (line 13-21):

```typescript
interface CreateAppointmentParams {
  clinicId: string;
  patientId: string;
  practitionerId: string;
  serviceId: string;
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
  status?: AppointmentStatus;
  bookedBy?: 'patient' | 'clinic_admin';
}
```

Then in the insert call (around line 166-177), add `booked_by`:

```typescript
        const { data, error: insertError } = await supabase
          .from('appointments')
          .insert({
            clinic_id: clinicId,
            patient_id: patientId,
            practitioner_id: practitionerId,
            service_id: serviceId,
            appointment_date: appointmentDate,
            appointment_time: appointmentTime,
            notes: notes || null,
            status,
            booked_by: bookedBy || 'patient',
          })
```

- [ ] **Step 2: Update `usePatientBooking.ts` insert to set `booked_by: 'patient'`**

In `src/hooks/usePatientBooking.ts` (lines 201-210), add `booked_by`:

```typescript
        const { error: insertError } = await supabase.from('appointments').insert({
          clinic_id: selectedClinicId,
          patient_id: patientId,
          practitioner_id: selectedPractitionerId,
          service_id: selectedServiceId,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: selectedTime,
          notes: notes || null,
          status: 'scheduled',
          booked_by: 'patient',
        });
```

- [ ] **Step 3: Update API route insert to set `booked_by: 'patient'`**

In `src/app/api/appointments/route.ts` (lines 94-107), add `booked_by`:

```typescript
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        patient_id: patient.id,
        clinic_id: clinic_id || null,
        practitioner_id: practitioner_id || null,
        service_id: service_id || null,
        appointment_date,
        appointment_time,
        status: 'scheduled',
        notes: notes || null,
        booked_by: 'patient',
      })
      .select()
      .single();
```

- [ ] **Step 4: Update clinic admin form submit to pass `bookedBy: 'clinic_admin'`**

In `src/app/(clinic)/clinic/[clinicId]/appointments/page.tsx` (lines 204-213), add `bookedBy`:

```typescript
        await createAppointment({
          clinicId,
          patientId: data.patientId,
          practitionerId: data.practitionerId,
          serviceId: data.serviceId,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
          notes: data.notes,
          bookedBy: 'clinic_admin',
        });
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useCreateAppointment.ts src/hooks/usePatientBooking.ts src/app/api/appointments/route.ts "src/app/(clinic)/clinic/[clinicId]/appointments/page.tsx"
git commit -m "feat: set booked_by field on appointment creation"
```

---

### Task 3: Update `Appointment` type to include `booked_by`

**Files:**
- Modify: `src/hooks/useGetAppointments.ts` (Appointment type)

- [ ] **Step 1: Add `booked_by` to Appointment interface**

In `src/hooks/useGetAppointments.ts`, find the `Appointment` interface and add:

```typescript
  booked_by: 'patient' | 'clinic_admin';
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useGetAppointments.ts
git commit -m "feat: add booked_by to Appointment type"
```

---

### Task 4: Create shared `AppointmentActions` component

This component renders the correct action buttons based on appointment status, `booked_by`, time conditions, and viewer role.

**Files:**
- Create: `src/components/appointments/AppointmentActions.tsx`

- [ ] **Step 1: Create the component**

```tsx
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
    // Past dates are always "past"
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
  // Patient booked → practitioner/clinic_admin confirms
  // Clinic admin booked → patient confirms
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
  // Only practitioner/clinic_admin, only when in-progress
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
  // Practitioner/clinic_admin, only on confirmed, 15+ min past appointment time
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
  // Only patients, on scheduled or confirmed (before appointment time)
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
```

- [ ] **Step 2: Verify the AlertDialog component exists**

Run: `ls src/components/ui/alert-dialog.tsx`

If it doesn't exist, install it: `npx shadcn@latest add alert-dialog`

- [ ] **Step 3: Commit**

```bash
git add src/components/appointments/AppointmentActions.tsx
git commit -m "feat: add AppointmentActions component with context-aware buttons"
```

---

### Task 5: Update patient appointment card to use `AppointmentActions`

**Files:**
- Modify: `src/components/patient/dashboard/UpcomingAppointments.tsx:112-230`

- [ ] **Step 1: Replace the action buttons section in AppointmentCard**

In `src/components/patient/dashboard/UpcomingAppointments.tsx`, add import at top:

```typescript
import { AppointmentActions } from '@/components/appointments/AppointmentActions';
```

Then replace the buttons `<div>` (lines 189-223) and the RescheduleModal section with:

```tsx
      <div className="flex flex-col gap-2">
        {/* Check In button - patient only, time-gated */}
        {isCheckedIn ? (
          <Button size="sm" disabled className="bg-green-500 text-white">
            <CheckCircle className="w-4 h-4 mr-1" />
            Checked In
          </Button>
        ) : ['scheduled', 'confirmed'].includes(appointment.status) ? (
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

      <RescheduleModal
        appointment={appointment}
        isOpen={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
      />
```

Also update the `canCheckIn` logic to only work on `confirmed` appointments (not `scheduled`):

```typescript
  const canCheckIn =
    appointment.status === 'confirmed' &&
    isWithinCheckInWindow(appointment.appointment_date, appointment.appointment_time);
```

- [ ] **Step 2: Commit**

```bash
git add src/components/patient/dashboard/UpcomingAppointments.tsx
git commit -m "feat: add context-aware actions to patient appointment cards"
```

---

### Task 6: Replace status dropdown in clinic admin appointment form modal

**Files:**
- Modify: `src/components/appointments/AppointmentFormModal.tsx:555-581`

- [ ] **Step 1: Replace the status Select with AppointmentActions**

In `src/components/appointments/AppointmentFormModal.tsx`, add import at top:

```typescript
import { AppointmentActions } from './AppointmentActions';
```

Replace the status `Select` block (lines 555-581):

```tsx
          {/* Status Actions (Edit mode only) */}
          {mode === "edit" && appointment && (
            <div className='space-y-2'>
              <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
                Status
              </Label>
              <div className='flex items-center gap-3'>
                <span
                  className={cn("px-2.5 py-1 rounded-full text-xs font-medium", getStatusColor(appointment.status))}
                >
                  {appointment.status}
                </span>
                <AppointmentActions
                  appointment={appointment}
                  viewerRole="clinic_admin"
                  layout="row"
                />
              </div>
            </div>
          )}
```

Remove the `APPOINTMENT_STATUSES` constant and the `status` state variable if they are no longer used elsewhere in the component. Also remove the `setStatus` and related imports that are no longer needed.

- [ ] **Step 2: Remove unused status state from form**

Find where `status` state is declared (should be something like `const [status, setStatus] = useState<AppointmentStatus>(...)`) and remove it. Also remove `status` from the `handleSubmit` data if the form was passing it.

- [ ] **Step 3: Commit**

```bash
git add src/components/appointments/AppointmentFormModal.tsx
git commit -m "feat: replace status dropdown with action buttons in clinic admin modal"
```

---

### Task 7: Replace status dropdown in practitioner appointment detail modal

**Files:**
- Modify: `src/components/clinic/practitioners/PractitionerAppointments.tsx:631-654`

- [ ] **Step 1: Replace the status Select with AppointmentActions**

In `src/components/clinic/practitioners/PractitionerAppointments.tsx`, add import at top:

```typescript
import { AppointmentActions } from '@/components/appointments/AppointmentActions';
```

Replace the status update section (lines 631-654):

```tsx
              {/* Status Actions */}
              <div className="space-y-3">
                <h4 className="font-semibold text-clinic-navy dark:text-white">
                  Status
                </h4>
                <div className="flex items-center gap-3">
                  <span
                    className={cn("px-2.5 py-1 rounded-full text-xs font-medium", getStatusColor(selectedAppointment.status))}
                  >
                    {selectedAppointment.status}
                  </span>
                  <AppointmentActions
                    appointment={selectedAppointment}
                    viewerRole="practitioner"
                    layout="row"
                  />
                </div>
              </div>
```

Remove the `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` imports if they are no longer used elsewhere in the component. Also remove the `APPOINTMENT_STATUSES` import/constant if unused.

- [ ] **Step 2: Remove the old `handleStatusUpdate` function if no longer needed**

The old function called `onStatusChange(appointmentId, newStatus)` — the `AppointmentActions` component handles this internally via direct Supabase calls + realtime. Remove the function and its dependencies if unused.

- [ ] **Step 3: Commit**

```bash
git add src/components/clinic/practitioners/PractitionerAppointments.tsx
git commit -m "feat: replace status dropdown with action buttons in practitioner modal"
```

---

### Task 8: Update check-in to require `confirmed` status

**Files:**
- Modify: `src/components/patient/dashboard/UpcomingAppointments.tsx` (already done in Task 5)
- Modify: `src/app/api/appointments/[appointmentId]/checkin/route.ts:70`

- [ ] **Step 1: Update API check-in to only accept `confirmed` status**

In `src/app/api/appointments/[appointmentId]/checkin/route.ts`, update the status check on line 70:

Change:
```typescript
    if (!['scheduled', 'confirmed'].includes(appointment.status)) {
```

To:
```typescript
    if (appointment.status !== 'confirmed') {
```

Do the same for the POST handler on line 164:

Change:
```typescript
    if (!['scheduled', 'confirmed'].includes(appointment.status)) {
```

To:
```typescript
    if (appointment.status !== 'confirmed') {
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/api/appointments/[appointmentId]/checkin/route.ts"
git commit -m "fix: restrict check-in to confirmed appointments only"
```

---

### Task 9: Final integration test and cleanup

- [ ] **Step 1: Verify the complete flow works**

Test these scenarios manually:

1. **Patient books** → appointment shows as `scheduled` → clinic admin/practitioner sees "Confirm" button → confirm → status changes to `confirmed`
2. **Clinic admin books** → appointment shows as `scheduled` → patient sees "Confirm" button on dashboard → confirm → status changes to `confirmed`
3. **Confirmed appointment** → patient checks in (within time window) → status changes to `in-progress` → practitioner clicks "Mark Complete" → status changes to `completed`
4. **No-show (manual)** → confirmed appointment, 15+ min past time → practitioner/admin sees "No Show" button → click → confirmation dialog → status changes to `no-show`
5. **Cancel** → patient clicks "Cancel" on scheduled/confirmed appointment → confirmation dialog → status changes to `cancelled`
6. **Check-in disabled** → scheduled (unconfirmed) appointment → check-in button is disabled

- [ ] **Step 2: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: complete appointment status flow with context-aware actions"
```
