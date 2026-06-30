# Production Subscription Billing

## Problem

The subscription system has four gaps that prevent production use:

1. **Plan gating ignores payment status** — `plan-gating.ts` checks `subscription_plan` but not `is_subscription_active` or `payment_status`. Unpaid clinics retain full access.
2. **No trial expiry enforcement** — clinics start with `is_trial_active: true` and a 14-day trial, but nothing locks them out when the trial ends.
3. **No recurring billing** — PayMongo checkout is one-time. When `next_billing_date` passes, nothing happens.
4. **Webhook signature not enforced** — `verifyWebhookSignature` returns `true` when `PAYMONGO_WEBHOOK_SECRET` is missing, allowing spoofed webhook calls.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Renewal mechanism | Email reminder + in-app banner + auto-created checkout | PayMongo has no recurring subscription API; dual-channel maximizes payment conversion |
| Lockout type | Soft lockout (read-only) | Clinics keep viewing data but can't create appointments, add resources, or use premium features |
| Grace period | 7 days after billing date | Gives clinics time to process payment without losing access immediately |
| Trial flow | No card upfront | Lower signup friction; prompt to subscribe as trial nears end |
| Billing email recipient | Owner only | Owners have financial authority; reduces noise for other staff |
| In-app banner actions | Owner + Admin see "Pay Now"; others see "Contact your administrator" | Aligns with existing `billing.view` permission gating |
| Cron mechanism | Supabase Edge Function + pg_cron | Server-side, no external infra, runs daily |

## Architecture

### Subscription States

```
[Registration]
      |
      v
  TRIAL (14 days)
      |
      +-- pays before expiry --> ACTIVE
      |
      +-- trial expires ------> EXPIRED (soft lockout)
                                    |
                                    +-- pays --> ACTIVE
                                    
  ACTIVE
      |
      +-- next_billing_date - 3 days --> renewal reminder sent
      |
      +-- next_billing_date passes ----> PAST_DUE (grace period starts)
      |                                     |
      |                                     +-- pays within 7 days --> ACTIVE
      |                                     |
      |                                     +-- 7 days pass ---------> EXPIRED (soft lockout)
      |
      +-- webhook: payment.failed ------> PAST_DUE
```

### Payment Status Values

| Status | Meaning | Access Level |
|--------|---------|-------------|
| `trial` | Within 14-day trial period | Full access |
| `active` | Paid and current | Full access |
| `past_due` | Billing date passed, within 7-day grace | Full access + warning banner |
| `expired` | Trial ended or grace period exceeded | Read-only (soft lockout) |

## Components

### 1. Payment-Aware Plan Gating

**File:** `src/lib/plan-gating.ts`

New function `requireActiveSubscription(clinicId)` returns `true` or a `NextResponse(403)`.

Access is granted when any of these hold:
- `payment_status = 'active'`
- `payment_status = 'trial'` AND `trial_end_date > now()`
- `payment_status = 'past_due'` AND `next_billing_date + 7 days > now()`

Soft-lockout response (403):
```json
{
  "error": "subscription_inactive",
  "message": "Your subscription is inactive. Please renew to continue.",
  "payment_status": "expired",
  "billing_url": "/clinic/{clinicId}/billing"
}
```

**Enforcement points** (mutation routes only, reads stay open):
- `POST /api/appointments` — create appointment
- `POST /api/clinic/[clinicId]/practitioners/invite` — add practitioner
- `POST /api/clinic/[clinicId]/branches` — create branch
- All routes that call `checkResourceLimit()` — add `requireActiveSubscription` at the start
- AI feature routes that call `requirePlan()`

### 2. Database Migration

**File:** `supabase/migrations/TIMESTAMP_billing_lifecycle.sql`

Alter `clinics` table:

```sql
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pending_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_count INTEGER NOT NULL DEFAULT 0;
```

Backfill existing trial clinics:

```sql
UPDATE public.clinics
SET trial_end_date = created_at + INTERVAL '14 days'
WHERE is_trial_active = true
  AND trial_end_date IS NULL;
```

Set `trial_end_date` on new clinics during registration (application code, not DB default — keeps migration simple).

### 3. Billing Lifecycle Edge Function

**File:** `supabase/functions/billing-lifecycle/index.ts`

Runs daily via pg_cron. Invoked by a SQL cron entry:

```sql
SELECT cron.schedule(
  'billing-lifecycle',
  '0 2 * * *',  -- 2 AM daily
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/billing-lifecycle',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
  )$$
);
```

Four sequential phases per run:

**Phase A — Trial expiry:**
```sql
SELECT id, subscription_plan FROM clinics
WHERE is_trial_active = true
  AND trial_end_date <= now();
```
For each: set `is_trial_active = false`, `payment_status = 'expired'`, `is_subscription_active = false`. Send "trial expired" email to owner. Create in-app notification.

**Phase B — Trial ending soon (3 days):**
```sql
SELECT id FROM clinics
WHERE is_trial_active = true
  AND trial_end_date > now()
  AND trial_end_date <= now() + INTERVAL '3 days'
  AND (last_reminder_sent_at IS NULL OR last_reminder_sent_at < now() - INTERVAL '1 day');
```
Send "trial ending" email to owner with subscribe link. Create in-app notification. Update `last_reminder_sent_at`.

**Phase C — Pre-renewal reminder (3 days before billing):**
```sql
SELECT id, subscription_plan, next_billing_date FROM clinics
WHERE payment_status = 'active'
  AND next_billing_date <= now() + INTERVAL '3 days'
  AND next_billing_date > now()
  AND (last_reminder_sent_at IS NULL OR last_reminder_sent_at < now() - INTERVAL '1 day');
```
For each: create PayMongo checkout session for same plan/cycle. Store `pending_checkout_session_id`. Send "renewal due" email to owner with checkout link. Create in-app notification. Update `last_reminder_sent_at`, reset `reminder_count = 0`.

**Phase D — Grace period management:**
```sql
SELECT id, next_billing_date, reminder_count FROM clinics
WHERE payment_status = 'past_due'
  OR (payment_status = 'active' AND next_billing_date < now());
```

For each clinic, based on days overdue (`now() - next_billing_date`):
- Day 0: set `payment_status = 'past_due'`, send first warning email, `reminder_count = 1`
- Day 4 (if `reminder_count < 2`): send follow-up warning, `reminder_count = 2`
- Day 6 (if `reminder_count < 3`): send final warning, `reminder_count = 3`
- Day 7+: set `payment_status = 'expired'`, `is_subscription_active = false`, send lockout notification

All emails inserted into `email_notifications` table (existing pattern). All in-app notifications via `createNotifications()` from `src/lib/notifications.ts` (or direct Supabase insert from Edge Function).

### 4. Webhook Security Hardening

**File:** `src/lib/paymongo.ts`

Change `verifyWebhookSignature` to reject when secret is missing:

```typescript
export function verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
  if (!webhookSecret) {
    console.error('PAYMONGO_WEBHOOK_SECRET not configured — rejecting webhook');
    return false;
  }
  // ... rest unchanged
}
```

**File:** `src/app/api/webhooks/paymongo/route.ts`

Change the signature check to reject empty signatures:

```typescript
const signature = request.headers.get('paymongo-signature');
if (!signature || !verifyWebhookSignature(rawBody, signature)) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

### 5. In-App Billing Banner

**File:** `src/components/clinic/BillingBanner.tsx`

Rendered in `src/app/(clinic)/clinic/[clinicId]/layout.tsx` above the main content area.

Uses clinic context for `payment_status`, `trial_end_date`, `next_billing_date`. Uses permissions context for `hasPermission('billing.view')` or staff role check.

| State | Banner Color | Message | Action |
|-------|-------------|---------|--------|
| Trial ending (<=3 days) | Yellow | "Your free trial ends in X days" | Owner/Admin: "Subscribe Now" button. Others: "Contact your administrator" |
| Trial expired | Red | "Your free trial has ended. You're in read-only mode." | Owner/Admin: "Subscribe Now". Others: "Contact your administrator" |
| Past due (grace) | Orange | "Your payment is X days overdue" | Owner/Admin: "Pay Now". Others: "Contact your administrator" |
| Expired (post-grace) | Red | "Your subscription has expired. You're in read-only mode." | Owner/Admin: "Renew Now". Others: "Contact your administrator" |
| Active | Hidden | — | — |
| Trial (>3 days left) | Hidden | — | — |

"Pay Now" / "Subscribe Now" links to `/clinic/{clinicId}/billing`.

Banner is dismissible per session (local state) but reappears on next login for expired/past_due states.

### 6. Clinic Context Extension

**File:** `src/app/(clinic)/clinic/[clinicId]/clinic-context.tsx`

Add to context:
- `paymentStatus: string`
- `trialEndDate: string | null`
- `isSubscriptionActive: boolean`
- `isReadOnly: boolean` — derived: `payment_status === 'expired'`

The clinic data fetch already includes these columns; they just need to be exposed in context.

### 7. Renewal Checkout Flow

When the Edge Function creates a renewal checkout:
1. Looks up the clinic's current `subscription_plan` and determines `billing_cycle` from the slug suffix (`-yearly` or not)
2. Fetches plan price from `subscription_plans` table
3. Calls `createCheckoutSession()` with metadata `type: 'clinic_subscription'`
4. Stores `pending_checkout_session_id` on the clinic
5. Includes checkout URL in email and in-app notification

When paid, the existing `handleCheckoutPaid` → `activateClinicSubscription` webhook handler:
- Sets `payment_status = 'active'`, `is_subscription_active = true`
- Advances `next_billing_date` by 1 month or 1 year
- Resets `reminder_count = 0`, clears `pending_checkout_session_id`
- Records payment in `clinic_payments`

### 8. Registration Update

**File:** `src/app/api/clinic/register/route.ts` (or equivalent)

When creating a new clinic, set:
```typescript
trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
```

Also set in super-admin clinic creation route.

### 9. Email Templates

All emails inserted into `email_notifications` with `notification_type` values:

| Type | Subject | Trigger |
|------|---------|---------|
| `trial_ending` | "Your MediFlow trial ends in X days" | 3 days before trial_end_date |
| `trial_expired` | "Your MediFlow trial has ended" | trial_end_date passed |
| `renewal_reminder` | "Your MediFlow subscription renews soon" | 3 days before next_billing_date |
| `payment_overdue` | "Action required: MediFlow payment overdue" | Day 1 of grace period |
| `payment_warning` | "Urgent: MediFlow payment overdue — X days remaining" | Day 4, day 6 of grace |
| `subscription_expired` | "Your MediFlow subscription has been suspended" | Day 7+ (lockout) |

Each email includes: clinic name, plan name, amount due, and a direct link to the billing page.

## Out of Scope

- Auto-charge / saved card billing (requires PCI DSS compliance for card vaulting)
- Automatic plan downgrade on expiry
- Refund automation
- Multi-currency support
- Proration for mid-cycle plan changes
- Invoice PDF generation

## Environment Variables Required

```
PAYMONGO_SECRET_KEY=sk_live_...          # Live key (replace test key)
PAYMONGO_WEBHOOK_SECRET=whsec_...        # From PayMongo webhook registration
NEXT_PUBLIC_APP_URL=https://your-domain  # Production domain for checkout redirects
```

## Testing Checklist

- [ ] New clinic gets `trial_end_date = now + 14 days`
- [ ] Clinic with expired trial cannot create appointments (403 with `subscription_inactive`)
- [ ] Clinic with expired trial can still GET appointments, patients, etc.
- [ ] Billing banner shows for trial ending, expired, past_due, expired states
- [ ] "Pay Now" button visible only to owner/admin roles
- [ ] Edge Function: trial expiry sets correct status
- [ ] Edge Function: renewal reminder creates checkout session
- [ ] Edge Function: grace period escalation (day 1, 4, 6, 7)
- [ ] Webhook rejects unsigned requests
- [ ] Webhook rejects when PAYMONGO_WEBHOOK_SECRET is missing
- [ ] Paying from past_due restores full access
- [ ] Paying from expired restores full access
- [ ] `next_billing_date` advances correctly after payment
- [ ] Owner receives billing emails; admin/receptionist/practitioner do not
