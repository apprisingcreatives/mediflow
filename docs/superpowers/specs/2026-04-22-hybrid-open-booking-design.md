# Hybrid Open Booking + Optional Clinic Intake

## Goal

Pivot from clinic-gated onboarding to open booking. Patients register independently, browse any clinic, and book appointments without pre-registration. Clinic-specific intake (questions + documents) moves to a post-booking pre-visit step. AI analysis is available both during intake and from the patient dashboard.

## Architecture

Minimal pivot from existing system. Reuse the 3 existing tables (`clinic_onboarding_questions`, `patient_question_responses`, `ai_treatment_predictions`), the AI analysis service, and all clinic admin question/document management. Main changes: remove onboarding gates from booking, add post-booking intake flow, add first-login profile nudge, repurpose the onboarding banner for intake status.

## Tech Stack

Same as current: Supabase Postgres + RLS, Next.js App Router, Anthropic SDK, `pdf-parse`, Supabase Storage.

---

## Registration & Patient Profile

### Registration

Registration stays as-is. The `?clinic=` query param is optional cosmetic context (shows clinic name on register page) but **no longer creates a `patient_clinics` record at activation**. Patient record created after email verification with `onboarding_completed: false, is_active: true`.

### First-Login Profile Nudge

After email verification, redirect to `/patient/profile/setup` — a skippable page with personal info + medical history fields (reuse fields from booking page steps 1-2). "Skip for now" goes to patient dashboard. Completing it sets `onboarding_completed: true`.

### Patient Profile Page

`/patient/settings` (or existing settings route) — always accessible, same fields as setup nudge. Patient can update anytime.

### Key Behavior Change

`onboarding_completed` **no longer gates booking**. It is only a flag indicating whether the patient has filled out their profile.

---

## Booking Flow

### Remove Onboarding Gates

Strip onboarding completion checks from:
- `/book/page.tsx` — currently redirects to onboarding if not completed
- `/clinics/[clinicId]/page.tsx` — currently redirects to onboarding before booking

### Booking Page

Stays 4 steps. Steps 1-2 (personal info, medical history) auto-fill from patient profile if available, editable inline. Step 3 (appointment selection) and step 4 (confirmation) unchanged.

### Post-Booking Redirect

After successful booking, if the clinic has intake questions or required documents, redirect to `/appointments/[appointmentId]/intake`. If no intake configured, show normal confirmation.

### `patient_clinics` Creation

Already happens at booking via upsert in `POST /api/appointments` — no change needed.

---

## Clinic-Configurable Intake

### Clinic Setting

Add `intake_required BOOLEAN DEFAULT false` to `clinics` table. When true, new appointments start with `intake_status = 'pending'` instead of `none`. Clinic admin toggles this in settings.

---

## Pre-Visit Intake

### Intake Page

New page at `/appointments/[appointmentId]/intake`. Shows the clinic's onboarding questions + required documents for that specific appointment. Reuses `PatientOnboarding` component or a simplified version of it.

### Data Model Changes

- Add `appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE` (nullable) to `patient_question_responses`. Existing responses without an appointment are general profile responses. Per-visit responses link to a specific appointment.
- Add `intake_status TEXT DEFAULT 'none' CHECK (intake_status IN ('none', 'pending', 'completed'))` to `appointments` table.

### Intake Submission

When patient submits intake:
1. Upsert `patient_question_responses` with `appointment_id` set
2. Update `appointments.intake_status = 'completed'`
3. Optionally trigger AI analysis

### Dashboard Integration

Patient dashboard shows a card per upcoming appointment with `intake_status = 'pending'`: "Complete pre-visit intake for [Clinic Name] — [Date]" linking to `/appointments/[appointmentId]/intake`. Repurpose the existing `OnboardingBanner` component for this.

### Clinic Admin Visibility

Clinic admin and practitioners see intake status on appointment details — `completed` / `pending` / `none`. Can view submitted responses and documents.

### AI Analysis

Available as a button on the intake page after questions are answered. Same `analyzePatientHealth` service — reused as-is. Also available from patient dashboard as a standalone "Get AI Health Recommendations" feature using profile data + uploaded documents.

---

## Database Changes

### Migration: Modify existing tables

```sql
-- Add intake_required to clinics
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS intake_required BOOLEAN DEFAULT false;

-- Add intake_status to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS intake_status TEXT DEFAULT 'none'
  CHECK (intake_status IN ('none', 'pending', 'completed'));

-- Add appointment_id to patient_question_responses
ALTER TABLE public.patient_question_responses
  ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE;

-- Drop the unique constraint on (patient_id, question_id) — now responses can exist per-appointment
ALTER TABLE public.patient_question_responses
  DROP CONSTRAINT IF EXISTS patient_question_responses_patient_id_question_id_key;

-- Add new unique constraint: one response per question per appointment (or per patient if no appointment)
CREATE UNIQUE INDEX idx_patient_question_responses_unique
  ON public.patient_question_responses (patient_id, question_id, COALESCE(appointment_id, '00000000-0000-0000-0000-000000000000'));
```

### No changes needed to:
- `clinic_onboarding_questions` — stays per-clinic
- `ai_treatment_predictions` — stays per-patient+clinic
- `patient_clinics` — already created at booking
- `patient_documents` — stays per-patient

---

## API Routes

### Keep As-Is
- `GET/POST/PATCH/DELETE /api/clinic/[clinicId]/onboarding/questions/` — clinic admin question CRUD
- `POST /api/clinic/[clinicId]/onboarding/questions/load-template` — template loading
- `POST /api/clinic/[clinicId]/patients/[patientId]/onboarding/analyze` — AI analysis
- `GET/POST /api/clinics` — public clinic listing
- `POST /api/appointments` — appointment creation (modify to set `intake_status`)

### Modify
- `POST /api/appointments` — after creating appointment, if clinic has `intake_required = true`, set `intake_status = 'pending'`

### New
- `GET /api/appointments/[appointmentId]/intake` — fetch intake data (clinic questions, required documents, existing responses, uploaded documents)
- `POST /api/appointments/[appointmentId]/intake` — submit intake responses, update `intake_status`
- `POST /api/appointments/[appointmentId]/intake/documents` — upload documents for this appointment's intake

### Delete
- `GET/POST /api/clinic/[clinicId]/patients/[patientId]/onboarding/route.ts` — replaced by appointment-scoped intake routes
- `POST /api/clinic/[clinicId]/patients/[patientId]/documents/route.ts` — replaced by appointment-scoped document route

---

## Frontend Changes

### New Pages
- `/patient/profile/setup` — first-login profile nudge (skippable), personal info + medical history
- `/appointments/[appointmentId]/intake` — pre-visit intake form with clinic questions + document uploads + AI analysis button

### Modify
- `/book/page.tsx` — remove `onboarding_completed` check, add post-booking redirect to intake page if clinic has intake
- `/clinics/[clinicId]/page.tsx` — remove onboarding redirect from "Book" buttons
- `src/app/auth/email-verified/page.tsx` — redirect to `/patient/profile/setup` instead of clinic-specific onboarding
- `src/components/patient/dashboard/OnboardingBanner.tsx` — repurpose for per-appointment intake status cards
- `src/hooks/use-auth.tsx` — remove `canAccessClinic` (no longer needed)

### Delete
- `/clinic/[clinicId]/patient/onboarding/page.tsx` — clinic-specific onboarding page

---

## RLS Considerations

Current RLS already supports this model:
- `clinics` — publicly readable (no change)
- `practitioners` — publicly readable where `is_active = true` (no change)
- `clinic_services` — publicly readable (no change)
- `appointments` — patients can CRUD own, clinic staff can view their clinic's (no change)
- `patient_clinics` — created at booking, patients see own, clinic staff see their clinic's (no change)

New intake routes use `supabaseAdmin` (service role) with explicit auth checks in route handlers — same pattern as existing routes.

---

## What Gets Deleted

- `src/app/clinic/[clinicId]/patient/onboarding/page.tsx`
- `src/app/api/clinic/[clinicId]/patients/[patientId]/onboarding/route.ts`
- `src/app/api/clinic/[clinicId]/patients/[patientId]/documents/route.ts`
- `canAccessClinic` function and `patientClinicIds` state from `use-auth.tsx`
