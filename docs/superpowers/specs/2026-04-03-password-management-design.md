# Password Management Design — Change Password & Forgot Password

## Overview

Add forgot password and change password features for all 4 user roles (patient, clinic admin, practitioner, super admin). Each role gets its own pages matching the existing role-separated auth flow pattern. Shared components minimize duplication.

## Architecture

Three shared components handle the core logic. Role-specific pages are thin wrappers that pass configuration (redirect URLs, login links) to these components. No new API routes — all operations use Supabase Auth client methods directly.

**Supabase Auth methods used:**
- `supabase.auth.resetPasswordForEmail(email, { redirectTo })` — sends reset email
- `supabase.auth.updateUser({ password })` — sets new password (requires active session)
- `supabase.auth.signInWithPassword({ email, password })` — verifies current password
- `supabase.auth.signOut({ scope: 'others' })` — invalidates other sessions after change

## Shared Components

### ForgotPasswordForm (`src/components/auth/forgot-password-form.tsx`)

- Email input validated with Zod
- Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })` where `redirectTo` is passed as a prop (role-specific reset page URL)
- Shows success message ("Check your email for a reset link") regardless of whether email exists (prevents email enumeration)
- 60-second cooldown timer after submission to prevent spam — button disabled with countdown text
- Uses existing UI primitives (Button, Input, Card) and Sonner for toast errors

**Props:**
- `redirectTo: string` — the reset password page URL for this role
- `loginHref: string` — "Back to login" link target
- `title?: string` — optional custom heading

### ResetPasswordForm (`src/components/auth/reset-password-form.tsx`)

- New password + confirm password inputs
- Reuses existing `validatePassword()` logic and `RequirementItem` component from setup-account pages (min 8 chars, uppercase, lowercase, number, special char)
- Extracts auth tokens from URL hash fragment (same pattern as `auth/email-verified/page.tsx`)
- Clears URL hash after extracting tokens to prevent exposure in browser history
- Sets session from extracted tokens via `supabase.auth.setSession()`
- Calls `supabase.auth.updateUser({ password })` to set new password
- On success, shows toast and redirects to the role-specific login page after 2 seconds
- Handles expired/invalid token with clear error message and link back to forgot password

**Props:**
- `loginHref: string` — redirect target after successful reset
- `forgotPasswordHref: string` — link for "request a new reset link" on token error

### ChangePasswordForm (`src/components/auth/change-password-form.tsx`)

- Current password + new password + confirm password inputs
- Same password validation rules (min 8 chars, uppercase, lowercase, number, special char)
- Verifies current password by calling `supabase.auth.signInWithPassword()` first — fails with "Current password is incorrect" if wrong
- Calls `supabase.auth.updateUser({ password })` to set new password
- Calls `supabase.auth.signOut({ scope: 'others' })` to invalidate all other sessions
- Uses Sonner toast for success/error feedback
- "Cancel" button links back to the previous page

**Props:**
- `backHref: string` — where "Cancel" and post-success redirect go

## Forgot Password Pages

Each page wraps `ForgotPasswordForm` with role-specific configuration:

| Role | Page Path | `redirectTo` | `loginHref` |
|------|-----------|-------------|-------------|
| Patient | `src/app/(auth)/forgot-password/page.tsx` | `{APP_URL}/reset-password` | `/login` |
| Clinic Admin | `src/app/(clinic)/clinic/forgot-password/page.tsx` | `{APP_URL}/clinic/reset-password` | `/clinic/login` |
| Practitioner | `src/app/(practitioner)/practitioner/forgot-password/page.tsx` | `{APP_URL}/practitioner/reset-password` | `/practitioner/setup-account` |
| Super Admin | `src/app/(super-admin)/super-admin/forgot-password/page.tsx` | `{APP_URL}/super-admin/reset-password` | `/super-admin/login` |

All pages are public (no auth required). Each inherits its route group's layout for consistent styling.

## Reset Password Pages

Each page wraps `ResetPasswordForm` with role-specific configuration:

| Role | Page Path | `loginHref` | `forgotPasswordHref` |
|------|-----------|-------------|---------------------|
| Patient | `src/app/(auth)/reset-password/page.tsx` | `/login` | `/forgot-password` |
| Clinic Admin | `src/app/(clinic)/clinic/reset-password/page.tsx` | `/clinic/login` | `/clinic/forgot-password` |
| Practitioner | `src/app/(practitioner)/practitioner/reset-password/page.tsx` | `/practitioner/setup-account` | `/practitioner/forgot-password` |
| Super Admin | `src/app/(super-admin)/super-admin/reset-password/page.tsx` | `/super-admin/login` | `/super-admin/forgot-password` |

All pages are public (the reset token in the URL provides authorization). Each extracts tokens from the URL hash, sets the session, then renders the form.

## Change Password Pages

Each page wraps `ChangePasswordForm`. These live inside protected route groups — auth is enforced by the existing layout auth gates.

| Role | Page Path | `backHref` |
|------|-----------|-----------|
| Patient | `src/app/(dashboard)/patient/change-password/page.tsx` | `/patient` |
| Clinic Admin | `src/app/(clinic)/clinic/[clinicId]/settings/change-password/page.tsx` | `/clinic/[clinicId]/settings` |
| Practitioner | `src/app/(practitioner)/practitioner/[practitionerId]/clinic/[clinicId]/profile/change-password/page.tsx` | Back to profile |
| Super Admin | `src/app/(super-admin)/super-admin/change-password/page.tsx` | `/super-admin/dashboard` |

## Existing File Updates

| File | Change |
|------|--------|
| `src/app/(auth)/login/page.tsx:135` | No change — already links to `/forgot-password` which will now exist |
| `src/app/clinic/[clinicId]/patient/login/page.tsx:108` | No change — links to `/forgot-password`, works for patients |
| `src/app/(clinic)/clinic/login/page.tsx` | Add "Forgot password?" link to `/clinic/forgot-password` |
| `src/app/(clinic)/clinic/[clinicId]/settings/page.tsx:201` | Wire "Change Password" button to `Link` pointing to `/clinic/[clinicId]/settings/change-password` |
| `src/app/(super-admin)/super-admin/login/page.tsx` | Add "Forgot password?" link to `/super-admin/forgot-password` |
| `src/app/(auth)/login/page.tsx` | Practitioners log in here and get redirected by role. No change needed — the existing `/forgot-password` link works since practitioners are Supabase auth users like patients |

## Security Mitigations

| Concern | Mitigation |
|---------|------------|
| Email enumeration | Same success message shown whether email exists or not |
| Reset email spam | 60-second client-side cooldown + Supabase server-side rate limiting |
| Token in browser history | URL hash fragment cleared after extraction; hash fragments are not sent to server or logged |
| Stolen session changing password | Current password required before allowing change |
| Old sessions after password change | `signOut({ scope: 'others' })` invalidates all other sessions |
| Expired/invalid reset tokens | Clear error message with link to request new reset |
| HTTPS enforcement | Vercel enforces HTTPS by default |
| Password strength | Same validation as existing setup pages (8+ chars, uppercase, lowercase, number, special char) |

## File Summary

**New files (15):**
- 3 shared components in `src/components/auth/`
- 4 forgot password pages
- 4 reset password pages
- 4 change password pages

**Modified files (3):**
- Clinic admin login — add forgot password link
- Super admin login — add forgot password link
- Clinic admin settings — wire change password button
