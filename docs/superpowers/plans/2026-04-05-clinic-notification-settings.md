# Clinic Notification Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make clinic notification toggles functional so clinic admins can control email notifications and appointment reminders for their patients.

**Architecture:** Two boolean columns on the `clinics` table (`email_notifications_enabled`, `appointment_reminders_enabled`), checked by existing PL/pgSQL trigger/functions before queueing emails. A new PATCH API endpoint persists settings. The settings page UI is wired to read from clinic context and save via the API.

**Tech Stack:** Supabase (PostgreSQL, PL/pgSQL), Next.js API Routes, React, Tailwind CSS

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_add_clinic_notification_settings.sql` (use `npx supabase migration new` to generate timestamp)

- [ ] **Step 1: Create the migration file**

```bash
npx supabase migration new add_clinic_notification_settings
```

- [ ] **Step 2: Write the migration SQL**

Write this content into the generated migration file:

```sql
-- Add notification setting columns to clinics table
ALTER TABLE public.clinics
  ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true,
  ADD COLUMN appointment_reminders_enabled BOOLEAN DEFAULT true;

-- Update notify_appointment_email() to check email_notifications_enabled
CREATE OR REPLACE FUNCTION public.notify_appointment_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_notification_type TEXT;
    v_should_notify BOOLEAN := FALSE;
    v_email_enabled BOOLEAN;
    v_edge_function_url TEXT;
BEGIN
    v_edge_function_url := current_setting('app.settings.edge_function_url', true);
    IF v_edge_function_url IS NULL THEN
        v_edge_function_url := 'https://kandwedeqpguuupzqpcc.supabase.co/functions/v1/send-appointment-email';
    END IF;

    -- Check if clinic has email notifications enabled
    SELECT email_notifications_enabled INTO v_email_enabled
    FROM clinics WHERE id = NEW.clinic_id;

    IF v_email_enabled IS DISTINCT FROM TRUE THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF NEW.status IN ('scheduled', 'confirmed') AND NEW.notification_created_sent = FALSE THEN
            v_notification_type := 'appointment_created';
            v_should_notify := TRUE;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF (OLD.appointment_date != NEW.appointment_date OR OLD.appointment_time != NEW.appointment_time)
           AND NEW.status IN ('scheduled', 'confirmed')
           AND NEW.notification_updated_sent = FALSE THEN
            v_notification_type := 'appointment_updated';
            v_should_notify := TRUE;
            NEW.notification_24hr_sent := FALSE;
            NEW.notification_start_sent := FALSE;
        END IF;
    END IF;

    IF v_should_notify AND v_notification_type IS NOT NULL THEN
        INSERT INTO email_notifications (
            recipient_email, recipient_name, recipient_type, subject, body,
            notification_type, related_entity_type, related_entity_id, status, metadata
        )
        SELECT
            p.email, p.first_name || ' ' || p.last_name, 'patient',
            'Appointment Notification', 'Pending processing',
            v_notification_type, 'appointment', NEW.id, 'queued',
            jsonb_build_object('appointment_id', NEW.id, 'notification_type', v_notification_type, 'triggered_at', now())
        FROM patients p WHERE p.id = NEW.patient_id;

        IF v_notification_type = 'appointment_created' THEN
            NEW.notification_created_sent := TRUE;
        ELSIF v_notification_type = 'appointment_updated' THEN
            NEW.notification_updated_sent := TRUE;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- Update check_24hr_reminders() to check appointment_reminders_enabled
CREATE OR REPLACE FUNCTION public.check_24hr_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_count INTEGER := 0;
    v_appointment RECORD;
    v_reminder_window_start TIMESTAMPTZ;
    v_reminder_window_end TIMESTAMPTZ;
BEGIN
    v_reminder_window_start := now() + INTERVAL '23 hours';
    v_reminder_window_end := now() + INTERVAL '25 hours';

    FOR v_appointment IN
        SELECT a.id, a.patient_id, p.email, p.first_name, p.last_name
        FROM appointments a
        JOIN patients p ON p.id = a.patient_id
        JOIN clinics c ON c.id = a.clinic_id
        WHERE a.notification_24hr_sent = FALSE
          AND a.status IN ('scheduled', 'confirmed')
          AND c.appointment_reminders_enabled = TRUE
          AND (a.appointment_date + a.appointment_time)::timestamptz >= v_reminder_window_start
          AND (a.appointment_date + a.appointment_time)::timestamptz <= v_reminder_window_end
    LOOP
        INSERT INTO email_notifications (
            recipient_email, recipient_name, recipient_type, subject, body,
            notification_type, related_entity_type, related_entity_id, status, metadata
        ) VALUES (
            v_appointment.email, v_appointment.first_name || ' ' || v_appointment.last_name,
            'patient', '24-Hour Reminder', 'Pending processing',
            'appointment_reminder_24hr', 'appointment', v_appointment.id, 'queued',
            jsonb_build_object('appointment_id', v_appointment.id, 'notification_type', 'appointment_reminder_24hr', 'triggered_at', now())
        );
        UPDATE appointments SET notification_24hr_sent = TRUE WHERE id = v_appointment.id;
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$function$;

-- Update check_appointment_start_notifications() to check appointment_reminders_enabled
CREATE OR REPLACE FUNCTION public.check_appointment_start_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_count INTEGER := 0;
    v_appointment RECORD;
    v_start_window_start TIMESTAMPTZ;
    v_start_window_end TIMESTAMPTZ;
BEGIN
    v_start_window_start := now() + INTERVAL '5 minutes';
    v_start_window_end := now() + INTERVAL '15 minutes';

    FOR v_appointment IN
        SELECT a.id, a.patient_id, p.email, p.first_name, p.last_name
        FROM appointments a
        JOIN patients p ON p.id = a.patient_id
        JOIN clinics c ON c.id = a.clinic_id
        WHERE a.notification_start_sent = FALSE
          AND a.status IN ('scheduled', 'confirmed')
          AND c.appointment_reminders_enabled = TRUE
          AND (a.appointment_date + a.appointment_time)::timestamptz >= v_start_window_start
          AND (a.appointment_date + a.appointment_time)::timestamptz <= v_start_window_end
    LOOP
        INSERT INTO email_notifications (
            recipient_email, recipient_name, recipient_type, subject, body,
            notification_type, related_entity_type, related_entity_id, status, metadata
        ) VALUES (
            v_appointment.email, v_appointment.first_name || ' ' || v_appointment.last_name,
            'patient', 'Appointment Starting', 'Pending processing',
            'appointment_start', 'appointment', v_appointment.id, 'queued',
            jsonb_build_object('appointment_id', v_appointment.id, 'notification_type', 'appointment_start', 'triggered_at', now())
        );
        UPDATE appointments SET notification_start_sent = TRUE WHERE id = v_appointment.id;
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$function$;
```

- [ ] **Step 3: Apply the migration locally**

```bash
npx supabase db reset
```

Or if you prefer not to reset:

```bash
npx supabase migration up
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/*add_clinic_notification_settings*
git commit -m "feat: add clinic notification settings columns and update PL/pgSQL functions"
```

---

### Task 2: Update TypeScript Types and Clinic Fetch

**Files:**
- Modify: `src/types/database.ts:14-46`
- Modify: `src/hooks/useGetClinic.ts:57-88`

- [ ] **Step 1: Add fields to Clinic interface**

In `src/types/database.ts`, add these two lines after the `slug` field (line 45):

```ts
  email_notifications_enabled: boolean;
  appointment_reminders_enabled: boolean;
```

- [ ] **Step 2: Add fields to useGetClinic select query**

In `src/hooks/useGetClinic.ts`, add these two fields to the select string after `slug,` (around line 74):

```
          email_notifications_enabled,
          appointment_reminders_enabled,
```

So the select becomes:

```
          slug,
          email_notifications_enabled,
          appointment_reminders_enabled,
          clinic_services (
```

- [ ] **Step 3: Commit**

```bash
git add src/types/database.ts src/hooks/useGetClinic.ts
git commit -m "feat: add notification setting fields to Clinic type and fetch query"
```

---

### Task 3: Create Settings API Endpoint

**Files:**
- Create: `src/app/api/clinic/[clinicId]/settings/route.ts`

- [ ] **Step 1: Create the API route**

```ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  request: Request,
  { params }: { params: { clinicId: string } },
) {
  try {
    const { clinicId } = params;

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userClinicId = user.user_metadata?.clinic_id;
    if (userClinicId !== clinicId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      email,
      email_notifications_enabled,
      appointment_reminders_enabled,
    } = body;

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (email_notifications_enabled !== undefined) {
      updates.email_notifications_enabled = email_notifications_enabled;
    }
    if (appointment_reminders_enabled !== undefined) {
      // If email notifications are off, reminders must also be off
      if (email_notifications_enabled === false) {
        updates.appointment_reminders_enabled = false;
      } else {
        updates.appointment_reminders_enabled = appointment_reminders_enabled;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: clinic, error: updateError } = await supabase
      .from('clinics')
      .update(updates)
      .eq('id', clinicId)
      .select()
      .single();

    if (updateError) {
      console.error('[API] Failed to update clinic settings:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ clinic });
  } catch (err) {
    console.error('[API] Server error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/clinic/[clinicId]/settings/route.ts
git commit -m "feat: add PATCH /api/clinic/[clinicId]/settings endpoint"
```

---

### Task 4: Wire Up Settings Page UI

**Files:**
- Modify: `src/app/(clinic)/clinic/[clinicId]/settings/page.tsx`

- [ ] **Step 1: Rewrite the settings page**

Replace the entire file with:

```tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Settings,
  Building2,
  Bell,
  Shield,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useClinicContext } from '../layout';

export default function SettingsPage() {
  const { clinic, admin } = useClinicContext();
  const clinicId = clinic?.id;
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Form state
  const [clinicName, setClinicName] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);

  // Initialize form from clinic data
  useEffect(() => {
    if (clinic) {
      setClinicName(clinic.name || '');
      setClinicEmail(clinic.email || '');
      setEmailNotifications(clinic.email_notifications_enabled ?? true);
      setAppointmentReminders(clinic.appointment_reminders_enabled ?? true);
    }
  }, [clinic]);

  const handleEmailToggle = (checked: boolean) => {
    setEmailNotifications(checked);
    if (!checked) {
      setAppointmentReminders(false);
    }
  };

  const handleSave = async () => {
    if (!clinicId) return;
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const res = await fetch(`/api/clinic/${clinicId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clinicName,
          email: clinicEmail,
          email_notifications_enabled: emailNotifications,
          appointment_reminders_enabled: appointmentReminders,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-display font-bold text-clinic-navy dark:text-white'>
          Settings
        </h2>
        <p className='text-clinic-text/60 dark:text-white/60'>
          Manage your clinic settings and preferences
        </p>
      </div>

      {/* Clinic Information */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-10 h-10 rounded-xl bg-clinic-teal/10 flex items-center justify-center'>
            <Building2 className='w-5 h-5 text-clinic-teal' />
          </div>
          <div>
            <h3 className='font-semibold text-clinic-navy dark:text-white'>
              Clinic Information
            </h3>
            <p className='text-sm text-clinic-text/60 dark:text-white/60'>
              Basic information about your clinic
            </p>
          </div>
        </div>

        <div className='grid md:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='clinicName'>Clinic Name</Label>
            <Input
              id='clinicName'
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className='border-clinic-navy/10'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='clinicEmail'>Clinic Email</Label>
            <Input
              id='clinicEmail'
              type='email'
              value={clinicEmail}
              onChange={(e) => setClinicEmail(e.target.value)}
              className='border-clinic-navy/10'
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center'>
            <Bell className='w-5 h-5 text-yellow-500' />
          </div>
          <div>
            <h3 className='font-semibold text-clinic-navy dark:text-white'>
              Notifications
            </h3>
            <p className='text-sm text-clinic-text/60 dark:text-white/60'>
              Configure email notifications sent to patients
            </p>
          </div>
        </div>

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='font-medium text-clinic-navy dark:text-white'>
                Email Notifications
              </p>
              <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                Send confirmation and update emails to patients when appointments are created or changed
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={handleEmailToggle}
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className={!emailNotifications ? 'opacity-50' : ''}>
              <p className='font-medium text-clinic-navy dark:text-white'>
                Appointment Reminders
              </p>
              <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                Send reminder emails to patients 24 hours before and at appointment start time
              </p>
            </div>
            <Switch
              checked={appointmentReminders}
              onCheckedChange={setAppointmentReminders}
              disabled={!emailNotifications}
            />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center'>
            <Shield className='w-5 h-5 text-red-500' />
          </div>
          <div>
            <h3 className='font-semibold text-clinic-navy dark:text-white'>
              Security
            </h3>
            <p className='text-sm text-clinic-text/60 dark:text-white/60'>
              Manage your account security settings
            </p>
          </div>
        </div>

        <div className='space-y-4 space-x-2'>
          <Link href={`/clinic/${clinicId}/settings/change-password`}>
            <Button variant='outline'>Change Password</Button>
          </Link>
          <Button variant='outline'>Enable Two-Factor Authentication</Button>
        </div>
      </div>

      {/* Save Button */}
      <div className='flex items-center justify-end gap-3'>
        {saveStatus === 'success' && (
          <span className='flex items-center gap-1 text-sm text-green-600 dark:text-green-400'>
            <CheckCircle className='w-4 h-4' />
            Settings saved
          </span>
        )}
        {saveStatus === 'error' && (
          <span className='flex items-center gap-1 text-sm text-red-600 dark:text-red-400'>
            <AlertCircle className='w-4 h-4' />
            Failed to save
          </span>
        )}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'
        >
          {isSaving ? (
            <>
              <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              Saving...
            </>
          ) : (
            <>
              <Save className='w-4 h-4 mr-2' />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(clinic)/clinic/[clinicId]/settings/page.tsx"
git commit -m "feat: wire clinic notification toggles to API with save/status feedback"
```

---

### Task 5: Final Verification

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Only pre-existing errors should appear. No new errors from our changes.

- [ ] **Step 2: Test locally**

1. Go to `/clinic/{clinicId}/settings`
2. Verify Email Notifications and Appointment Reminders toggles show current DB values
3. Toggle Email Notifications off — Appointment Reminders should auto-disable and grey out
4. Click Save — verify "Settings saved" feedback appears
5. Refresh page — verify toggles persist their state
6. Toggle Email Notifications back on, toggle Appointment Reminders off independently, save, refresh — verify it persists
7. Verify SMS and Marketing toggles are gone

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve any issues from clinic notification settings"
```
