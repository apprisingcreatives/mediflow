# Activity Log & Visitation History Design

## Goal

Add an append-only activity log that tracks all actions affecting a patient, and surface visitation history with per-appointment timelines across all three roles (patient, clinic admin, practitioner).

## Scope

This spec covers **Sub-project A** only: activity log + visitation history. Patient dashboard sidebar redesign is a separate sub-project.

---

## 1. Database: `activity_logs` Table

Single polymorphic table. One row per action (append-only, never updated).

```sql
activity_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES patients(id),
  clinic_id       UUID REFERENCES clinics(id),         -- NULL for account-level actions (password, profile)
  actor_id        UUID NOT NULL,                        -- auth.uid() of who performed the action
  actor_role      TEXT NOT NULL CHECK (actor_role IN ('patient', 'clinic_admin', 'practitioner', 'system')),
  action_type     TEXT NOT NULL,
  entity_type     TEXT,                                 -- 'appointment', 'patient', 'account'
  entity_id       UUID,                                 -- FK to the related entity (e.g. appointment id)
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now()
)
```

### Action Types

**Booking lifecycle:**
- `appointment_created` — metadata: `{ "practitioner_name": "...", "service_name": "...", "date": "...", "time": "..." }`
- `appointment_confirmed` — metadata: `{ "confirmed_by": "..." }`
- `appointment_cancelled` — metadata: `{ "cancelled_by": "..." }`
- `appointment_rescheduled` — metadata: `{ "old_date": "...", "old_time": "...", "new_date": "...", "new_time": "..." }`
- `appointment_checked_in` — metadata: `{}`
- `appointment_completed` — metadata: `{ "completed_by": "..." }`
- `appointment_no_show` — metadata: `{ "source": "manual" | "auto" }`

**Account actions:**
- `password_changed` — metadata: `{}`
- `profile_updated` — metadata: `{ "fields_changed": ["phone", "address", ...] }`

### Indexes

- `(patient_id, created_at DESC)` — primary query pattern for patient timeline
- `(entity_id, created_at ASC)` — per-appointment timeline
- `(clinic_id, patient_id, created_at DESC)` — clinic-scoped patient activity

### RLS Policies

- **Patient:** Can read own logs (`patient_id` matches their patient record). Can insert own actions.
- **Clinic admin:** Can read logs where `clinic_id` matches their clinic AND `action_type NOT IN ('password_changed', 'profile_updated')`. Can insert booking-related actions.
- **Practitioner:** Same as clinic admin — can read clinic-scoped booking logs only. Can insert booking-related actions.
- **System (pg_cron):** Inserts `appointment_no_show` with `actor_role = 'system'`.

---

## 2. Where Activity Logs Are Created

Logs are inserted at the application layer alongside the existing action. No database triggers.

| Action | File | Actor Role |
|--------|------|------------|
| Appointment created (patient) | `usePatientBooking.ts`, `POST /api/appointments/route.ts` | patient |
| Appointment created (clinic admin) | `useCreateAppointment.ts` | clinic_admin |
| Appointment confirmed | `AppointmentActions.tsx` (updateStatus) | whoever confirms |
| Appointment cancelled | `AppointmentActions.tsx` (updateStatus) | patient |
| Appointment rescheduled | `RescheduleModal.tsx` | patient |
| Appointment checked in | `UpcomingAppointments.tsx` (handleCheckIn), checkin API | patient |
| Appointment completed | `AppointmentActions.tsx` (updateStatus) | practitioner or clinic_admin |
| Appointment no-show (manual) | `AppointmentActions.tsx` (updateStatus) | practitioner or clinic_admin |
| Appointment no-show (auto) | pg_cron job (update existing cron SQL) | system |
| Password changed | `ChangePasswordForm.tsx` | patient |
| Profile updated | Patient profile update handler | patient |

Each log insertion is a single `supabase.from('activity_logs').insert(...)` call added alongside the existing action code. No new API routes needed.

---

## 3. Shared Hook: `useActivityLogs`

A reusable hook for fetching activity logs with two query modes:

- **By patient:** `fetchLogs({ patientId, clinicId? })` — returns all logs for a patient, optionally scoped to a clinic
- **By entity:** `fetchLogs({ entityId })` — returns logs for a specific appointment (per-appointment timeline)

The hook handles role-based filtering: when called by a clinic admin or practitioner, the query automatically excludes `password_changed` and `profile_updated` action types via the RLS policy.

---

## 4. Patient Dashboard: "Recent Visits" Card

A new `RecentVisitsCard` component placed below "Upcoming Appointments" on the patient dashboard.

- Shows last 3 past appointments (status in `completed`, `cancelled`, `no-show`)
- Each row: date, practitioner name, service name, status badge
- "View All →" link navigates to `/patient/history`
- Queries `appointments` table filtered by patient, ordered by `appointment_date DESC`

---

## 5. Patient History Page (`/patient/history`)

Dedicated page with two tabs:

### Tab 1: Visit History

- Lists all past appointments (all statuses) ordered by date descending
- Each visit is an expandable card showing:
  - **Header:** Practitioner avatar + name, service, date/time, clinic name, status badge
  - **Collapsed:** Just the header row
  - **Expanded:** Details grid (service, duration, clinic, booked by), doctor's notes section, and per-appointment activity timeline
- Per-appointment timeline: fetched from `activity_logs` filtered by `entity_id = appointment.id`, ordered by `created_at ASC`

### Tab 2: Activity Log

- Full chronological timeline of all activity (including `password_changed`, `profile_updated`)
- Each entry: color-coded dot, timestamp, human-readable description
- Color coding by action type:
  - Green: completed, checked in
  - Blue: confirmed
  - Purple: created, password changed
  - Orange/yellow: rescheduled, profile updated
  - Red: cancelled
  - Gray: no-show

---

## 6. Clinic Admin / Practitioner: Patient History Page

Route: `/clinic/[clinicId]/patients/[patientId]/history`

Accessible from:
- **Patients page** — ⋮ popover menu on patient card/row → "Visit History"
- **Appointment modals** — could link patient name to this page in the future

### Page Layout

- **Patient header:** Avatar, name, email, phone, total visits count, last visit date
- **Two tabs:** Visit History and Activity Log (same layout as patient's page)
- **Visibility:** Only booking-related actions visible (no `password_changed` or `profile_updated`). Enforced by RLS.
- **Scope:** Only shows appointments and activity at the current clinic (`clinic_id` filter)

---

## 7. Patients Page: Card/List View Toggle

Add a view toggle to the existing patients page at `/clinic/[clinicId]/patients/`.

### Card View (existing, enhanced)

- Current card grid layout preserved
- ⋮ button gets a popover (using shadcn `Popover` or `DropdownMenu`) with:
  - "Visit History" — navigates to `/clinic/[clinicId]/patients/[patientId]/history`
  - "Message" — placeholder for future messaging feature

### List View (new)

- Table layout with columns: Patient (avatar + name), Email, Phone, Status, Added date, Actions (⋮)
- Same ⋮ popover as card view
- Sortable columns (name, date added)

### View Toggle

- Two icon buttons (grid/list) in the page header, next to search and "Add Patient"
- Persisted in local state (no need for server persistence)

---

## 8. Shared Components

### `ActivityTimeline`

Renders a vertical timeline of activity log entries. Used in:
- Visit History expanded cards (per-appointment timeline)
- Activity Log tab (full patient timeline)
- Patient history page for clinic admin/practitioner

Props: `logs: ActivityLog[]`, `perspective?: 'patient' | 'clinic_admin' | 'practitioner'`

The `perspective` prop controls first-person vs third-person language:
- Patient sees: "You booked an appointment", "You checked in"
- Clinic admin/practitioner sees: "Maria Santos booked an appointment", "Patient checked in"

### `VisitHistoryCard`

Expandable card showing a single past appointment with details, notes, and embedded `ActivityTimeline`.

Props: `appointment: Appointment`, `logs: ActivityLog[]`, `perspective`

---

## 9. Helper: `formatActivityMessage`

Pure function that converts an `ActivityLog` entry into a human-readable string based on `action_type`, `metadata`, and `perspective`.

Examples:
- `appointment_created` + patient perspective → "You booked an appointment — General Checkup with Dr. Smith at City Clinic on Apr 1"
- `appointment_confirmed` + clinic_admin perspective → "Confirmed by Dr. Smith"
- `appointment_rescheduled` + patient perspective → "You rescheduled — moved from Feb 25 to Mar 2"
- `password_changed` + patient perspective → "You changed your password"
