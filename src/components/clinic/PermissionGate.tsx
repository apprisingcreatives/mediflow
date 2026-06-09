'use client';

import type { ReactNode } from 'react';
import { useClinicContext } from '@/app/(clinic)/clinic/[clinicId]/clinic-context';
import type { PermissionKey } from '@/lib/permissions';

interface PermissionGateProps {
  permission: PermissionKey;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ permission, children, fallback }: PermissionGateProps) {
  const { hasPermission } = useClinicContext();
  if (!hasPermission(permission)) return fallback ?? null;
  return <>{children}</>;
}
