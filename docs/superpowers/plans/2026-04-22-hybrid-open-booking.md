# Hybrid Open Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivot from clinic-gated onboarding to open booking with optional post-booking clinic intake.

**Architecture:** Remove onboarding gates from booking flow, add `intake_status` to appointments, create appointment-scoped intake page and API routes, add skippable profile setup after registration. Reuse existing clinic questions, documents, and AI analysis infrastructure.

**Tech Stack:** Supabase Postgres + RLS, Next.js App Router, Anthropic SDK, `pdf-parse`, Supabase Storage

---

## File Structure

### New Files
- `supabase/migrations/20260422000001_add_intake_columns.sql` — add `intake_required` to clinics, `intake_status` to appointments, `appointment_id` to patient_question_responses
- `src/app/(dashboard)/patient/profile/setup/page.tsx` — first-login profile nudge (skippable)
- `src/app/appointments/[appointmentId]/intake/page.tsx` — pre-visit intake form
- `src/app/api/appointments/[appointmentId]/intake/route.ts` — GET/POST intake data
- `src/app/api/appointments/[appointmentId]/intake/documents/route.ts` — upload documents for intake
- `src/components/patient/dashboard/IntakeBanner.tsx` — per-appointment intake status card

### Modified Files
- `src/types/database.ts` — add `intake_required` to Clinic, `intake_status` to Appointment
- `src/hooks/useBookingForm.ts` — remove onboarding gate
- `src/app/clinics/[clinicId]/page.tsx` — remove onboarding redirect from Book buttons
- `src/app/api/appointments/route.ts` — set `intake_status` based on clinic's `intake_required`
- `src/app/auth/email-verified/page.tsx` — redirect to `/patient/profile/setup`
- `src/app/api/auth/activate/route.ts` — remove `patient_clinics` creation
- `src/components/patient/patient-onboarding.tsx` — add `appointmentId` prop for intake mode
- `src/app/(dashboard)/patient/page.tsx` — replace OnboardingBanner with IntakeBanner
- `src/hooks/use-auth.tsx` — remove `canAccessClinic`, `patientClinicIds`, `fetchPatientClinics`
- `src/hooks/useBookingForm.ts` — store appointment ID, redirect to intake after booking

### Files to Delete
- `src/app/clinic/[clinicId]/patient/onboarding/page.tsx`
- `src/app/api/clinic/[clinicId]/patients/[patientId]/onboarding/route.ts`
- `src/app/api/clinic/[clinicId]/patients/[patientId]/documents/route.ts`
- `src/components/patient/dashboard/OnboardingBanner.tsx`

---

### Task 1: Database migration

**Files:**
- Create: `supabase/migrations/20260422000001_add_intake_columns.sql`

- [ ] **Step 1: Write the migration**

```sql
-- =============================================================================
-- Add intake columns to clinics, appointments, and patient_question_responses
-- Supports hybrid open booking + optional clinic intake
-- =============================================================================

-- Clinic setting: whether intake is required before appointments
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS intake_required BOOLEAN DEFAULT false;

-- Appointment intake status
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS intake_status TEXT DEFAULT 'none'
  CHECK (intake_status IN ('none', 'pending', 'completed'));

-- Link question responses to specific appointments (nullable = general profile responses)
ALTER TABLE public.patient_question_responses
  ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE;

-- Drop old unique constraint (patient_id, question_id) — responses can now exist per-appointment
ALTER TABLE public.patient_question_responses
  DROP CONSTRAINT IF EXISTS patient_question_responses_patient_id_question_id_key;

-- New unique constraint: one response per question per appointment (or per patient if no appointment)
CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_question_responses_unique
  ON public.patient_question_responses (patient_id, question_id, COALESCE(appointment_id, '00000000-0000-0000-0000-000000000000'));

-- Index for looking up responses by appointment
CREATE INDEX IF NOT EXISTS idx_patient_question_responses_appointment
  ON public.patient_question_responses (appointment_id)
  WHERE appointment_id IS NOT NULL;
```

- [ ] **Step 2: Apply the migration locally**

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f supabase/migrations/20260422000001_add_intake_columns.sql
```

Expected: ALTER TABLE (x3), CREATE INDEX (x2), plus constraint changes

- [ ] **Step 3: Verify columns exist**

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE (table_name = 'clinics' AND column_name = 'intake_required')
   OR (table_name = 'appointments' AND column_name = 'intake_status')
   OR (table_name = 'patient_question_responses' AND column_name = 'appointment_id')
ORDER BY table_name;"
```

Expected: 3 rows

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260422000001_add_intake_columns.sql
git commit -m "feat: add intake_required, intake_status, and appointment_id columns"
```

---

### Task 2: Update TypeScript types

**Files:**
- Modify: `src/types/database.ts`

- [ ] **Step 1: Read the types file**

Read `src/types/database.ts` to find the Clinic and Appointment interfaces.

- [ ] **Step 2: Add `intake_required` to Clinic interface**

After the `appointment_reminders_enabled: boolean;` line (the last field before the closing `}` of the Clinic interface), add:

```typescript
  intake_required: boolean;
```

- [ ] **Step 3: Add `intake_status` to Appointment interface**

After the `ai_recommendation_reason: string | null;` line in the Appointment interface, add:

```typescript
  intake_status: 'none' | 'pending' | 'completed';
```

- [ ] **Step 4: Commit**

```bash
git add src/types/database.ts
git commit -m "feat: add intake_required and intake_status to TypeScript types"
```

---

### Task 3: Remove onboarding gates from booking flow

**Files:**
- Modify: `src/hooks/useBookingForm.ts`
- Modify: `src/app/clinics/[clinicId]/page.tsx`

- [ ] **Step 1: Read `src/hooks/useBookingForm.ts`**

Read the file to find the `checkAuthAndOnboarding` function around line 146.

- [ ] **Step 2: Remove onboarding check from booking hook**

In `src/hooks/useBookingForm.ts`, replace the `checkAuthAndOnboarding` function. Remove the onboarding check block — keep only the auth check:

Replace:
```typescript
  const checkAuthAndOnboarding = useCallback(() => {
    if (!user) {
      const currentUrl = window.location.href;
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return false;
    }

    if (patient && !patient.onboarding_completed) {
      const currentUrl = window.location.href;
      router.push(
        `/patient/onboarding?redirect=${encodeURIComponent(currentUrl)}`,
      );
      return false;
    }

    return true;
  }, [user, patient, router]);
```

With:
```typescript
  const checkAuth = useCallback(() => {
    if (!user) {
      const currentUrl = window.location.href;
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return false;
    }

    return true;
  }, [user, router]);
```

Also update the reference in `handleNext` — replace `checkAuthAndOnboarding` with `checkAuth`:

Replace:
```typescript
    if (currentStep === 1 && !checkAuthAndOnboarding()) {
```
With:
```typescript
    if (currentStep === 1 && !checkAuth()) {
```

And update the dependency array of `handleNext` from `checkAuthAndOnboarding` to `checkAuth`.

- [ ] **Step 3: Read `src/app/clinics/[clinicId]/page.tsx`**

Read the file to find the `handleBooking` function around line 43.

- [ ] **Step 4: Remove onboarding redirect from clinic detail page**

In `src/app/clinics/[clinicId]/page.tsx`, inside the `handleBooking` function, remove the onboarding check block:

Remove these lines:
```typescript
    // If patient hasn't completed onboarding, redirect to onboarding
    if (patient && !patient.onboarding_completed) {
      router.push(
        `/patient/onboarding?redirect=${encodeURIComponent(bookingUrl)}`,
      );
      return;
    }
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useBookingForm.ts "src/app/clinics/[clinicId]/page.tsx"
git commit -m "feat: remove onboarding gates from booking flow"
```

---

### Task 4: Update activation and email-verified redirect

**Files:**
- Modify: `src/app/api/auth/activate/route.ts`
- Modify: `src/app/auth/email-verified/page.tsx`

- [ ] **Step 1: Read `src/app/api/auth/activate/route.ts`**

Read the file fully.

- [ ] **Step 2: Remove patient_clinics creation from activation**

In `src/app/api/auth/activate/route.ts`, remove the entire block that creates a `patient_clinics` record (around lines 69-82):

Remove:
```typescript
    // Associate patient with clinic if provided
    if (clinicId) {
      const { error: clinicError } = await supabaseAdmin
        .from('patient_clinics')
        .insert({
          patient_id: patient.id,
          clinic_id: clinicId,
        });

      if (clinicError) {
        console.error('Error associating patient with clinic:', clinicError);
        // Non-fatal — patient is created, clinic link can be added later
      }
    }
```

Also remove the `clinicId` extraction from headers if it exists (the `const clinicId = request.headers.get('x-clinic-id');` line). The clinic association now only happens at booking time.

- [ ] **Step 3: Read `src/app/auth/email-verified/page.tsx`**

Read the file fully.

- [ ] **Step 4: Update redirect to profile setup**

In `src/app/auth/email-verified/page.tsx`, replace the redirect logic (around lines 89-95):

Replace:
```typescript
          // Redirect to clinic-specific onboarding after a short delay
          const onboardingPath = clinicId
            ? `/clinic/${clinicId}/patient/onboarding`
            : '/patient';
          setTimeout(() => {
            router.push(onboardingPath);
          }, 2000);
```

With:
```typescript
          setTimeout(() => {
            router.push('/patient/profile/setup');
          }, 2000);
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/activate/route.ts src/app/auth/email-verified/page.tsx
git commit -m "feat: remove clinic association from activation, redirect to profile setup"
```

---

### Task 5: Create patient profile setup page

**Files:**
- Create: `src/app/(dashboard)/patient/profile/setup/page.tsx`

- [ ] **Step 1: Read existing patient settings page for style reference**

Read `src/app/(dashboard)/patient/settings/page.tsx` to understand the layout pattern and styling used in patient pages.

- [ ] **Step 2: Read the booking form for field reference**

Read `src/components/appointments/patientBooking/PersonalInfoStep.tsx` and `src/components/appointments/patientBooking/MedicalHistoryStep.tsx` (or similar step components) to understand what fields are used in booking steps 1-2. If those files don't exist, read `src/hooks/useBookingForm.ts` to see the `formData` fields.

- [ ] **Step 3: Create the profile setup page**

Create `src/app/(dashboard)/patient/profile/setup/page.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user, patient, isLoading: authLoading, refreshPatient } = useAuth();

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    blood_type: '',
    allergies: '',
    chronic_conditions: '',
    current_medications: '',
    medical_notes: '',
    insurance_provider: '',
    insurance_policy_number: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (patient) {
      setFormData({
        phone: patient.phone || '',
        date_of_birth: patient.date_of_birth || '',
        gender: patient.gender || '',
        address: patient.address || '',
        city: patient.city || '',
        emergency_contact_name: patient.emergency_contact_name || '',
        emergency_contact_phone: patient.emergency_contact_phone || '',
        blood_type: patient.blood_type || '',
        allergies: patient.allergies?.join(', ') || '',
        chronic_conditions: patient.chronic_conditions?.join(', ') || '',
        current_medications: patient.current_medications || '',
        medical_notes: patient.medical_notes || '',
        insurance_provider: patient.insurance_provider || '',
        insurance_policy_number: patient.insurance_policy_number || '',
      });
    }
  }, [patient]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!patient) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          phone: formData.phone || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          address: formData.address || null,
          city: formData.city || null,
          emergency_contact_name: formData.emergency_contact_name || null,
          emergency_contact_phone: formData.emergency_contact_phone || null,
          blood_type: formData.blood_type || null,
          allergies: formData.allergies ? formData.allergies.split(',').map((a) => a.trim()).filter(Boolean) : null,
          chronic_conditions: formData.chronic_conditions ? formData.chronic_conditions.split(',').map((c) => c.trim()).filter(Boolean) : null,
          current_medications: formData.current_medications || null,
          medical_notes: formData.medical_notes || null,
          insurance_provider: formData.insurance_provider || null,
          insurance_policy_number: formData.insurance_policy_number || null,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', patient.id);

      if (error) throw error;
      await refreshPatient();
      router.push('/patient');
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-clinic-navy dark:text-white">
          Complete Your Profile
        </h1>
        <p className="text-muted-foreground mt-1">
          Fill in your details for a better experience. You can skip this and do it later.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Basic contact and demographic info</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" value={formData.date_of_birth} onChange={(e) => handleChange('date_of_birth', e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={formData.city} onChange={(e) => handleChange('city', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergency_name">Emergency Contact Name</Label>
              <Input id="emergency_name" value={formData.emergency_contact_name} onChange={(e) => handleChange('emergency_contact_name', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="emergency_phone">Emergency Contact Phone</Label>
              <Input id="emergency_phone" value={formData.emergency_contact_phone} onChange={(e) => handleChange('emergency_contact_phone', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Medical Information</CardTitle>
          <CardDescription>Optional — helps practitioners prepare for your visit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="blood_type">Blood Type</Label>
              <Select value={formData.blood_type} onValueChange={(v) => handleChange('blood_type', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="insurance">Insurance Provider</Label>
              <Input id="insurance" value={formData.insurance_provider} onChange={(e) => handleChange('insurance_provider', e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="policy">Insurance Policy Number</Label>
            <Input id="policy" value={formData.insurance_policy_number} onChange={(e) => handleChange('insurance_policy_number', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="allergies">Allergies (comma-separated)</Label>
            <Input id="allergies" value={formData.allergies} onChange={(e) => handleChange('allergies', e.target.value)} placeholder="e.g., Penicillin, Peanuts" />
          </div>
          <div>
            <Label htmlFor="conditions">Chronic Conditions (comma-separated)</Label>
            <Input id="conditions" value={formData.chronic_conditions} onChange={(e) => handleChange('chronic_conditions', e.target.value)} placeholder="e.g., Diabetes, Hypertension" />
          </div>
          <div>
            <Label htmlFor="medications">Current Medications</Label>
            <Textarea id="medications" value={formData.current_medications} onChange={(e) => handleChange('current_medications', e.target.value)} rows={2} />
          </div>
          <div>
            <Label htmlFor="notes">Additional Medical Notes</Label>
            <Textarea id="notes" value={formData.medical_notes} onChange={(e) => handleChange('medical_notes', e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => router.push('/patient')}>
          Skip for now
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/patient/profile/setup/page.tsx"
git commit -m "feat: add skippable patient profile setup page"
```

---

### Task 6: Modify appointments API for intake_status

**Files:**
- Modify: `src/app/api/appointments/route.ts`

- [ ] **Step 1: Read the appointments route**

Read `src/app/api/appointments/route.ts` fully.

- [ ] **Step 2: Add intake_status logic after appointment creation**

After the appointment insert (around line 139, after `const { data: appointment, error: appointmentError } = ...`), add a check for the clinic's `intake_required` setting. The appointment is already created with default `intake_status: 'none'`. If the clinic requires intake, update it to `'pending'`.

After the appointment error check block (after `if (appointmentError) { ... }`), add:

```typescript
    // Check if clinic requires intake and update status
    if (clinic_id && appointment) {
      const { data: clinicData } = await supabase
        .from('clinics')
        .select('intake_required')
        .eq('id', clinic_id)
        .single();

      if (clinicData?.intake_required) {
        await supabase
          .from('appointments')
          .update({ intake_status: 'pending' })
          .eq('id', appointment.id);

        appointment.intake_status = 'pending';
      }
    }
```

- [ ] **Step 3: Include intake_status in the response**

Find the JSON response that returns the appointment data (the success response). Make sure the appointment object includes `intake_status`. Since we're mutating the `appointment` object above, it should already be included in the response. Verify the response includes the full appointment object.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/appointments/route.ts
git commit -m "feat: set intake_status to pending when clinic requires intake"
```

---

### Task 7: Create intake API routes

**Files:**
- Create: `src/app/api/appointments/[appointmentId]/intake/route.ts`

- [ ] **Step 1: Write the intake GET and POST handlers**

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch appointment with clinic info
    const { data: appointment } = await supabaseAdmin
      .from('appointments')
      .select('id, patient_id, clinic_id, appointment_date, appointment_time, intake_status')
      .eq('id', appointmentId)
      .single();

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Verify user is the patient
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('id', appointment.patient_id)
      .eq('auth_user_id', user.id)
      .single();

    if (!patient) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const clinicId = appointment.clinic_id;

    // Fetch clinic info
    const { data: clinic } = await supabaseAdmin
      .from('clinics')
      .select('name, intake_required')
      .eq('id', clinicId)
      .single();

    // Fetch clinic's onboarding questions
    const { data: questions } = await supabaseAdmin
      .from('clinic_onboarding_questions')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // Fetch clinic's required documents
    const { data: documents } = await supabaseAdmin
      .from('clinic_required_documents')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // Fetch patient's responses for this appointment
    const { data: responses } = await supabaseAdmin
      .from('patient_question_responses')
      .select('*, question:clinic_onboarding_questions(*)')
      .eq('patient_id', appointment.patient_id)
      .eq('clinic_id', clinicId)
      .eq('appointment_id', appointmentId);

    // Fetch patient's uploaded documents
    const { data: uploadedDocuments } = await supabaseAdmin
      .from('patient_documents')
      .select('*')
      .eq('patient_id', appointment.patient_id);

    // Fetch AI prediction if exists
    const { data: aiPrediction } = await supabaseAdmin
      .from('ai_treatment_predictions')
      .select('*')
      .eq('patient_id', appointment.patient_id)
      .eq('clinic_id', clinicId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      appointment,
      clinic,
      questions: questions || [],
      documents: documents || [],
      responses: responses || [],
      uploadedDocuments: uploadedDocuments || [],
      aiPrediction: aiPrediction || null,
    });
  } catch (error) {
    console.error('Error fetching intake data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch appointment
    const { data: appointment } = await supabaseAdmin
      .from('appointments')
      .select('id, patient_id, clinic_id')
      .eq('id', appointmentId)
      .single();

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Verify user is the patient
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('id', appointment.patient_id)
      .eq('auth_user_id', user.id)
      .single();

    if (!patient) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { responses, completeIntake = false } = body;

    // Upsert responses with appointment_id
    if (responses && responses.length > 0) {
      const responseInserts = responses.map((r: any) => ({
        patient_id: appointment.patient_id,
        clinic_id: appointment.clinic_id,
        question_id: r.questionId,
        response_value: r.value,
        response_options: r.options,
        appointment_id: appointmentId,
      }));

      const { error: responseError } = await supabaseAdmin
        .from('patient_question_responses')
        .upsert(responseInserts, {
          onConflict: 'patient_id,question_id',
          ignoreDuplicates: false,
        });

      if (responseError) {
        console.error('Error saving intake responses:', responseError);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }

    // Mark intake as completed
    if (completeIntake) {
      const { error: updateError } = await supabaseAdmin
        .from('appointments')
        .update({ intake_status: 'completed' })
        .eq('id', appointmentId);

      if (updateError) {
        console.error('Error updating intake status:', updateError);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: completeIntake ? 'Intake completed' : 'Responses saved',
    });
  } catch (error) {
    console.error('Error saving intake:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/api/appointments/[appointmentId]/intake/route.ts"
git commit -m "feat: add GET/POST intake API routes scoped to appointments"
```

---

### Task 8: Create intake document upload route

**Files:**
- Create: `src/app/api/appointments/[appointmentId]/intake/documents/route.ts`

- [ ] **Step 1: Read existing document upload route for reference**

Read `src/app/api/clinic/[clinicId]/patients/[patientId]/documents/route.ts` to understand the upload pattern (file validation, storage path, DB insert).

- [ ] **Step 2: Write the intake document upload route**

Create `src/app/api/appointments/[appointmentId]/intake/documents/route.ts`. Follow the same pattern as the existing documents route, but scope to appointment:

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch appointment
    const { data: appointment } = await supabaseAdmin
      .from('appointments')
      .select('id, patient_id, clinic_id')
      .eq('id', appointmentId)
      .single();

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Verify user is the patient
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('id', appointment.patient_id)
      .eq('auth_user_id', user.id)
      .single();

    if (!patient) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentTypeId = formData.get('documentTypeId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Get document type name for description
    let description = 'Medical Document';
    if (documentTypeId) {
      const { data: docType } = await supabaseAdmin
        .from('clinic_required_documents')
        .select('document_name')
        .eq('id', documentTypeId)
        .single();
      if (docType) description = docType.document_name;
    }

    // Upload to storage
    const filePath = `${appointment.patient_id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('patient-documents')
      .upload(filePath, file, { contentType: file.type });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Insert document record
    const { data: document, error: insertError } = await supabaseAdmin
      .from('patient_documents')
      .insert({
        patient_id: appointment.patient_id,
        file_name: file.name,
        file_path: filePath,
        mime_type: file.type,
        file_size_bytes: file.size,
        description,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 });
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/appointments/[appointmentId]/intake/documents/route.ts"
git commit -m "feat: add document upload route for appointment intake"
```

---

### Task 9: Adapt PatientOnboarding for appointment-scoped intake

**Files:**
- Modify: `src/components/patient/patient-onboarding.tsx`

- [ ] **Step 1: Read the component fully**

Read `src/components/patient/patient-onboarding.tsx` to understand all API calls.

- [ ] **Step 2: Add `appointmentId` prop**

Update the props interface:

Replace:
```typescript
interface PatientOnboardingProps {
  clinicId: string;
  patientId: string;
  onComplete?: () => void;
}
```

With:
```typescript
interface PatientOnboardingProps {
  clinicId: string;
  patientId: string;
  appointmentId?: string;
  onComplete?: () => void;
}
```

Update the destructure:

Replace:
```typescript
export default function PatientOnboarding({
  clinicId,
  patientId,
  onComplete,
}: PatientOnboardingProps) {
```

With:
```typescript
export default function PatientOnboarding({
  clinicId,
  patientId,
  appointmentId,
  onComplete,
}: PatientOnboardingProps) {
```

- [ ] **Step 3: Update API endpoints based on mode**

After the destructure, add endpoint helpers:

```typescript
  const dataUrl = appointmentId
    ? `/api/appointments/${appointmentId}/intake`
    : `/api/clinic/${clinicId}/patients/${patientId}/onboarding`;
  const documentsUrl = appointmentId
    ? `/api/appointments/${appointmentId}/intake/documents`
    : `/api/clinic/${clinicId}/patients/${patientId}/documents`;
  const analyzeUrl = `/api/clinic/${clinicId}/patients/${patientId}/onboarding/analyze`;
```

Then replace all hardcoded URLs:

In `fetchOnboardingData`, replace:
```typescript
        `/api/clinic/${clinicId}/patients/${patientId}/onboarding`,
```
With:
```typescript
        dataUrl,
```

In `handleFileUpload`, replace:
```typescript
        `/api/clinic/${clinicId}/patients/${patientId}/documents`,
```
With:
```typescript
        documentsUrl,
```

In `handleSubmit`, replace:
```typescript
        `/api/clinic/${clinicId}/patients/${patientId}/onboarding`,
```
With:
```typescript
        dataUrl,
```

Also in `handleSubmit`, update the body to use `completeIntake` when in appointment mode:

Replace:
```typescript
          body: JSON.stringify({
            responses: responseData,
            completeOnboarding: true,
          }),
```
With:
```typescript
          body: JSON.stringify({
            responses: responseData,
            ...(appointmentId ? { completeIntake: true } : { completeOnboarding: true }),
          }),
```

The `handleAnalyze` function already uses `analyzeUrl` pattern — update it too:

Replace:
```typescript
        `/api/clinic/${clinicId}/patients/${patientId}/onboarding/analyze`,
```
With:
```typescript
        analyzeUrl,
```

- [ ] **Step 4: Commit**

```bash
git add src/components/patient/patient-onboarding.tsx
git commit -m "feat: support appointment-scoped intake mode in PatientOnboarding"
```

---

### Task 10: Create intake page and post-booking redirect

**Files:**
- Create: `src/app/appointments/[appointmentId]/intake/page.tsx`
- Modify: `src/hooks/useBookingForm.ts`

- [ ] **Step 1: Create the intake page**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import PatientOnboarding from '@/components/patient/patient-onboarding';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function IntakePage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;
  const { user, patient, isLoading: authLoading } = useAuth();

  const [clinicId, setClinicId] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState<string>('');
  const [intakeStatus, setIntakeStatus] = useState<string>('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    const fetchAppointment = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/appointments/${appointmentId}/intake`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setClinicId(data.appointment.clinic_id);
        setClinicName(data.clinic?.name || '');
        setIntakeStatus(data.appointment.intake_status);
      }
      setLoading(false);
    };

    if (user) fetchAppointment();
  }, [appointmentId, user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (intakeStatus === 'completed') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-green-500 mb-4">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Intake Complete!</h2>
            <p className="text-center text-muted-foreground">
              Your pre-visit intake for {clinicName} has been completed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clinicId || !patient) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl mb-6">
        <h1 className="font-display text-2xl font-bold text-clinic-navy dark:text-white">
          Pre-Visit Intake
        </h1>
        <p className="text-muted-foreground mt-1">
          {clinicName} has requested the following information before your appointment.
        </p>
      </div>
      <PatientOnboarding
        clinicId={clinicId}
        patientId={patient.id}
        appointmentId={appointmentId}
        onComplete={() => router.push('/patient')}
      />
    </div>
  );
}
```

- [ ] **Step 2: Add post-booking redirect to intake**

In `src/hooks/useBookingForm.ts`, the `submitBooking` function currently sets `setCurrentStep(4)` on success (line 264). We need to also store the appointment ID so the confirmation step can link to intake.

Add state for the created appointment:

After the existing state declarations at the top of the hook, add:
```typescript
  const [createdAppointment, setCreatedAppointment] = useState<any>(null);
```

In `submitBooking`, after `const data = await response.json();`, add:
```typescript
      setCreatedAppointment(data.appointment);
```

Then return `createdAppointment` from the hook alongside the existing return values so the confirmation step can use it.

Find the return statement of the hook and add `createdAppointment`:
```typescript
    createdAppointment,
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/appointments/[appointmentId]/intake/page.tsx" src/hooks/useBookingForm.ts
git commit -m "feat: add appointment intake page and store appointment in booking hook"
```

---

### Task 11: Create IntakeBanner and update patient dashboard

**Files:**
- Create: `src/components/patient/dashboard/IntakeBanner.tsx`
- Modify: `src/app/(dashboard)/patient/page.tsx`

- [ ] **Step 1: Create IntakeBanner component**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

interface IntakeBannerProps {
  patientId: string;
}

interface PendingIntake {
  id: string;
  appointment_date: string;
  appointment_time: string;
  clinic_name: string;
}

export function IntakeBanner({ patientId }: IntakeBannerProps) {
  const router = useRouter();
  const [pendingIntakes, setPendingIntakes] = useState<PendingIntake[]>([]);

  useEffect(() => {
    const fetchPendingIntakes = async () => {
      const { data } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time, clinic_id, clinics(name)')
        .eq('patient_id', patientId)
        .eq('intake_status', 'pending')
        .gte('appointment_date', new Date().toISOString().split('T')[0])
        .order('appointment_date', { ascending: true });

      if (data) {
        setPendingIntakes(
          data.map((a: any) => ({
            id: a.id,
            appointment_date: a.appointment_date,
            appointment_time: a.appointment_time,
            clinic_name: a.clinics?.name || 'Clinic',
          }))
        );
      }
    };

    fetchPendingIntakes();
  }, [patientId]);

  if (pendingIntakes.length === 0) return null;

  return (
    <div className="space-y-3 mb-8">
      {pendingIntakes.map((intake) => (
        <Card key={intake.id} className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Pre-Visit Intake Required
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {intake.clinic_name} — {intake.appointment_date} at {intake.appointment_time}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => router.push(`/appointments/${intake.id}/intake`)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Complete Intake
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default IntakeBanner;
```

- [ ] **Step 2: Read patient dashboard page**

Read `src/app/(dashboard)/patient/page.tsx` to find where OnboardingBanner is used.

- [ ] **Step 3: Replace OnboardingBanner with IntakeBanner in patient dashboard**

In `src/app/(dashboard)/patient/page.tsx`:

Replace the import:
```typescript
import { OnboardingBanner } from '@/components/patient/dashboard/OnboardingBanner';
```
With:
```typescript
import { IntakeBanner } from '@/components/patient/dashboard/IntakeBanner';
```

Replace the banner rendering (around line 123-125):
```typescript
      {patientInfo && !patientInfo.onboarding_completed && (
        <OnboardingBanner patient={patientInfo} />
      )}
```
With:
```typescript
      {patientInfo && (
        <IntakeBanner patientId={patientInfo.id} />
      )}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/patient/dashboard/IntakeBanner.tsx "src/app/(dashboard)/patient/page.tsx"
git commit -m "feat: add IntakeBanner for pending appointment intakes on dashboard"
```

---

### Task 12: Remove canAccessClinic and delete old files

**Files:**
- Modify: `src/hooks/use-auth.tsx`
- Delete: `src/app/clinic/[clinicId]/patient/onboarding/page.tsx`
- Delete: `src/app/api/clinic/[clinicId]/patients/[patientId]/onboarding/route.ts`
- Delete: `src/app/api/clinic/[clinicId]/patients/[patientId]/documents/route.ts`
- Delete: `src/components/patient/dashboard/OnboardingBanner.tsx`

- [ ] **Step 1: Read `src/hooks/use-auth.tsx`**

Read the file to find `canAccessClinic`, `patientClinicIds`, `fetchPatientClinics`, and `setPatientClinicIds`.

- [ ] **Step 2: Remove `patientClinicIds` state declaration**

Remove the line:
```typescript
  const [patientClinicIds, setPatientClinicIds] = useState<string[]>([]);
```

- [ ] **Step 3: Remove `fetchPatientClinics` function**

Remove the entire function:
```typescript
  const fetchPatientClinics = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('patient_clinics')
        .select('clinic_id')
        .eq('patient_id', patientId);
      console.log(`@@@@@@@@@@@@@@@@@@data`, data);
      if (error) {
        console.error('Error fetching patient clinics:', error);
        return;
      }
      setPatientClinicIds((data ?? []).map((pc) => pc.clinic_id));
    } catch (err) {
      console.error('Failed to fetch patient clinics:', err);
    }
  };
```

- [ ] **Step 4: Remove `fetchPatientClinics` calls from `fetchPatient`**

In `fetchPatient`, remove:
```typescript
    if (data) {
      await fetchPatientClinics(data.id);
    }
```

- [ ] **Step 5: Remove `canAccessClinic` function**

Remove:
```typescript
  const canAccessClinic = (clinicId: string): boolean => {
    return patientClinicIds.includes(clinicId);
  };
```

- [ ] **Step 6: Remove `setPatientClinicIds([])` from signOut**

In the `signOut` function, remove the line:
```typescript
    setPatientClinicIds([]);
```

- [ ] **Step 7: Remove `canAccessClinic` from the context value/return**

Find where `canAccessClinic` is included in the context provider value or return statement and remove it.

- [ ] **Step 8: Search for any remaining references to `canAccessClinic`**

```bash
grep -r "canAccessClinic" src/ --include="*.tsx" --include="*.ts" -l
```

Fix any remaining references. The clinic-specific onboarding page uses it, but we're deleting that file.

- [ ] **Step 9: Delete old files**

```bash
rm "src/app/clinic/[clinicId]/patient/onboarding/page.tsx"
rm "src/app/api/clinic/[clinicId]/patients/[patientId]/onboarding/route.ts"
rm "src/app/api/clinic/[clinicId]/patients/[patientId]/documents/route.ts"
rm src/components/patient/dashboard/OnboardingBanner.tsx
```

- [ ] **Step 10: Verify no broken imports**

```bash
npx tsc --noEmit 2>&1 | grep -v ".next/types" | head -20
```

Fix any broken imports.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: remove canAccessClinic, delete old onboarding page and API routes"
```

---

### Task 13: Smoke test

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v ".next/types" | head -20
```

Fix any type errors from our changes. Ignore pre-existing `.next/types` cache errors.

- [ ] **Step 2: Start dev server and verify key flows**

```bash
npm run dev
```

Test manually:
1. Register a new patient at `/register` (no `?clinic=` param)
2. Verify email, check redirect goes to `/patient/profile/setup`
3. Skip profile setup, verify landing on patient dashboard
4. Browse clinics at `/clinics`, click a clinic, click "Book"
5. Verify booking page loads without onboarding gate
6. Complete a booking
7. Verify redirect to intake page if clinic has `intake_required = true`
8. Verify intake page loads clinic questions and document uploads
9. Complete intake, verify status updates

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during smoke testing"
```
