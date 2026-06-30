# Production Subscription Billing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the subscription billing system production-ready by enforcing payment status in plan gating, expiring trials, sending renewal reminders with auto-created PayMongo checkout sessions, and hardening webhook security.

**Architecture:** A daily Supabase Edge Function (`billing-lifecycle`) acts as the heartbeat — checking trial expirations, sending renewal reminders, and enforcing grace periods. `plan-gating.ts` gains a `requireActiveSubscription()` function enforced on all mutation routes. A `BillingBanner` component replaces the existing trial-only banner to cover all billing states. The existing PayMongo webhook handler is extended to reset renewal tracking fields on payment.

**Tech Stack:** Next.js 14 (App Router), Supabase (Postgres + Edge Functions + Realtime), PayMongo API, TypeScript, Tailwind CSS, shadcn/ui

## Global Constraints

- Branch from `dev` as `feat/production-billing`
- All API routes use Bearer token auth pattern (never `supabase.from()` in components)
- Edge Functions use Deno runtime with `https://esm.sh/@supabase/supabase-js@2.39.3`
- Emails insert into `email_notifications` table (processed by existing `send-email` Edge Function)
- In-app notifications insert into `notifications` table (delivered via existing Realtime subscription)
- `NotificationType` values already include `trial.expiring` and `payment.status_changed`
- Grace period: 7 days. Trial period: 14 days.

---

### Task 1: Database Migration — Billing Lifecycle Columns

**Files:**
- Create: `supabase/migrations/20260630000001_billing_lifecycle.sql`

**Interfaces:**
- Produces: Four new columns on `clinics` table — `trial_end_date`, `pending_checkout_session_id`, `last_reminder_sent_at`, `reminder_count`

- [ ] **Step 1: Create the migration file**

```sql
-- Billing lifecycle columns for trial expiry, renewal reminders, and grace period tracking

ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pending_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_count INTEGER NOT NULL DEFAULT 0;

-- Backfill existing trial clinics: set trial_end_date from created_at
UPDATE public.clinics
SET trial_end_date = created_at + INTERVAL '14 days'
WHERE is_trial_active = true
  AND trial_end_date IS NULL;

-- Backfill clinics that already have trial_start_date but no trial_end_date
UPDATE public.clinics
SET trial_end_date = trial_start_date + INTERVAL '14 days'
WHERE trial_end_date IS NULL
  AND trial_start_date IS NOT NULL;
```

- [ ] **Step 2: Apply migration locally**

Run: `supabase db push --local`
Expected: Migration applies successfully, no errors.

- [ ] **Step 3: Verify columns exist**

Run: `supabase db reset --local` (or query the table)
Check that `trial_end_date` is populated for trial clinics.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260630000001_billing_lifecycle.sql
git commit -m "feat(billing): add lifecycle columns for trial expiry and renewal tracking"
```

---

### Task 2: Payment-Aware Plan Gating

**Files:**
- Modify: `src/lib/plan-gating.ts`

**Interfaces:**
- Consumes: `clinics` table columns `payment_status`, `is_subscription_active`, `trial_end_date`, `next_billing_date`
- Produces: `requireActiveSubscription(clinicId: string): Promise<true | NextResponse>` — returns `true` if active, or a 403 `NextResponse` with `subscription_inactive` error

- [ ] **Step 1: Add the `requireActiveSubscription` function to `src/lib/plan-gating.ts`**

Add this after the existing `requirePlan` function (after line 46):

```typescript
const GRACE_PERIOD_DAYS = 7;

export async function requireActiveSubscription(
  clinicId: string,
): Promise<true | NextResponse> {
  const { data: clinic, error } = await supabaseAdmin
    .from('clinics')
    .select('payment_status, is_subscription_active, trial_end_date, next_billing_date')
    .eq('id', clinicId)
    .single();

  if (error || !clinic) {
    return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
  }

  const now = new Date();

  if (clinic.payment_status === 'active') return true;

  if (clinic.payment_status === 'trial') {
    if (clinic.trial_end_date && new Date(clinic.trial_end_date) > now) return true;
    return makeInactiveResponse(clinicId, 'expired');
  }

  if (clinic.payment_status === 'past_due' && clinic.next_billing_date) {
    const graceDeadline = new Date(clinic.next_billing_date);
    graceDeadline.setDate(graceDeadline.getDate() + GRACE_PERIOD_DAYS);
    if (graceDeadline > now) return true;
  }

  return makeInactiveResponse(clinicId, clinic.payment_status ?? 'expired');
}

function makeInactiveResponse(clinicId: string, paymentStatus: string): NextResponse {
  return NextResponse.json(
    {
      error: 'subscription_inactive',
      message: 'Your subscription is inactive. Please renew to continue.',
      payment_status: paymentStatus,
      billing_url: `/clinic/${clinicId}/billing`,
    },
    { status: 403 },
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors in `plan-gating.ts`

- [ ] **Step 3: Commit**

```bash
git add src/lib/plan-gating.ts
git commit -m "feat(billing): add requireActiveSubscription for payment-aware gating"
```

---

### Task 3: Enforce Subscription Check on Mutation Routes

**Files:**
- Modify: `src/app/api/appointments/route.ts` (POST handler)
- Modify: `src/app/api/clinic/[clinicId]/practitioners/invite/route.ts` (POST handler)
- Modify: `src/app/api/clinic/[clinicId]/branches/route.ts` (POST handler)

**Interfaces:**
- Consumes: `requireActiveSubscription` from `src/lib/plan-gating.ts`

- [ ] **Step 1: Add subscription check to appointments POST**

In `src/app/api/appointments/route.ts`, add import at top:

```typescript
import { requireActiveSubscription } from '@/lib/plan-gating';
```

Inside the `POST` function, after the `clinic_id` is extracted from the body (around line 71), add:

```typescript
    if (clinic_id) {
      const subCheck = await requireActiveSubscription(clinic_id);
      if (subCheck !== true) return subCheck;
    }
```

- [ ] **Step 2: Add subscription check to practitioner invite POST**

In `src/app/api/clinic/[clinicId]/practitioners/invite/route.ts`, add import at top:

```typescript
import { requireActiveSubscription } from '@/lib/plan-gating';
```

Inside the `POST` function, after `clinicId` is extracted from params (line 31), add before the auth check:

```typescript
    const subCheck = await requireActiveSubscription(clinicId);
    if (subCheck !== true) return subCheck;
```

- [ ] **Step 3: Add subscription check to branches POST**

In `src/app/api/clinic/[clinicId]/branches/route.ts`, add import at top:

```typescript
import { requireActiveSubscription } from '@/lib/plan-gating';
```

Inside the `POST` function, after the `authenticateClinicRequest` check (after line 41), add before `requirePlan`:

```typescript
    const subCheck = await requireActiveSubscription(clinicId);
    if (subCheck !== true) return subCheck;
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/appointments/route.ts
git add "src/app/api/clinic/[clinicId]/practitioners/invite/route.ts"
git add "src/app/api/clinic/[clinicId]/branches/route.ts"
git commit -m "feat(billing): enforce subscription check on mutation routes"
```

---

### Task 4: Webhook Security Hardening

**Files:**
- Modify: `src/lib/paymongo.ts`
- Modify: `src/app/api/webhooks/paymongo/route.ts`

**Interfaces:**
- Consumes: `PAYMONGO_WEBHOOK_SECRET` env var
- Produces: Webhook rejects unsigned/missing-signature requests

- [ ] **Step 1: Harden `verifyWebhookSignature` in `src/lib/paymongo.ts`**

Replace the first line of the function body (line 161, the `if (!webhookSecret) return true;` block):

```typescript
export function verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
  if (!webhookSecret) {
    console.error('PAYMONGO_WEBHOOK_SECRET not configured — rejecting webhook');
    return false;
  }
```

The rest of the function stays unchanged.

- [ ] **Step 2: Harden signature check in webhook route**

In `src/app/api/webhooks/paymongo/route.ts`, replace lines 9-11:

Old:
```typescript
    const signature = request.headers.get('paymongo-signature') || '';
    if (signature && !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
```

New:
```typescript
    const signature = request.headers.get('paymongo-signature');
    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
```

- [ ] **Step 3: Extend `activateClinicSubscription` to reset renewal fields**

In the same webhook file, in the `activateClinicSubscription` function, update the clinic update call (around line 64) to also clear renewal tracking fields:

```typescript
  await supabaseAdmin
    .from('clinics')
    .update({
      subscription_plan: plan_slug,
      is_trial_active: false,
      is_subscription_active: true,
      payment_status: 'active',
      last_payment_date: new Date().toISOString(),
      next_billing_date: nextBillingDate.toISOString(),
      paymongo_checkout_session_id: checkoutSessionId,
      pending_checkout_session_id: null,
      reminder_count: 0,
      last_reminder_sent_at: null,
    })
    .eq('id', clinic_id);
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/paymongo.ts
git add src/app/api/webhooks/paymongo/route.ts
git commit -m "fix(billing): harden webhook signature validation and reset renewal fields on payment"
```

---

### Task 5: Clinic Context Extension and BillingBanner Component

**Files:**
- Modify: `src/app/(clinic)/clinic/[clinicId]/clinic-context.tsx`
- Create: `src/components/clinic/BillingBanner.tsx`
- Modify: `src/app/(clinic)/clinic/[clinicId]/layout.tsx`

**Interfaces:**
- Consumes: `ClinicContextType` from clinic-context, `useClinicContext()` hook, `PermissionKey` from `src/lib/permissions`
- Produces: `BillingBanner` component rendered in clinic layout; `isReadOnly` and `paymentStatus` on context

- [ ] **Step 1: Extend `ClinicContextType` in `src/app/(clinic)/clinic/[clinicId]/clinic-context.tsx`**

Add two new fields to `ClinicContextType` (after line 48, before the closing `}`):

```typescript
  isReadOnly: boolean;
  paymentStatus: string;
```

Update the default context (in `createContext`, around line 51) to include:

```typescript
  isReadOnly: false,
  paymentStatus: 'trial',
```

- [ ] **Step 2: Create `src/components/clinic/BillingBanner.tsx`**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, AlertCircle, CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClinicContext } from '@/app/(clinic)/clinic/[clinicId]/clinic-context';

function getDaysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getDaysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

type BannerState = {
  color: 'yellow' | 'orange' | 'red';
  icon: typeof AlertTriangle;
  title: string;
  description: string;
  actionLabel: string;
} | null;

function useBannerState(): BannerState {
  const { clinic, paymentStatus } = useClinicContext();
  if (!clinic) return null;

  const trialDays = getDaysUntil(clinic.trial_end_date);
  const overdueDays = getDaysSince(clinic.next_billing_date);

  if (paymentStatus === 'trial' && trialDays !== null && trialDays <= 3 && trialDays > 0) {
    return {
      color: 'yellow',
      icon: AlertTriangle,
      title: `Your free trial ends in ${trialDays} day${trialDays === 1 ? '' : 's'}`,
      description: 'Subscribe now to keep your clinic running without interruption.',
      actionLabel: 'Subscribe Now',
    };
  }

  if (paymentStatus === 'expired' && clinic.is_trial_active === false && !clinic.is_subscription_active) {
    if (clinic.next_billing_date && overdueDays !== null && overdueDays > 0) {
      return {
        color: 'red',
        icon: AlertCircle,
        title: 'Your subscription has expired',
        description: "You're in read-only mode. Renew to create appointments and manage your clinic.",
        actionLabel: 'Renew Now',
      };
    }
    return {
      color: 'red',
      icon: AlertCircle,
      title: 'Your free trial has ended',
      description: "You're in read-only mode. Subscribe to create appointments and manage your clinic.",
      actionLabel: 'Subscribe Now',
    };
  }

  if (paymentStatus === 'past_due' && overdueDays !== null) {
    return {
      color: 'orange',
      icon: AlertTriangle,
      title: `Your payment is ${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`,
      description: `Pay within ${7 - overdueDays} day${7 - overdueDays === 1 ? '' : 's'} to avoid losing access.`,
      actionLabel: 'Pay Now',
    };
  }

  return null;
}

const COLOR_CLASSES = {
  yellow: {
    bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    title: 'text-amber-700 dark:text-amber-400',
    desc: 'text-amber-600/80 dark:text-amber-400/80',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    title: 'text-orange-700 dark:text-orange-400',
    desc: 'text-orange-600/80 dark:text-orange-400/80',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    title: 'text-red-700 dark:text-red-400',
    desc: 'text-red-600/80 dark:text-red-400/80',
  },
} as const;

export default function BillingBanner() {
  const { clinic, staffRole } = useClinicContext();
  const [dismissed, setDismissed] = useState(false);
  const banner = useBannerState();

  if (!banner || dismissed) return null;

  const classes = COLOR_CLASSES[banner.color];
  const Icon = banner.icon;
  const canPay = staffRole === 'owner' || staffRole === 'admin';
  const isDismissible = banner.color === 'yellow';

  return (
    <div className={`mb-6 p-4 rounded-2xl border ${classes.bg}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Icon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${classes.title}`} />
          <div>
            <h3 className={`font-semibold ${classes.title}`}>{banner.title}</h3>
            <p className={`text-sm mt-1 ${classes.desc}`}>{banner.description}</p>
            {!canPay && (
              <p className={`text-sm mt-1 ${classes.desc}`}>
                Contact your clinic administrator to manage billing.
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canPay && (
            <Link href={`/clinic/${clinic?.id}/billing`}>
              <Button
                className={
                  banner.color === 'red'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : banner.color === 'orange'
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-clinic-teal hover:bg-clinic-teal/90 text-white'
                }
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {banner.actionLabel}
              </Button>
            </Link>
          )}
          {isDismissible && (
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X className="w-4 h-4 text-amber-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update clinic layout to use BillingBanner and expose new context fields**

In `src/app/(clinic)/clinic/[clinicId]/layout.tsx`:

Add import at top:
```typescript
import BillingBanner from '@/components/clinic/BillingBanner';
```

In the `ClinicContext.Provider` value (around line 140), add the two new fields:

```typescript
        isReadOnly: clinic?.payment_status === 'expired',
        paymentStatus: clinic?.payment_status ?? 'trial',
```

Replace the entire existing trial/subscription banner block (lines 196-269 — the `{clinic?.payment_status === 'trial' && ...}` block) AND the trial expired overlay block (lines 271-297 — the `{isTrialExpired && ...}` block) with:

```tsx
            <BillingBanner />
```

This single component handles all billing states (trial ending, trial expired, past_due, expired) instead of the two separate blocks.

- [ ] **Step 4: Remove unused imports from layout**

After replacing the banner blocks, the following imports are no longer needed in the layout file and can be removed:
- `Progress` from `@/components/ui/progress`
- `Clock` from `lucide-react`
- `AlertTriangle` from `lucide-react`
- `CreditCard` from `lucide-react`
- `AlertCircle` from `lucide-react`
- `Lock` from `lucide-react`

Keep: `Activity` (used by loading spinner).

Also remove the `calculateTrialStatus` function, `trialDaysRemaining` state, and `isTrialExpired` state since the BillingBanner handles this internally.

Note: `isTrialExpired` and `trialDaysRemaining` are still on the `ClinicContextType` — they're used by the sidebar. Keep them on context but compute them from `clinic.payment_status` and `clinic.trial_end_date` directly rather than via a separate function.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(clinic)/clinic/[clinicId]/clinic-context.tsx"
git add src/components/clinic/BillingBanner.tsx
git add "src/app/(clinic)/clinic/[clinicId]/layout.tsx"
git commit -m "feat(billing): add BillingBanner component with payment-status-aware context"
```

---

### Task 6: Registration Update — Set `trial_end_date`

**Files:**
- Modify: `src/app/api/clinic/register/route.ts`
- Modify: `src/app/api/super-admin/clinics/route.ts`

**Interfaces:**
- Produces: New clinics always have `trial_end_date` set to `now + 14 days`

- [ ] **Step 1: Verify `trial_end_date` is already set in registration route**

Read `src/app/api/clinic/register/route.ts` around line 92. The explore agent found it already sets `trial_end_date: trialEndDate.toISOString()`. Verify this is correct — `trialEndDate` should be `trialStartDate + 14 days`.

If already correct, no change needed. Move to step 2.

- [ ] **Step 2: Verify super-admin clinic creation also sets `trial_end_date`**

Read `src/app/api/super-admin/clinics/route.ts` around line 145. Verify `trial_end_date` is set. If already present, no change needed.

- [ ] **Step 3: Commit (only if changes were made)**

```bash
git add src/app/api/clinic/register/route.ts
git add src/app/api/super-admin/clinics/route.ts
git commit -m "feat(billing): ensure trial_end_date set on clinic creation"
```

---

### Task 7: Supabase Edge Function — Billing Lifecycle

**Files:**
- Create: `supabase/functions/billing-lifecycle/index.ts`

**Interfaces:**
- Consumes: `clinics` table (payment_status, trial_end_date, next_billing_date, subscription_plan, reminder_count, last_reminder_sent_at), `clinic_admins` table (owner lookup), `subscription_plans` table (price lookup), `email_notifications` table (email queueing), `notifications` table (in-app notifications)
- Consumes: PayMongo API for creating checkout sessions (`https://api.paymongo.com/v1/checkout_sessions`)
- Produces: Updates clinic payment_status, sends emails, creates notifications, creates renewal checkout sessions

- [ ] **Step 1: Create the Edge Function**

Create `supabase/functions/billing-lifecycle/index.ts`:

```typescript
// @ts-nocheck - Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PAYMONGO_SECRET_KEY = Deno.env.get('PAYMONGO_SECRET_KEY');
const APP_URL = Deno.env.get('APP_URL') || 'https://mediflow.apprisingcreatives.com';
const GRACE_PERIOD_DAYS = 7;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

async function getClinicOwner(clinicId: string) {
  const { data } = await supabase
    .from('clinic_admins')
    .select('auth_user_id, email, name')
    .eq('clinic_id', clinicId)
    .eq('staff_role', 'owner')
    .eq('is_active', true)
    .limit(1)
    .single();
  return data;
}

async function queueEmail(
  clinicId: string,
  recipientEmail: string,
  recipientName: string,
  subject: string,
  body: string,
  htmlBody: string,
  notificationType: string,
) {
  await supabase.from('email_notifications').insert({
    recipient_email: recipientEmail,
    recipient_name: recipientName,
    recipient_type: 'clinic',
    subject,
    body,
    html_body: htmlBody,
    notification_type: notificationType,
    related_entity_type: 'clinic',
    related_entity_id: clinicId,
    status: 'pending',
  });
}

async function createInAppNotification(
  recipientId: string,
  clinicId: string,
  title: string,
  message: string,
  type: string,
) {
  await supabase.from('notifications').insert({
    recipient_id: recipientId,
    recipient_type: 'clinic_admin',
    clinic_id: clinicId,
    type,
    title,
    message,
    action_url: `/clinic/${clinicId}/billing`,
    metadata: {},
  });
}

async function createPayMongoCheckout(
  clinicId: string,
  planSlug: string,
  billingCycle: string,
  price: number,
  planName: string,
): Promise<string | null> {
  if (!PAYMONGO_SECRET_KEY) {
    console.error('PAYMONGO_SECRET_KEY not set — skipping checkout creation');
    return null;
  }

  const amountInCentavos = Math.round(price * 100);
  const cycleLabel = billingCycle === 'yearly' ? 'Annual' : 'Monthly';

  try {
    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${PAYMONGO_SECRET_KEY}:`)}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: [{
              name: `MediFlow ${planName} Plan`,
              amount: amountInCentavos,
              currency: 'PHP',
              quantity: 1,
              description: `${planName} — ${cycleLabel} Subscription Renewal`,
            }],
            description: `MediFlow ${planName} Plan Renewal`,
            metadata: {
              type: 'clinic_subscription',
              clinic_id: clinicId,
              plan_slug: planSlug,
              billing_cycle: billingCycle,
              amount: String(price),
            },
            success_url: `${APP_URL}/clinic/${clinicId}/billing?payment=success`,
            cancel_url: `${APP_URL}/clinic/${clinicId}/billing?payment=cancelled`,
            payment_method_types: ['card', 'gcash', 'grab_pay', 'paymaya'],
            reference_number: `renewal-${clinicId}-${Date.now()}`,
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
          },
        },
      }),
    });

    const json = await response.json();
    const session = json?.data;
    return session?.attributes?.checkout_url || session?.attributes?.url || null;
  } catch (err) {
    console.error(`Failed to create checkout for clinic ${clinicId}:`, err);
    return null;
  }
}

// Phase A: Expire trials that have passed their end date
async function phaseTrialExpiry() {
  const { data: clinics } = await supabase
    .from('clinics')
    .select('id, name, subscription_plan')
    .eq('is_trial_active', true)
    .lte('trial_end_date', new Date().toISOString());

  if (!clinics?.length) return;
  console.log(`Phase A: ${clinics.length} trial(s) to expire`);

  for (const clinic of clinics) {
    await supabase
      .from('clinics')
      .update({
        is_trial_active: false,
        is_subscription_active: false,
        payment_status: 'expired',
      })
      .eq('id', clinic.id);

    const owner = await getClinicOwner(clinic.id);
    if (owner) {
      await queueEmail(
        clinic.id,
        owner.email,
        owner.name,
        'Your MediFlow trial has ended',
        `Dear ${owner.name}, your 14-day free trial for ${clinic.name} has ended. Subscribe now to continue managing your clinic.`,
        `<h1>Trial Ended</h1><p>Dear ${owner.name},</p><p>Your 14-day free trial for <strong>${clinic.name}</strong> has ended.</p><p>Your clinic is now in read-only mode. <a href="${APP_URL}/clinic/${clinic.id}/billing">Subscribe now</a> to restore full access.</p>`,
        'trial_expired',
      );

      await createInAppNotification(
        owner.auth_user_id,
        clinic.id,
        'Trial Ended',
        'Your free trial has ended. Subscribe to continue.',
        'trial.expiring',
      );
    }
  }
}

// Phase B: Warn about trials ending within 3 days
async function phaseTrialEndingSoon() {
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const { data: clinics } = await supabase
    .from('clinics')
    .select('id, name, trial_end_date, last_reminder_sent_at')
    .eq('is_trial_active', true)
    .gt('trial_end_date', now.toISOString())
    .lte('trial_end_date', threeDaysLater.toISOString());

  if (!clinics?.length) return;
  console.log(`Phase B: ${clinics.length} trial(s) ending soon`);

  for (const clinic of clinics) {
    if (clinic.last_reminder_sent_at && new Date(clinic.last_reminder_sent_at) > oneDayAgo) continue;

    const daysLeft = daysBetween(now, new Date(clinic.trial_end_date));
    const owner = await getClinicOwner(clinic.id);

    if (owner) {
      await queueEmail(
        clinic.id,
        owner.email,
        owner.name,
        `Your MediFlow trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
        `Dear ${owner.name}, your free trial for ${clinic.name} ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Subscribe now to avoid losing access.`,
        `<h1>Trial Ending Soon</h1><p>Dear ${owner.name},</p><p>Your free trial for <strong>${clinic.name}</strong> ends in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>.</p><p><a href="${APP_URL}/clinic/${clinic.id}/billing">Subscribe now</a> to keep your clinic running.</p>`,
        'trial_ending',
      );

      await createInAppNotification(
        owner.auth_user_id,
        clinic.id,
        'Trial Ending Soon',
        `Your free trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Subscribe now.`,
        'trial.expiring',
      );
    }

    await supabase
      .from('clinics')
      .update({ last_reminder_sent_at: now.toISOString() })
      .eq('id', clinic.id);
  }
}

// Phase C: Send renewal reminders 3 days before billing
async function phaseRenewalReminder() {
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const { data: clinics } = await supabase
    .from('clinics')
    .select('id, name, subscription_plan, next_billing_date, last_reminder_sent_at')
    .eq('payment_status', 'active')
    .gt('next_billing_date', now.toISOString())
    .lte('next_billing_date', threeDaysLater.toISOString());

  if (!clinics?.length) return;
  console.log(`Phase C: ${clinics.length} renewal reminder(s) to send`);

  for (const clinic of clinics) {
    if (clinic.last_reminder_sent_at && new Date(clinic.last_reminder_sent_at) > oneDayAgo) continue;

    const planSlug = clinic.subscription_plan || 'starter';
    const basePlan = planSlug.replace(/-yearly$/, '');
    const billingCycle = planSlug.endsWith('-yearly') ? 'yearly' : 'monthly';

    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('name, price')
      .eq('slug', planSlug)
      .eq('is_active', true)
      .single();

    if (!plan) continue;

    const checkoutUrl = await createPayMongoCheckout(
      clinic.id, planSlug, billingCycle, plan.price, plan.name,
    );

    if (checkoutUrl) {
      await supabase
        .from('clinics')
        .update({ pending_checkout_session_id: checkoutUrl })
        .eq('id', clinic.id);
    }

    const owner = await getClinicOwner(clinic.id);
    if (owner) {
      const payLink = checkoutUrl || `${APP_URL}/clinic/${clinic.id}/billing`;
      await queueEmail(
        clinic.id,
        owner.email,
        owner.name,
        'Your MediFlow subscription renews soon',
        `Dear ${owner.name}, your ${plan.name} plan for ${clinic.name} renews in 3 days (₱${plan.price.toLocaleString()}). Pay now to avoid interruption: ${payLink}`,
        `<h1>Subscription Renewal</h1><p>Dear ${owner.name},</p><p>Your <strong>${plan.name}</strong> plan for <strong>${clinic.name}</strong> renews in 3 days.</p><p>Amount: <strong>₱${plan.price.toLocaleString()}</strong></p><p><a href="${payLink}">Pay now</a> to avoid any interruption to your service.</p>`,
        'renewal_reminder',
      );

      await createInAppNotification(
        owner.auth_user_id,
        clinic.id,
        'Subscription Renewal Due',
        `Your ${plan.name} plan renews in 3 days (₱${plan.price.toLocaleString()}).`,
        'payment.status_changed',
      );
    }

    await supabase
      .from('clinics')
      .update({ last_reminder_sent_at: now.toISOString(), reminder_count: 0 })
      .eq('id', clinic.id);
  }
}

// Phase D: Grace period management for overdue payments
async function phaseGracePeriod() {
  const now = new Date();

  const { data: clinics } = await supabase
    .from('clinics')
    .select('id, name, subscription_plan, next_billing_date, reminder_count, payment_status')
    .or(`payment_status.eq.past_due,and(payment_status.eq.active,next_billing_date.lt.${now.toISOString()})`);

  if (!clinics?.length) return;
  console.log(`Phase D: ${clinics.length} clinic(s) in grace period`);

  for (const clinic of clinics) {
    if (!clinic.next_billing_date) continue;

    const overdueDays = daysBetween(new Date(clinic.next_billing_date), now);
    const owner = await getClinicOwner(clinic.id);

    if (overdueDays >= GRACE_PERIOD_DAYS) {
      await supabase
        .from('clinics')
        .update({
          payment_status: 'expired',
          is_subscription_active: false,
        })
        .eq('id', clinic.id);

      if (owner) {
        await queueEmail(
          clinic.id,
          owner.email,
          owner.name,
          'Your MediFlow subscription has been suspended',
          `Dear ${owner.name}, your subscription for ${clinic.name} has been suspended due to non-payment. Your clinic is now in read-only mode.`,
          `<h1>Subscription Suspended</h1><p>Dear ${owner.name},</p><p>Your subscription for <strong>${clinic.name}</strong> has been suspended due to non-payment.</p><p>Your clinic is now in read-only mode. <a href="${APP_URL}/clinic/${clinic.id}/billing">Renew now</a> to restore access.</p>`,
          'subscription_expired',
        );

        await createInAppNotification(
          owner.auth_user_id,
          clinic.id,
          'Subscription Suspended',
          'Your subscription has been suspended. Renew to restore access.',
          'payment.status_changed',
        );
      }
      continue;
    }

    // Transition active → past_due on day 0
    if (clinic.payment_status === 'active') {
      await supabase
        .from('clinics')
        .update({ payment_status: 'past_due', reminder_count: 1 })
        .eq('id', clinic.id);

      if (owner) {
        const daysRemaining = GRACE_PERIOD_DAYS - overdueDays;
        await queueEmail(
          clinic.id,
          owner.email,
          owner.name,
          'Action required: MediFlow payment overdue',
          `Dear ${owner.name}, your payment for ${clinic.name} is overdue. You have ${daysRemaining} days to pay before your clinic is suspended.`,
          `<h1>Payment Overdue</h1><p>Dear ${owner.name},</p><p>Your payment for <strong>${clinic.name}</strong> is overdue.</p><p>You have <strong>${daysRemaining} days</strong> to pay before your clinic is suspended.</p><p><a href="${APP_URL}/clinic/${clinic.id}/billing">Pay now</a></p>`,
          'payment_overdue',
        );

        await createInAppNotification(
          owner.auth_user_id,
          clinic.id,
          'Payment Overdue',
          `Your payment is overdue. ${daysRemaining} days remaining before suspension.`,
          'payment.status_changed',
        );
      }
      continue;
    }

    // Escalating reminders at day 4 and day 6
    if (overdueDays >= 4 && (clinic.reminder_count ?? 0) < 2) {
      const daysRemaining = GRACE_PERIOD_DAYS - overdueDays;
      if (owner) {
        await queueEmail(
          clinic.id,
          owner.email,
          owner.name,
          `Urgent: MediFlow payment overdue — ${daysRemaining} days remaining`,
          `Dear ${owner.name}, your payment for ${clinic.name} is ${overdueDays} days overdue. You have ${daysRemaining} days before your clinic is suspended.`,
          `<h1>Urgent: Payment Overdue</h1><p>Dear ${owner.name},</p><p>Your payment for <strong>${clinic.name}</strong> is <strong>${overdueDays} days overdue</strong>.</p><p><strong>${daysRemaining} days remaining</strong> before your clinic is suspended.</p><p><a href="${APP_URL}/clinic/${clinic.id}/billing">Pay now</a></p>`,
          'payment_warning',
        );
      }
      await supabase
        .from('clinics')
        .update({ reminder_count: 2, last_reminder_sent_at: now.toISOString() })
        .eq('id', clinic.id);
    } else if (overdueDays >= 6 && (clinic.reminder_count ?? 0) < 3) {
      if (owner) {
        await queueEmail(
          clinic.id,
          owner.email,
          owner.name,
          'Final warning: MediFlow payment overdue — 1 day remaining',
          `Dear ${owner.name}, FINAL WARNING: your payment for ${clinic.name} is ${overdueDays} days overdue. Your clinic will be suspended tomorrow.`,
          `<h1>Final Warning</h1><p>Dear ${owner.name},</p><p><strong>FINAL WARNING:</strong> Your payment for <strong>${clinic.name}</strong> is <strong>${overdueDays} days overdue</strong>.</p><p>Your clinic will be <strong>suspended tomorrow</strong> if payment is not received.</p><p><a href="${APP_URL}/clinic/${clinic.id}/billing">Pay now</a></p>`,
          'payment_warning',
        );
      }
      await supabase
        .from('clinics')
        .update({ reminder_count: 3, last_reminder_sent_at: now.toISOString() })
        .eq('id', clinic.id);
    }
  }
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ') || authHeader.substring(7) !== SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Billing lifecycle run starting...');

    await phaseTrialExpiry();
    await phaseTrialEndingSoon();
    await phaseRenewalReminder();
    await phaseGracePeriod();

    console.log('Billing lifecycle run complete.');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Billing lifecycle error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

- [ ] **Step 2: Test the function locally**

Run: `supabase functions serve billing-lifecycle --no-verify-jwt`

In another terminal:
```bash
curl -X POST http://localhost:54321/functions/v1/billing-lifecycle \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json"
```

Expected: `{"success": true}` and console logs showing phase processing.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/billing-lifecycle/index.ts
git commit -m "feat(billing): add billing-lifecycle Edge Function with trial expiry, reminders, and grace period"
```

---

### Task 8: pg_cron Migration for Daily Scheduling

**Files:**
- Create: `supabase/migrations/20260630000002_billing_lifecycle_cron.sql`

**Interfaces:**
- Consumes: `billing-lifecycle` Edge Function from Task 7
- Produces: Daily cron job at 2 AM UTC calling the Edge Function

- [ ] **Step 1: Create the cron migration**

```sql
-- Schedule daily billing lifecycle Edge Function via pg_cron + pg_net
-- Requires pg_cron and pg_net extensions (enabled by default on Supabase)

SELECT cron.schedule(
  'billing-lifecycle-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/billing-lifecycle',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Note: The exact secret names in `vault.decrypted_secrets` depend on the Supabase project configuration. On hosted Supabase, `service_role_key` may need to be stored manually in the vault. An alternative is to use the project's settings:

```sql
-- Alternative if vault secrets are not configured:
-- Store the function URL and key as app settings or hardcode for the project
```

This migration will be applied during deployment to the hosted Supabase project. It will not run on local development since local Supabase typically doesn't have `pg_cron` enabled.

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260630000002_billing_lifecycle_cron.sql
git commit -m "feat(billing): add pg_cron schedule for daily billing lifecycle"
```

---

### Task 9: Add Billing Notification Types to Database Types

**Files:**
- Modify: `src/types/database.ts`

**Interfaces:**
- Produces: Extended `NotificationType` union with billing-specific types

- [ ] **Step 1: Check if types already exist**

The `NotificationType` already includes `trial.expiring` and `payment.status_changed`. These cover all the in-app notification scenarios:
- Trial ending soon → `trial.expiring`
- Trial expired → `trial.expiring`
- Renewal reminder → `payment.status_changed`
- Payment overdue → `payment.status_changed`
- Subscription suspended → `payment.status_changed`

No new types needed. This task is a verification step.

- [ ] **Step 2: Verify and commit (only if changes made)**

If no changes needed, skip commit. If new types were added:

```bash
git add src/types/database.ts
git commit -m "feat(billing): add billing notification types"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Migration — billing lifecycle columns | `supabase/migrations/20260630000001_billing_lifecycle.sql` |
| 2 | Payment-aware plan gating | `src/lib/plan-gating.ts` |
| 3 | Enforce on mutation routes | `appointments/route.ts`, `invite/route.ts`, `branches/route.ts` |
| 4 | Webhook security hardening | `src/lib/paymongo.ts`, `webhooks/paymongo/route.ts` |
| 5 | BillingBanner + context | `BillingBanner.tsx`, `clinic-context.tsx`, `layout.tsx` |
| 6 | Registration update | `register/route.ts`, `super-admin/clinics/route.ts` |
| 7 | Billing lifecycle Edge Function | `supabase/functions/billing-lifecycle/index.ts` |
| 8 | pg_cron daily schedule | `supabase/migrations/20260630000002_billing_lifecycle_cron.sql` |
| 9 | Verify notification types | `src/types/database.ts` |
