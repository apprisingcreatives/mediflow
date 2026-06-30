// =============================================================================
// Role & Permission System
// =============================================================================

export type StaffRole = 'owner' | 'admin' | 'receptionist' | 'viewer';

export type PermissionKey =
  | 'dashboard.view'
  | 'appointments.view'
  | 'appointments.manage'
  | 'patients.view'
  | 'patients.manage'
  | 'services.view'
  | 'services.manage'
  | 'practitioners.view'
  | 'staff.manage'
  | 'analytics.view'
  | 'settings.manage'
  | 'billing.view'
  | 'ai_features.manage'
  | 'branches.manage';

const ALL_PERMISSIONS: PermissionKey[] = [
  'dashboard.view',
  'appointments.view',
  'appointments.manage',
  'patients.view',
  'patients.manage',
  'services.view',
  'services.manage',
  'practitioners.view',
  'staff.manage',
  'analytics.view',
  'settings.manage',
  'billing.view',
  'ai_features.manage',
  'branches.manage',
];

export const ROLE_PERMISSIONS: Record<StaffRole, PermissionKey[]> = {
  owner: ALL_PERMISSIONS,
  admin: [
    'dashboard.view',
    'appointments.view',
    'appointments.manage',
    'patients.view',
    'patients.manage',
    'services.view',
    'services.manage',
    'practitioners.view',
    'analytics.view',
    'settings.manage',
    'billing.view',
    'ai_features.manage',
  ],
  receptionist: [
    'dashboard.view',
    'appointments.view',
    'appointments.manage',
    'patients.view',
    'patients.manage',
    'services.view',
    'practitioners.view',
  ],
  viewer: [
    'dashboard.view',
    'appointments.view',
    'patients.view',
    'services.view',
    'practitioners.view',
    'analytics.view',
  ],
};

export const STAFF_ROLES: StaffRole[] = ['owner', 'admin', 'receptionist', 'viewer'];

export const ROLE_LABELS: Record<StaffRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  receptionist: 'Receptionist',
  viewer: 'Viewer',
};

export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  owner: 'Full access to all features including staff and branch management',
  admin: 'Full access except staff and branch management',
  receptionist: 'Manage appointments, patients, and view services',
  viewer: 'Read-only access to appointments, patients, and analytics',
};

export function roleHasPermission(role: StaffRole, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissionsForRole(role: StaffRole): PermissionKey[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function isValidStaffRole(role: string): role is StaffRole {
  return STAFF_ROLES.includes(role as StaffRole);
}

// =============================================================================
// Legacy helpers (kept for backward compatibility)
// =============================================================================

export const isSuperAdmin = (role: string) => {
  return role === 'super_admin';
};

export const isClinicAdmin = ({
  role,
  clinicId,
  userClinicId,
}: {
  role: string;
  clinicId: string;
  userClinicId: string;
}) => {
  if (clinicId !== userClinicId) {
    return false;
  }
  return role === 'clinic_admin';
};

export const isClinicStaff = ({ role }: { role: string }) => {
  return role === 'clinic_practitioner';
};

export const isPatient = (role: string) => {
  return role === 'patient';
};
