import { NextRequest, NextResponse } from 'next/server';
import { authenticateClinicRequest, isAuthSuccess } from '@/lib/api-auth';
import {
  STAFF_ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_PERMISSIONS,
} from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  const { clinicId } = await params;
  const auth = await authenticateClinicRequest(request, clinicId, 'staff.manage');
  if (!isAuthSuccess(auth)) return auth;

  const roles = STAFF_ROLES.map((role) => ({
    role,
    label: ROLE_LABELS[role],
    description: ROLE_DESCRIPTIONS[role],
    permissions: ROLE_PERMISSIONS[role],
    isSystem: true,
  }));

  return NextResponse.json({ roles });
}
