# Phase 1: Revenue Protection — Brainstorm

**Date:** 2026-04-24
**Status:** Ready for planning
**Timeline:** 1-2 weeks (MVP)

---

## What We're Building

All four Phase 1 features in one push to deliver the complete "revenue protection" story:

1. **Smart Reminder System** — Twilio SMS reminders at 24h and 2h before appointments. Patients reply "C" to confirm or "X" to cancel (reply-based interaction via Twilio webhook).
2. **Auto Rebooking Engine** — When a patient cancels, suggest the next available slot via SMS/email with a rebooking link. Track rebooking conversion.
3. **Waitlist System** — Patients join a waitlist for a practitioner/service. When a slot opens (cancellation), the first waitlisted patient is auto-booked and notified. No manual intervention.
4. **Basic Analytics** — No-show rate, revenue lost from no-shows, and peak booking hours displayed as cards/charts on the existing clinic admin dashboard (recharts already installed).

---

## Why This Approach

**API-Route-Driven architecture** — all business logic lives in Next.js API routes (TypeScript), not in database triggers or Edge Functions.

### Rationale
- Single language (TypeScript) for all business logic — easier to debug, test, and maintain
- Aligns with CLAUDE.md mandate: no direct frontend-to-database queries, always API route + axios hook
- Twilio SDK works natively in Node.js API routes
- Vercel Cron (or equivalent) for scheduled reminder checks
- Existing DB triggers remain for audit/notification tracking but don't own business logic
- Analytics queries run server-side in API routes, not exposed to client

### What Already Exists (Leverage Points)
- Email notification infrastructure (table + Edge Functions + Resend)
- Appointment model with statuses: scheduled, confirmed, completed, cancelled, no-show
- Auto no-show detection via pg_cron (marks appointments >30min past as no-show)
- Activity logs table for audit trail
- Recharts installed for charting
- Stripe integration on clinics table (future payment tie-in)
- Appointment notification tracking flags (24hr, 5min, created, updated)

---

## Key Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| SMS Provider | Twilio | Best PH coverage, SMS + WhatsApp support, mature API |
| SMS Interaction | Reply-based (C/X) | Highest engagement, no app visit needed |
| Waitlist Model | First-come auto-book | Simplest UX, no patient action needed, fills slots fastest |
| Analytics Location | Clinic admin dashboard | One place for everything, recharts already there |
| Architecture | API-Route-Driven | All logic in TypeScript, consistent with CLAUDE.md patterns |
| Timeline | 1-2 week MVP | Ship core, iterate on clinic feedback |

---

## Feature Breakdown

### 1. Smart Reminders

**New tables:**
- `patient_notification_preferences` — phone number, sms_enabled, preferred channels, timezone
- Extend `email_notifications` or create `sms_notifications` table for delivery tracking

**API routes:**
- `POST /api/cron/send-reminders` — Vercel Cron hits this every 30min. Queries appointments in 24h/2h window, sends SMS via Twilio
- `POST /api/webhooks/twilio` — receives SMS replies. "C" confirms appointment, "X" triggers cancellation + auto-rebooking flow

**Twilio setup:**
- Twilio account + PH phone number
- SMS sending via Twilio Node.js SDK
- Webhook URL for incoming replies

### 2. Auto Rebooking

**Logic (in cancellation API route):**
1. Patient cancels → status set to "cancelled"
2. API finds next 3 available slots for same practitioner/service
3. Sends SMS with rebooking link: "Your appointment was cancelled. Book again: [link]"
4. Track if patient rebooks (rebooking_source field on appointment)

**New columns:**
- `appointments.rebooking_source` — tracks if appointment came from a rebooking suggestion
- `appointments.cancelled_appointment_id` — links rebooked appointment to original

### 3. Waitlist

**New table:**
- `appointment_waitlist` — patient_id, clinic_id, practitioner_id (optional), service_id (optional), preferred_date_range, priority (timestamp-based FIFO), status (waiting/booked/expired/cancelled), created_at

**Flow:**
1. Patient joins waitlist via API route
2. When appointment cancelled → API checks waitlist for matching criteria
3. First match auto-booked → SMS notification sent
4. Waitlist entry status → "booked"

**API routes:**
- `POST /api/clinic/[clinicId]/waitlist` — add patient to waitlist
- `GET /api/clinic/[clinicId]/waitlist` — clinic admin views waitlist
- `DELETE /api/clinic/[clinicId]/waitlist/[id]` — remove from waitlist
- Auto-book logic lives in the appointment cancellation handler

### 4. Basic Analytics

**API route:**
- `GET /api/clinic/[clinicId]/analytics` — returns aggregated stats

**Metrics (computed from existing appointments table):**
- No-show rate: count(no-show) / count(all) for date range
- Revenue lost: sum(service.price) for no-show appointments
- Peak booking hours: group by hour-of-day, count appointments
- Confirmation rate: count(confirmed) / count(scheduled)

**Frontend:**
- Analytics cards on clinic admin dashboard
- Simple bar chart for peak hours (recharts)
- Trend line for no-show rate over last 30 days

---

## Resolved Questions

1. **Twilio number type** — Local PH number (+63). Required for reply-based confirm/cancel interaction.
2. **Reminder timing configurability** — Fixed 24h + 2h for MVP. Add configurability later based on clinic feedback.
3. **Waitlist expiry** — 30-day auto-expiry. Keeps waitlist clean; patients can re-join.
4. **WhatsApp/Viber** — Deferred to Phase 1.5. SMS only for MVP to ship faster (WhatsApp Business API approval takes days/weeks).

---

## Out of Scope (MVP)

- WhatsApp/Viber channels (Phase 1.5)
- Patient-facing waitlist UI (MVP: clinic admin adds patients to waitlist)
- Advanced analytics filtering (date range picker, per-doctor breakdown)
- SMS cost tracking/billing
- Multi-language SMS templates
