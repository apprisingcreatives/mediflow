import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { type StaffRole, type PermissionKey, roleHasPermission, isValidStaffRole } from '@/lib/permissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface AuthenticatedAdmin {
  id: string;
  clinic_id: string;
  email: string;
  name: string;
  staff_role: StaffRole;
  is_active: boolean;
  auth_user_id: string;
}

interface AuthSuccess {
  admin: AuthenticatedAdmin;
  userId: string;
}

type AuthResult = AuthSuccess | NextResponse;

function isAuthSuccess(result: AuthResult): result is AuthSuccess {
  return 'admin' in result;
}

export { isAuthSuccess };

export async function authenticateClinicRequest(
  request: NextRequest,
  clinicId: string,
  requiredPermission?: PermissionKey,
): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: admin, error: adminError } = await supabaseAdmin
    .from('clinic_admins')
    .select('id, clinic_id, email, name, staff_role, is_active, auth_user_id')
    .eq('auth_user_id', user.id)
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .single();

  if (adminError || !admin) {
    return NextResponse.json(
      { error: 'You are not authorized to access this clinic' },
      { status: 403 },
    );
  }

  const staffRole = admin.staff_role as string;
  if (!isValidStaffRole(staffRole)) {
    return NextResponse.json(
      { error: 'Invalid staff role configuration' },
      { status: 403 },
    );
  }

  if (requiredPermission && !roleHasPermission(staffRole, requiredPermission)) {
    return NextResponse.json(
      { error: 'Insufficient permissions', requiredPermission },
      { status: 403 },
    );
  }

  return {
    admin: { ...admin, staff_role: staffRole } as AuthenticatedAdmin,
    userId: user.id,
  };
}
