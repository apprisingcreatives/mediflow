# Clinic Notification Settings — Design Spec

**Date:** 2026-04-05
**Status:** Approved

## Goal

Make the clinic settings notification toggles functional so clinic admins can control whether their clinic sends email notifications and appointment reminders to patients.

## Scope

Two toggles:
- **Email Notifications** — controls whether patients receive confirmation and update emails when appointments are created or changed
- **Appointment Reminders** — controls whether patients receive 24hr reminder and appointment-start emails

SMS Notifications and Marketing Emails toggles are removed from the UI (no infrastructure exists for them).

## Database

### Migration: Add columns to `clinics` table

```sql
ALTER TABLE public.clinics
  ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true,
  ADD COLUMN appointment_reminders_enabled BOOLEAN DEFAULT true;
```

Both default to `true` so existing clinics retain current behavior.

### Type Update

Add to `Clinic` interface in `src/types/database.ts`:
- `email_notifications_enabled: boolean`
- `appointment_reminders_enabled: boolean`

## Enforcement Points

### 1. Confirmation & Update Emails (`notify_appointment_email` trigger)

The existing `notify_appointment_email()` PL/pgSQL trigger fires on INSERT/UPDATE to the `appointments` table. It currently inserts into `email_notifications` unconditionally.

**Change:** Before inserting, JOIN to `clinics` and check `email_notifications_enabled`. If `false`, skip the insert — no email gets queued.

### 2. 24hr Reminders (`check_24hr_reminders` function)

The existing function queries upcoming appointments and queues reminder emails.

**Change:** Add `JOIN clinics c ON a.clinic_id = c.id` and filter with `AND c.appointment_reminders_enabled = true`. Appointments at clinics with reminders disabled are skipped.

### 3. Appointment Start Notifications (`check_appointment_start_notifications` function)

Same pattern as 24hr reminders.

**Change:** Add the same clinic JOIN and `appointment_reminders_enabled = true` filter.

## API

### `PATCH /api/clinic/[clinicId]/settings`

**Auth:** Authenticated user must be the clinic's admin (`user_metadata.clinic_id === clinicId`).

**Request body:**
```json
{
  "name": "string (optional)",
  "email": "string (optional)",
  "email_notifications_enabled": "boolean (optional)",
  "appointment_reminders_enabled": "boolean (optional)"
}
```

**Behavior:** Updates the `clinics` table with provided fields. Returns the updated clinic record.

**Validation:** If `email_notifications_enabled` is `false` and `appointment_reminders_enabled` is `true`, force `appointment_reminders_enabled` to `false` (reminders are emails — can't send reminders if emails are off).

## UI

### Settings Page (`src/app/(clinic)/clinic/[clinicId]/settings/page.tsx`)

**Changes:**
- Remove SMS Notifications and Marketing Emails toggles
- Initialize toggle state from `clinic.email_notifications_enabled` and `clinic.appointment_reminders_enabled`
- When Email Notifications is toggled off, auto-disable and grey out Appointment Reminders
- Wire Save button to `PATCH /api/clinic/[clinicId]/settings` with clinic name, email, and notification settings
- Show success/error toast after save
- Also wire the Clinic Information fields (name, email) to the same API call since they are currently a stub

## Files to Create

- `src/app/api/clinic/[clinicId]/settings/route.ts` — PATCH endpoint

## Files to Modify

- `src/types/database.ts` — add two boolean fields to Clinic interface
- `src/app/(clinic)/clinic/[clinicId]/settings/page.tsx` — wire toggles and save
- `supabase/migrations/` — new migration for columns + updated PL/pgSQL functions
