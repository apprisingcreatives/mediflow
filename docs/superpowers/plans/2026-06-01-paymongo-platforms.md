# PayMongo Platforms Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate payment flows so patient appointment payments go to the clinic's PayMongo account and subscription payments stay with MediFlow's platform account.

**Architecture:** Clinics self-enter their PayMongo merchant org ID (`org_xxx`) on their billing page. When a patient pays for an appointment, the checkout session is created with the `Account-ID` header set to the clinic's org ID, routing 100% of funds to the clinic. Subscription checkouts continue using the platform key with no `Account-ID` header — funds go to MediFlow. If a clinic hasn't connected PayMongo, online payment is blocked and patients see "Pay at Clinic" only.

**Tech Stack:** Next.js API routes, Supabase (migration + admin client), PayMongo Checkout Sessions API, React/TypeScript

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `supabase/migrations/20260601000000_add_paymongo_merchant_columns.sql` | Add `paymongo_merchant_id` and `paymongo_merchant_status` to clinics |
| Modify | `src/types/supabase.ts:317-388` | Add new columns to clinics Row/Insert/Update types |
| Modify | `src/types/database.ts:14-50` | Add new fields to Clinic interface |
| Modify | `src/lib/paymongo.ts` | Add optional `merchantId` param, set `Account-ID` header when present |
| Create | `src/app/api/clinic/[clinicId]/paymongo/route.ts` | PATCH endpoint for clinic to connect/disconnect PayMongo merchant ID |
| Modify | `src/app/api/appointments/[appointmentId]/pay/route.ts` | Check clinic's merchant status, pass merchantId to createCheckoutSession |
| Modify | `src/hooks/useAllClinics.ts` | Include `paymongo_merchant_id` in clinic query |
| Modify | `src/components/patient/dashboard/types.ts` | Add `paymongo_merchant_id` to PatientClinicInfo.clinic |
| Modify | `src/hooks/usePatientBooking.ts` | Gate online payment option on clinic's merchant status |
| Modify | `src/components/patient/dashboard/BookingModal.tsx` | Conditionally show/hide Pay Online based on clinic merchant status |
| Modify | `src/app/(clinic)/clinic/[clinicId]/billing/page.tsx` | Add PayMongo connection section |

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260601000000_add_paymongo_merchant_columns.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Add PayMongo Platforms merchant columns to clinics
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS paymongo_merchant_id TEXT,
  ADD COLUMN IF NOT EXISTS paymongo_merchant_status TEXT DEFAULT 'pending'
    CHECK (paymongo_merchant_status IN ('pending', 'activated', 'declined'));

CREATE INDEX idx_clinics_paymongo_merchant
  ON public.clinics(paymongo_merchant_id)
  WHERE paymongo_merchant_id IS NOT NULL;
```

- [ ] **Step 2: Apply the migration**

Run: `npx supabase db reset`
Expected: Migration applies successfully, database resets with new columns.

- [ ] **Step 3: Verify columns exist**

Run in Supabase Studio SQL editor or via `npx supabase db lint`:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'clinics'
  AND column_name IN ('paymongo_merchant_id', 'paymongo_merchant_status');
```
Expected: Two rows showing the new columns.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260601000000_add_paymongo_merchant_columns.sql
git commit -m "feat: add paymongo_merchant_id and status columns to clinics"
```

---

### Task 2: Update TypeScript Types

**Files:**
- Modify: `src/types/supabase.ts:317-388`
- Modify: `src/types/database.ts:14-50`

- [ ] **Step 1: Update supabase.ts clinics types**

In `src/types/supabase.ts`, inside the `clinics` table definition, add to each section:

In `Row` (after `paymongo_checkout_session_id`):
```typescript
          paymongo_merchant_id: string | null;
          paymongo_merchant_status: string | null;
```

In `Insert` (after `paymongo_checkout_session_id`):
```typescript
          paymongo_merchant_id?: string | null;
          paymongo_merchant_status?: string | null;
```

In `Update` (after `paymongo_checkout_session_id`):
```typescript
          paymongo_merchant_id?: string | null;
          paymongo_merchant_status?: string | null;
```

- [ ] **Step 2: Update database.ts Clinic interface**

In `src/types/database.ts`, inside the `Clinic` interface, add after the `paymongo_checkout_session_id` field:
```typescript
  paymongo_merchant_id: string | null;
  paymongo_merchant_status: 'pending' | 'activated' | 'declined' | null;
```

- [ ] **Step 3: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No new errors introduced.

- [ ] **Step 4: Commit**

```bash
git add src/types/supabase.ts src/types/database.ts
git commit -m "feat: add paymongo merchant types to Clinic"
```

---

### Task 3: Update paymongo.ts — Add Account-ID Header Support

**Files:**
- Modify: `src/lib/paymongo.ts`

- [ ] **Step 1: Add merchantId to CheckoutSessionParams**

In `src/lib/paymongo.ts`, update the `CheckoutSessionParams` interface to add an optional `merchantId` field:

```typescript
interface CheckoutSessionParams {
  lineItems: LineItem[];
  description?: string;
  metadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
  referenceNumber?: string;
  merchantId?: string;
}
```

- [ ] **Step 2: Update createCheckoutSession to use Account-ID header**

In the `createCheckoutSession` function, update the headers object in the axios.post call to conditionally include `Account-ID`:

Replace the headers object:
```typescript
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: getAuthHeader(),
          ...(params.merchantId && { 'Account-ID': params.merchantId }),
        },
      },
```

- [ ] **Step 3: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors. Existing callers that don't pass `merchantId` continue to work unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/lib/paymongo.ts
git commit -m "feat: support Account-ID header in PayMongo checkout for merchant routing"
```

---

### Task 4: Create Clinic PayMongo Connection API Route

**Files:**
- Create: `src/app/api/clinic/[clinicId]/paymongo/route.ts`

- [ ] **Step 1: Create the PATCH endpoint**

Create `src/app/api/clinic/[clinicId]/paymongo/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  try {
    const { clinicId } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminRecord } = await supabaseAdmin
      .from('clinic_admins')
      .select('id')
      .eq('auth_user_id', user.id)
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .single();

    if (!adminRecord) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { paymongo_merchant_id } = await request.json();

    if (paymongo_merchant_id === null) {
      const { error: updateError } = await supabaseAdmin
        .from('clinics')
        .update({
          paymongo_merchant_id: null,
          paymongo_merchant_status: 'pending',
        })
        .eq('id', clinicId);

      if (updateError) throw updateError;

      return NextResponse.json({ connected: false });
    }

    if (
      typeof paymongo_merchant_id !== 'string' ||
      !paymongo_merchant_id.startsWith('org_') ||
      paymongo_merchant_id.length < 8
    ) {
      return NextResponse.json(
        { error: 'Invalid PayMongo merchant ID. Must start with "org_" and be at least 8 characters.' },
        { status: 400 },
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('clinics')
      .update({
        paymongo_merchant_id: paymongo_merchant_id,
        paymongo_merchant_status: 'activated',
      })
      .eq('id', clinicId);

    if (updateError) throw updateError;

    return NextResponse.json({
      connected: true,
      paymongo_merchant_id,
    });
  } catch (error) {
    console.error('PayMongo connection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/clinic/[clinicId]/paymongo/route.ts
git commit -m "feat: add PATCH endpoint for clinic PayMongo merchant connection"
```

---

### Task 5: Update Appointment Payment Route

**Files:**
- Modify: `src/app/api/appointments/[appointmentId]/pay/route.ts`

- [ ] **Step 1: Update the clinic select to include merchant fields**

In `src/app/api/appointments/[appointmentId]/pay/route.ts`, update the `.select()` call on the appointments query to include the new clinic fields:

Replace:
```typescript
         clinic:clinics(id, name)`,
```

With:
```typescript
         clinic:clinics(id, name, paymongo_merchant_id, paymongo_merchant_status)`,
```

- [ ] **Step 2: Add merchant status check before creating checkout**

After the `if (!service?.price)` check (around line 68), add a check for the clinic's merchant status:

```typescript
    if (!clinic?.paymongo_merchant_id || clinic?.paymongo_merchant_status !== 'activated') {
      return NextResponse.json(
        { error: "This clinic hasn't set up online payments yet. Please pay at the clinic." },
        { status: 400 },
      );
    }
```

- [ ] **Step 3: Pass merchantId to createCheckoutSession**

Update the `createCheckoutSession` call to include the clinic's merchant ID. Add `merchantId` to the params object:

```typescript
    const session = await createCheckoutSession({
      lineItems: [
        {
          name: service.name || 'Medical Service',
          amount: amountInCentavos,
          description: `Appointment at ${clinic?.name || 'clinic'} on ${appointment.appointment_date}`,
        },
      ],
      description: `Payment for appointment at ${clinic?.name || 'the clinic'}`,
      metadata: {
        type: 'appointment_payment',
        appointment_id: appointmentId,
        patient_id: patient.id,
        clinic_id: appointment.clinic_id || '',
      },
      successUrl: `${appUrl}/patient/appointments?payment=success&id=${appointmentId}`,
      cancelUrl: `${appUrl}/patient/appointments?payment=cancelled&id=${appointmentId}`,
      referenceNumber: `appt-${appointmentId}`,
      merchantId: clinic.paymongo_merchant_id,
    });
```

- [ ] **Step 4: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/appointments/[appointmentId]/pay/route.ts
git commit -m "feat: route appointment payments to clinic's PayMongo merchant account"
```

---

### Task 6: Update Patient-Facing Data Flow (Hooks + Types)

**Files:**
- Modify: `src/hooks/useAllClinics.ts`
- Modify: `src/components/patient/dashboard/types.ts`
- Modify: `src/hooks/usePatientBooking.ts`

- [ ] **Step 1: Add paymongo_merchant_id to PatientClinicInfo type**

In `src/components/patient/dashboard/types.ts`, update the `PatientClinicInfo` interface:

```typescript
export interface PatientClinicInfo {
  id: string;
  clinic_id: string;
  clinic: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    paymongo_merchant_id: string | null;
  };
}
```

- [ ] **Step 2: Update useAllClinics to fetch paymongo_merchant_id**

In `src/hooks/useAllClinics.ts`, update the `.select()` call:

Replace:
```typescript
        .select('id, name, address, phone')
```

With:
```typescript
        .select('id, name, address, phone, paymongo_merchant_id')
```

Then update the mapping to include the new field:

Replace:
```typescript
      const clinicsData: PatientClinicInfo[] = (data || []).map((c) => ({
        id: c.id,
        clinic_id: c.id,
        clinic: {
          id: c.id,
          name: c.name,
          address: c.address,
          phone: c.phone,
        },
      }));
```

With:
```typescript
      const clinicsData: PatientClinicInfo[] = (data || []).map((c) => ({
        id: c.id,
        clinic_id: c.id,
        clinic: {
          id: c.id,
          name: c.name,
          address: c.address,
          phone: c.phone,
          paymongo_merchant_id: c.paymongo_merchant_id ?? null,
        },
      }));
```

- [ ] **Step 3: Gate online payment on clinic merchant status in usePatientBooking**

In `src/hooks/usePatientBooking.ts`, the `bookAppointment` function calls `/api/appointments/${appointment.id}/pay` when `paymentMethod === 'online'`. The API route now returns a 400 if the clinic isn't connected, so the existing error handling in `bookAppointment` already catches this (the `if (!payRes.ok)` branch). No changes needed in the hook's payment logic.

However, to prevent users from selecting "Pay Online" for unconnected clinics, we need to expose the selected clinic's merchant status. Add a computed value at the bottom of the hook, before the return:

```typescript
  const selectedClinicSupportsOnlinePayment = false; // will be set by parent via prop
```

Actually, the hook doesn't have access to clinic details — that data flows through the `clinics` prop on `BookingModal`. The gating should happen in the component (Task 7). No changes needed in this hook.

- [ ] **Step 4: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/patient/dashboard/types.ts src/hooks/useAllClinics.ts
git commit -m "feat: include paymongo_merchant_id in patient-facing clinic data"
```

---

### Task 7: Update BookingModal — Gate Online Payment

**Files:**
- Modify: `src/components/patient/dashboard/BookingModal.tsx`

- [ ] **Step 1: Determine if selected clinic supports online payment**

In the `BookingModal` component body (inside the function, before the return), add:

```typescript
  const selectedClinic = clinics.find((c) => c.clinic_id === selectedClinicId);
  const clinicSupportsOnlinePayment = !!selectedClinic?.clinic.paymongo_merchant_id;
```

- [ ] **Step 2: Auto-switch to cash if clinic doesn't support online payment**

Add a useEffect that resets payment method when clinic changes. Add this import at the top:

```typescript
import { useState, useRef, useEffect } from 'react';
```

Wait — `useEffect` is already imported (line 3 of BookingModal has `useState, useRef, useEffect`). Actually checking the file... line 3 only has `useState, useRef, useEffect`. Good. Add after the `clinicSupportsOnlinePayment` const:

```typescript
  useEffect(() => {
    if (!clinicSupportsOnlinePayment && paymentMethod === 'online') {
      onPaymentMethodChange('cash');
    }
  }, [clinicSupportsOnlinePayment, paymentMethod, onPaymentMethodChange]);
```

- [ ] **Step 3: Conditionally render payment method selector**

In the JSX, the payment method section is currently rendered when `selectedServicePrice != null && selectedServicePrice > 0`. Update this condition to also require `clinicSupportsOnlinePayment`:

Replace:
```tsx
          {selectedServicePrice != null && selectedServicePrice > 0 && (
```

With:
```tsx
          {selectedServicePrice != null && selectedServicePrice > 0 && clinicSupportsOnlinePayment && (
```

Then **after** that entire block (after its closing `)}` on the line before `</div>` that closes `space-y-5`), add a fallback message for clinics without online payment:

```tsx
          {selectedServicePrice != null && selectedServicePrice > 0 && !clinicSupportsOnlinePayment && (
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg">
              <p className="text-sm text-clinic-text/70 dark:text-white/70">
                <Banknote className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                Payment will be collected at the clinic.
              </p>
              <p className="text-xs text-clinic-text/50 dark:text-white/50 mt-1">
                Service fee: ₱{selectedServicePrice.toLocaleString()}
              </p>
            </div>
          )}
```

- [ ] **Step 4: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/patient/dashboard/BookingModal.tsx
git commit -m "feat: gate online payment option on clinic PayMongo merchant status"
```

---

### Task 8: Add PayMongo Connection Section to Billing Page

**Files:**
- Modify: `src/app/(clinic)/clinic/[clinicId]/billing/page.tsx`

- [ ] **Step 1: Add state for PayMongo connection**

In the `BillingPage` component, after the existing state declarations (around line 71), add:

```typescript
  const [merchantId, setMerchantId] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
```

- [ ] **Step 2: Add connect/disconnect handlers**

After the `handleSubscribe` function (around line 96), add:

```typescript
  const handleConnectPaymongo = async () => {
    if (!session?.access_token || !clinicId || !merchantId.trim()) return;
    setConnecting(true);
    try {
      await axios.patch(
        `/api/clinic/${clinicId}/paymongo`,
        { paymongo_merchant_id: merchantId.trim() },
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      window.location.reload();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to connect PayMongo account');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectPaymongo = async () => {
    if (!session?.access_token || !clinicId) return;
    setDisconnecting(true);
    try {
      await axios.patch(
        `/api/clinic/${clinicId}/paymongo`,
        { paymongo_merchant_id: null },
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      window.location.reload();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to disconnect PayMongo account');
    } finally {
      setDisconnecting(false);
    }
  };
```

- [ ] **Step 3: Add helper to mask the merchant ID**

Add before the return statement:

```typescript
  const maskedMerchantId = clinic?.paymongo_merchant_id
    ? `org_***${clinic.paymongo_merchant_id.slice(-4)}`
    : null;
  const isPaymongoConnected =
    clinic?.paymongo_merchant_id && clinic?.paymongo_merchant_status === 'activated';
```

- [ ] **Step 4: Add the PayMongo connection UI section**

In the JSX, after the `{/* Current Plan */}` section (after the closing `</div>` around line 181), add the PayMongo connection section:

```tsx
      {/* PayMongo Connection */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6">
        <h3 className="text-lg font-semibold text-clinic-navy dark:text-white mb-2">
          Collect Online Payments
        </h3>
        <p className="text-sm text-clinic-text/60 dark:text-white/60 mb-4">
          Connect your PayMongo account to receive appointment payments directly from patients.
        </p>

        {isPaymongoConnected ? (
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  PayMongo Connected
                </p>
                <p className="text-xs text-green-600/70 dark:text-green-400/70">
                  Merchant ID: {maskedMerchantId}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-600 hover:bg-red-50"
              onClick={handleDisconnectPaymongo}
              disabled={disconnecting}
            >
              {disconnecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Disconnect'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                placeholder="org_xxxxxxxxxxxxxxxx"
                className="flex-1 h-10 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-clinic-teal"
              />
              <Button
                className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
                onClick={handleConnectPaymongo}
                disabled={connecting || !merchantId.trim().startsWith('org_')}
              >
                {connecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Connect'
                )}
              </Button>
            </div>
            <p className="text-xs text-clinic-text/50 dark:text-white/50">
              Enter your PayMongo organization ID. You can find this in your PayMongo dashboard under Settings.
            </p>
          </div>
        )}
      </div>
```

- [ ] **Step 5: Verify the clinic context includes the new fields**

Check that `useClinicContext` (from the layout) returns `paymongo_merchant_id` and `paymongo_merchant_status`. These fields were added to the `Clinic` type in Task 2. If the layout fetches the full clinic row, they should be included automatically. Verify by checking `src/app/(clinic)/clinic/[clinicId]/layout.tsx` — the clinic query should already select all columns (or at least `*`).

- [ ] **Step 6: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/(clinic)/clinic/[clinicId]/billing/page.tsx
git commit -m "feat: add PayMongo merchant connection UI to clinic billing page"
```

---

### Task 9: Manual End-to-End Verification

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Test clinic billing page — connect flow**

1. Log in as a clinic admin
2. Navigate to Billing page
3. Verify the "Collect Online Payments" section appears
4. Enter a test merchant ID like `org_testmerchant123`
5. Click "Connect"
6. Verify the page reloads and shows "PayMongo Connected" with masked ID `org_***123`

- [ ] **Step 3: Test clinic billing page — disconnect flow**

1. On the same billing page (connected state)
2. Click "Disconnect"
3. Verify page reloads and shows the input field again

- [ ] **Step 4: Test patient booking — connected clinic**

1. Log in as a patient
2. Open the booking modal
3. Select a clinic that has a connected PayMongo merchant
4. Select service, practitioner, date, time
5. Verify "Pay Online" and "Pay at Clinic" options both appear

- [ ] **Step 5: Test patient booking — unconnected clinic**

1. In the booking modal, select a clinic that does NOT have a PayMongo merchant connected
2. Verify only "Payment will be collected at the clinic" message appears (no Pay Online option)

- [ ] **Step 6: Test appointment payment API — connected clinic**

1. Book an appointment with "Pay Online" at a connected clinic
2. Verify the checkout URL is returned and redirects to PayMongo

- [ ] **Step 7: Test appointment payment API — unconnected clinic**

1. Attempt to call `/api/appointments/{id}/pay` for an appointment at an unconnected clinic
2. Verify 400 response: "This clinic hasn't set up online payments yet."

- [ ] **Step 8: Test subscription flow unchanged**

1. Log in as a clinic admin
2. Go to Billing
3. Subscribe to a plan
4. Verify checkout session is created and redirects to PayMongo (no Account-ID header — this goes to MediFlow's account)

- [ ] **Step 9: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address issues found during manual verification"
```
