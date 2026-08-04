import { NextRequest, NextResponse } from 'next/server';
import { authenticateClinicRequest, isAuthSuccess } from '@/lib/api-auth';
import { getPermissionsForRole } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  const { clinicId } = await params;
  const auth = await authenticateClinicRequest(request, clinicId);
  if (!isAuthSuccess(auth)) return auth;

  const { admin } = auth;
  const permissions = getPermissionsForRole(admin.staff_role);

  return NextResponse.json({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    clinic_id: admin.clinic_id,
    staff_role: admin.staff_role,
    is_active: admin.is_active,
    permissions,
  });
}
