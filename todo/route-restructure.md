# Route Restructure TODO

## Problem

Two file trees produce routes under `/clinic/...` with different layouts:
- `src/app/(clinic)/clinic/...` — admin pages with sidebar layout
- `src/app/clinic/...` — patient pages with no layout

## Phase 1: Fix Broken Links (no file moves)

- [ ] `src/hooks/use-auth.tsx:270` — change `"/clinic"` to `` `/clinic/${clinicId}/dashboard` ``
- [ ] `src/app/(clinic)/clinic/setup-account/page.tsx:115` — change `"/clinic/dashboard"` to `` `/clinic/${clinicId}/dashboard` ``
- [ ] `src/app/(clinic)/clinic/[clinicId]/layout.tsx:241,272` — change `"/clinic/billing"` to `` `/clinic/${clinicId}/billing` ``

## Phase 2: Fix Onboarding Routes (new pages needed)

- [ ] Delete broken `src/app/clinic/dashboard/onboarding/page.tsx` (has no `clinicId` param)
- [ ] Create onboarding pages under admin tree at `src/app/(clinic)/clinic/[clinicId]/onboarding/`:
  - `page.tsx`
  - `questions/new/page.tsx`
  - `questions/[questionId]/page.tsx`
  - `documents/new/page.tsx`
  - `documents/[documentId]/page.tsx`
- [ ] Update `src/components/clinic/onboarding-management.tsx` — change all `/clinic/dashboard/onboarding/...` links to `` `/clinic/${clinicId}/onboarding/...` ``

## Phase 3: Consolidate Route Groups (do in one PR)

- [ ] Rename route group `(clinic)` to `(clinic-admin)`
- [ ] Create `(patient-portal)` route group with patient auth layout
- [ ] Move patient pages from `src/app/clinic/[clinicId]/patient/...` into `src/app/(patient-portal)/clinic/[clinicId]/patient/...`
- [ ] Delete empty `src/app/clinic/` directory

### Target Structure

| Route Group | Auth | Contains |
|-------------|------|----------|
| `(public)` | None | `/clinic/login`, `/clinic/register`, `/clinics`, `/login`, `/register` |
| `(clinic-admin)` | `requireClinicAdmin()` in layout | `/clinic/[clinicId]/dashboard`, `/appointments`, `/patients`, `/billing`, `/onboarding/...` |
| `(patient-portal)` | Patient auth in layout | `/clinic/[clinicId]/patient`, `/patient/onboarding` |
| `(practitioner)` | Unchanged | Practitioner routes |
| `(super-admin)` | Unchanged | Super admin routes |

## Phase 4: Clean Up Dead API Routes

- [ ] Delete `src/app/api/clinics/route.ts` — `useGetClinics` queries Supabase directly
- [ ] Delete `src/app/api/clinic/[clinicId]/features/route.ts` — no frontend caller
- [ ] Evaluate `/api/clinic/[clinicId]/payments` and `/api/clinic/[clinicId]/subscribe` — delete if billing not planned soon

## Unused Route: `/clinic/[clinicId]/patient/login`

- [ ] Verify if patients reach this via direct URL or if it needs to be linked from somewhere
