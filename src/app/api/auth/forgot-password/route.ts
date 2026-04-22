import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

type Role = 'patient' | 'clinic_admin' | 'practitioner' | 'super_admin';

const VALID_ROLES: Role[] = [
  'patient',
  'clinic_admin',
  'practitioner',
  'super_admin',
];

/**
 * POST /api/auth/forgot-password
 *
 * Sends a password reset email only if the email belongs to a user with one
 * of the allowed roles. Prevents cross-role password reset attempts (e.g. a
 * patient email submitted on the /clinic/forgot-password page).
 *
 * To prevent email enumeration, the response is always a generic success
 * regardless of whether the email exists or matches the allowed roles.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, allowedRoles, redirectTo } = body as {
      email?: string;
      allowedRoles?: Role[];
      redirectTo?: string;
    };

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (
      !allowedRoles ||
      !Array.isArray(allowedRoles) ||
      allowedRoles.length === 0 ||
      !allowedRoles.every((r) => VALID_ROLES.includes(r))
    ) {
      return NextResponse.json({ error: 'Invalid roles' }, { status: 400 });
    }

    if (!redirectTo || typeof redirectTo !== 'string') {
      return NextResponse.json(
        { error: 'Redirect URL is required' },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if the email belongs to any of the allowed roles
    const hasAllowedRole = await emailMatchesAnyRole(normalizedEmail, allowedRoles);

    // Only send the reset email if the email matches one of the allowed roles.
    // Otherwise silently succeed to prevent email enumeration and role probing.
    if (hasAllowedRole) {
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(
        normalizedEmail,
        { redirectTo },
      );

      if (error) {
        console.error('[forgot-password] resetPasswordForEmail failed:', error);
      }
    }

    // Always return the same response to prevent role/email enumeration
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[forgot-password] Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * Check whether the given email belongs to an active account with any of
 * the specified roles. Uses the role-specific tables to enforce boundaries.
 */
async function emailMatchesAnyRole(
  email: string,
  roles: Role[],
): Promise<boolean> {
  for (const role of roles) {
    const found = await emailHasRole(email, role);
    if (found) return true;
  }
  return false;
}

async function emailHasRole(email: string, role: Role): Promise<boolean> {
  switch (role) {
    case 'super_admin': {
      const { data } = await supabaseAdmin
        .from('super_admins')
        .select('id')
        .eq('email', email)
        .eq('status', 'active')
        .maybeSingle();
      return !!data;
    }

    case 'clinic_admin': {
      const { data } = await supabaseAdmin
        .from('clinic_admins')
        .select('id')
        .eq('email', email)
        .eq('is_active', true)
        .maybeSingle();
      return !!data;
    }

    case 'practitioner': {
      const { data } = await supabaseAdmin
        .from('practitioners')
        .select('id')
        .eq('email', email)
        .eq('is_active', true)
        .limit(1);
      return !!(data && data.length > 0);
    }

    case 'patient': {
      const { data } = await supabaseAdmin
        .from('patients')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      return !!data;
    }

    default:
      return false;
  }
}
