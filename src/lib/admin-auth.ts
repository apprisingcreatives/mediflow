/**
 * Admin Authentication Utilities
 * Simple helper functions for clinic admin and super admin auth checks
 * These are NOT React contexts - just utility functions for page-level auth
 */

import { supabase } from '@/lib/supabase';

// Type for Next.js router (from useRouter hook)
type Router = {
  push: (href: string) => void;
  replace?: (href: string) => void;
  back?: () => void;
};

interface ClinicAdmin {
  id: string;
  email: string;
  name: string;
  clinic_id: string;
  is_active: boolean;
  auth_user_id: string;
}

interface SuperAdmin {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  auth_user_id: string;
}

/**
 * Check if user is an authenticated and active clinic admin
 * Redirects to login if not authenticated
 */
export async function requireClinicAdmin(
  router: Router,
): Promise<ClinicAdmin | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push('/clinic/login');
      return null;
    }

    const { data: admin, error } = await supabase
      .from('clinic_admins')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .single();

    if (error || !admin || !admin.is_active) {
      await supabase.auth.signOut();
      router.push('/clinic/login');
      return null;
    }

    return admin;
  } catch (error) {
    console.error('Clinic admin auth check failed:', error);
    router.push('/clinic/login');
    return null;
  }
}

/**
 * Check if user is an authenticated and active super admin
 * Redirects to login if not authenticated
 */
export async function requireSuperAdmin(
  router: Router,
): Promise<SuperAdmin | null> {
  try {
    // First try Supabase session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      // Fallback to localStorage check
      const storedAdmin = localStorage.getItem('superAdmin');
      if (storedAdmin) {
        const adminData = JSON.parse(storedAdmin);

        // Verify the stored admin is still valid
        const { data: admin, error } = await supabase
          .from('super_admins')
          .select('*')
          .eq('id', adminData.id)
          .eq('is_active', true)
          .single();

        if (!error && admin) {
          return admin;
        }
      }

      // No valid session or localStorage data
      localStorage.removeItem('superAdminToken');
      localStorage.removeItem('superAdmin');
      router.push('/super-admin/login');
      return null;
    }

    // Verify user is a super admin
    const { data: admin, error } = await supabase
      .from('super_admins')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .single();

    if (error || !admin || !admin.is_active) {
      await supabase.auth.signOut();
      localStorage.removeItem('superAdminToken');
      localStorage.removeItem('superAdmin');
      router.push('/super-admin/login');
      return null;
    }

    // Update localStorage
    localStorage.setItem(
      'superAdmin',
      JSON.stringify({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        auth_user_id: admin.auth_user_id,
      }),
    );

    return admin;
  } catch (error) {
    console.error('Super admin auth check failed:', error);
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('superAdmin');
    router.push('/super-admin/login');
    return null;
  }
}

/**
 * Sign out clinic admin
 */
export async function clinicAdminSignOut(router: Router) {
  await supabase.auth.signOut();
  localStorage.removeItem('clinic');
  localStorage.removeItem('clinicAdmin');
  localStorage.removeItem('clinicToken');
  router.push('/clinic/login');
}

/**
 * Sign out super admin
 */
export async function superAdminSignOut(router: Router) {
  await supabase.auth.signOut();
  localStorage.removeItem('superAdminToken');
  localStorage.removeItem('superAdmin');
  router.push('/super-admin/login');
}
