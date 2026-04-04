# Appointment Status Flow Design

## Overview

Replace the unrestricted status dropdown in practitioner and clinic admin views with context-aware action buttons that enforce valid state transitions. Add a bidirectional confirmation model where the non-booking party must confirm, and implement automatic no-show detection.

## Status Definitions

| Status | Meaning |
|---|---|
| `scheduled` | Appointment created, awaiting confirmation from the other party |
| `confirmed` | Both parties agree; appointment is locked in |
| `in-progress` | Patient has checked in |
| `completed` | Practitioner/clinic admin marked the visit as done |
| `cancelled` | Patient cancelled the appointment |
| `no-show` | Patient did not show up (manual or automatic) |

## Status Transition Rules

### Valid Transitions

```
scheduled ──► confirmed    (non-booking party confirms)
scheduled ──► cancelled    (patient cancels)

confirmed ──► in-progress  (patient checks in: 15 min before to 30 min after)
confirmed ──► cancelled    (patient cancels, only before appointment time)
confirmed ──► no-show      (manual: 15 min after appointment time, auto: 30 min after)

in-progress ──► completed  (practitioner or clinic admin marks complete)
```

No other transitions are valid. The UI will only show buttons for valid transitions.

### Who Can Do What

| Action | Patient | Practitioner | Clinic Admin |
|---|---|---|---|
| Confirm (if patient booked) | - | Yes | Yes |
| Confirm (if admin booked) | Yes | - | - |
| Cancel | Yes | - | - |
| Check In | Yes | - | - |
| Mark Complete | - | Yes | Yes |
| No Show (manual) | - | Yes | Yes |

## Bidirectional Confirmation Model

### New Database Field

Add `booked_by` column to the `appointments` table:

```sql
ALTER TABLE public.appointments
  ADD COLUMN booked_by TEXT NOT NULL DEFAULT 'patient'
  CHECK (booked_by IN ('patient', 'clinic_admin'));
```

### Flow: Patient Books

1. Patient creates appointment via dashboard booking modal
2. `status = 'scheduled'`, `booked_by = 'patient'`
3. Clinic admin or practitioner sees a **Confirm** button on `scheduled` appointments in their dashboard
4. On confirm: `status = 'confirmed'`

### Flow: Clinic Admin Books

1. Clinic admin creates appointment via appointments page
2. `status = 'scheduled'`, `booked_by = 'clinic_admin'`
3. Patient sees a **Confirm** button on their dashboard for this appointment
4. Patient also receives a confirmation email with a confirm link
5. On confirm: `status = 'confirmed'`

## No-Show Detection

### Manual (Practitioner/Clinic Admin)

- A **No Show** button appears on `confirmed` appointments **15 minutes after** the scheduled appointment time
- Clicking it sets `status = 'no-show'`
- Button is styled as a destructive/warning action

### Automatic

- A Supabase cron job (pg_cron) runs every 5 minutes
- Finds all appointments where:
  - `status = 'confirmed'`
  - `appointment_date` is today or earlier
  - Current time is 30+ minutes past `appointment_time`
- Updates those to `status = 'no-show'`

```sql
-- Cron job query
UPDATE public.appointments
SET status = 'no-show', updated_at = now()
WHERE status = 'confirmed'
  AND (appointment_date < CURRENT_DATE
    OR (appointment_date = CURRENT_DATE
      AND appointment_time + INTERVAL '30 minutes' < CURRENT_TIME));
```

## UI Changes

### Practitioner Appointments View

Replace the status dropdown in the appointment detail modal with contextual buttons:

- **`scheduled` appointment (booked by patient):** Show "Confirm" (green) button
- **`confirmed` appointment:** Show "Mark Complete" button (only when `in-progress`). Before that, no action unless 15 min past → show "No Show" button
- **`in-progress` appointment:** Show "Mark Complete" (green) button
- **`completed` / `cancelled` / `no-show`:** No action buttons (terminal states)

### Clinic Admin Appointments View

Same contextual buttons as practitioner, applied in the edit modal. Remove the free-form status Select dropdown. Replace with:

- **`scheduled` (booked by patient):** "Confirm" button
- **`confirmed`:** No action, or "No Show" after 15 min past appointment time
- **`in-progress`:** "Mark Complete" button
- Terminal states: read-only status badge

### Patient Dashboard

Already partially built. Additions:

- **`scheduled` (booked by clinic admin):** Show "Confirm" button alongside existing "Reschedule" button
- **`scheduled` (booked by patient):** Show "Cancel" button (replaces "Reschedule" since appointment is not yet confirmed)
- **`confirmed`:** Show "Check In" (time-gated, already built), "Reschedule", and "Cancel" (only before appointment time)
- **`in-progress` / `completed` / `cancelled` / `no-show`:** No action buttons

### Cancel Button

- Only visible to patients
- Available on `scheduled` and `confirmed` appointments
- For `confirmed` appointments, only available before the appointment time
- Shows a confirmation dialog before proceeding
- Sets `status = 'cancelled'`

## Migration

### Schema Changes

```sql
-- Add booked_by column
ALTER TABLE public.appointments
  ADD COLUMN booked_by TEXT NOT NULL DEFAULT 'patient'
  CHECK (booked_by IN ('patient', 'clinic_admin'));

-- Backfill existing appointments as patient-booked
-- (already handled by DEFAULT)
```

### Cron Job (pg_cron)

```sql
-- Enable pg_cron extension if not already
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule no-show auto-detection every 5 minutes
SELECT cron.schedule(
  'auto-no-show',
  '*/5 * * * *',
  $$
  UPDATE public.appointments
  SET status = 'no-show', updated_at = now()
  WHERE status = 'confirmed'
    AND (appointment_date < CURRENT_DATE
      OR (appointment_date = CURRENT_DATE
        AND appointment_time + INTERVAL '30 minutes' < CURRENT_TIME));
  $$
);
```

## Files to Modify

### Database
- New migration: `booked_by` column + cron job for auto no-show

### Backend / Hooks
- `useUpdateAppointment.ts` — no changes needed (already has `updateStatus`, `cancelAppointment`)
- `usePractitionerDashboard.ts` — no changes needed (already has `updateAppointmentStatus`)
- Patient booking hook (`usePatientBooking.ts`) — set `booked_by: 'patient'` on insert
- Clinic admin appointment creation — set `booked_by: 'clinic_admin'` on insert

### Frontend
- `src/app/(clinic)/clinic/[clinicId]/appointments/page.tsx` — replace status dropdown with action buttons
- `src/app/(practitioner)/practitioner/[practitionerId]/clinic/[clinicId]/appointments/page.tsx` — replace status dropdown with action buttons
- `src/components/patient/dashboard/UpcomingAppointments.tsx` — add Confirm and Cancel buttons based on `booked_by`
- `src/components/appointments/AppointmentFormModal.tsx` — remove status Select, add contextual buttons

### Email
- Send confirmation email to patient when clinic admin books (with confirm link)

## Out of Scope

- Notification system (push/in-app notifications for status changes)
- SMS notifications
- Practitioner or clinic admin cancellation (only patient can cancel in v1)
- Rescheduling by practitioner/clinic admin (only patient can reschedule in v1)
