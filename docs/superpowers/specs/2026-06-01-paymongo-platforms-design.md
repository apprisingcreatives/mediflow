# PayMongo Platforms Integration — Design Spec

## Problem

Both patient appointment payments and clinic subscription payments flow through a single PayMongo account (`PAYMONGO_SECRET_KEY`). Patient payments should go to the clinic's own PayMongo account; subscription payments should go to MediFlow's platform account.

## Revenue Model

| Flow | Destination | Platform Cut |
|---|---|---|
| Patient appointment payment | Clinic's PayMongo child merchant account | None — 0% |
| Clinic subscription payment | MediFlow's PayMongo platform account | 100% |

MediFlow monetizes exclusively through subscriptions. No transaction fee on appointment payments.

## PayMongo Platforms API

PayMongo Platforms uses a Parent-Child merchant model:

- **Parent**: MediFlow's account (existing `PAYMONGO_SECRET_KEY`)
- **Child**: Each clinic gets an `org_xxx` merchant ID

Key endpoints:
- `POST /v2/accounts` — create child account
- `POST /v2/accounts/{id}/activate` — activate after KYC
- Checkout sessions can route funds to a child merchant by including the child's org ID

For this phase, clinics onboard with PayMongo independently and self-enter their `org_xxx` ID.

## Database Changes

New columns on `public.clinics`:

```sql
ALTER TABLE public.clinics
  ADD COLUMN paymongo_merchant_id TEXT,
  ADD COLUMN paymongo_merchant_status TEXT DEFAULT 'pending'
    CHECK (paymongo_merchant_status IN ('pending', 'activated', 'declined'));
```

- `paymongo_merchant_id`: the `org_xxx` ID from PayMongo Platforms
- `paymongo_merchant_status`: tracks whether the clinic can receive payments

## Clinic PayMongo Connection (Self-Service)

Clinic admins connect their PayMongo account from the billing page.

### UI: Billing Page Addition

On `/clinic/[clinicId]/billing`, add a "Payment Collection" section above the subscription plans:

**Disconnected state:**
- Header: "Collect Online Payments"
- Description: "Connect your PayMongo account to receive appointment payments directly"
- Input field for `org_xxx` ID
- "Connect" button

**Connected state:**
- Green "Connected" badge
- Shows the org ID (masked: `org_***...abc`)
- "Disconnect" button

### API Route

`PATCH /api/clinic/[clinicId]/paymongo`

- Auth: Bearer token, must be active clinic admin for this clinic
- Body: `{ "paymongo_merchant_id": "org_xxx" }` to connect, or `{ "paymongo_merchant_id": null }` to disconnect
- Validates `org_` prefix format
- Updates `clinics.paymongo_merchant_id` and sets `paymongo_merchant_status` to `activated` (or `pending` on disconnect)

## Payment Flow Changes

### `src/lib/paymongo.ts`

Rename existing `createCheckoutSession` to support two modes:

```typescript
// For subscriptions — uses platform key, funds go to MediFlow
createCheckoutSession(params: CheckoutSessionParams)

// For appointment payments — uses platform key but routes funds to clinic's merchant
createCheckoutSession(params: CheckoutSessionParams & { merchantId: string })
```

When `merchantId` is provided, include the `Account-ID` header in the PayMongo API request. This uses the "Parent Acting as Child" mechanism — the parent's secret key authenticates the request, but the `Account-ID` header routes the payment to the child's account:

```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': getAuthHeader(),      // platform's secret key
  'Account-ID': params.merchantId,       // clinic's org_xxx ID
}
```

No `split_payment` attribute needed. PayMongo processes the checkout session as if the clinic created it — funds go 100% to the clinic's account. PayMongo automatically adds `PYM_executed_for` (clinic) and `PYM_requested_by` (platform) metadata to the payment record.

### Appointment Payment Route (`/api/appointments/[id]/pay`)

Changes:
1. Look up `clinic.paymongo_merchant_id` and `clinic.paymongo_merchant_status`
2. If null or not `activated` → return `400: { error: "This clinic hasn't set up online payments yet. Please pay at the clinic." }`
3. If activated → call `createCheckoutSession` with `merchantId: clinic.paymongo_merchant_id`

### Subscription Route (`/api/clinic/[id]/subscribe`)

No changes. Uses platform key. Money goes to MediFlow.

### Webhook (`/api/webhooks/paymongo`)

No structural changes. Routing logic via `metadata.type` already handles both flows correctly. Appointment payment webhooks update appointment status; subscription webhooks activate the subscription.

## Patient-Facing UI Changes

### Booking Modal / Appointment Actions

When displaying payment options for a clinic:
- If `clinic.paymongo_merchant_id` is set and status is `activated` → show "Pay Online" button
- Otherwise → show "Pay at Clinic" badge, hide online payment option

## Supabase Types

Update `src/types/supabase.ts` and `src/types/database.ts` to include:
- `paymongo_merchant_id: string | null`
- `paymongo_merchant_status: 'pending' | 'activated' | 'declined' | null`

## What This Does NOT Include

- No automated KYC flow (clinics onboard with PayMongo separately)
- No platform fee or split on appointment payments
- No payout tracking (PayMongo settles to clinic's bank directly)
- No super admin override UI (can be added later)

## Environment Variables

No new env vars needed. Existing `PAYMONGO_SECRET_KEY` (platform parent key) is sufficient — PayMongo Platforms allows the parent to act on behalf of child merchants via the `Account-ID` header.
