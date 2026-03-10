/**
 * Super Admin Status Enum
 * 
 * Represents the lifecycle states of a super admin account
 */
export enum SuperAdminStatus {
  /** Initial state: Invitation sent, password not set */
  INVITED = 'invited',
  
  /** Active state: Password set, can access system */
  ACTIVE = 'active',
  
  /** Suspended state: Temporarily disabled, can be reactivated */
  SUSPENDED = 'suspended',
  
  /** Archived state: Permanently disabled, for record-keeping */
  ARCHIVED = 'archived',
}

/**
 * Type guard to check if a string is a valid SuperAdminStatus
 */
export function isSuperAdminStatus(value: unknown): value is SuperAdminStatus {
  return (
    typeof value === 'string' &&
    Object.values(SuperAdminStatus).includes(value as SuperAdminStatus)
  );
}

/**
 * Get user-friendly status label
 */
export function getSuperAdminStatusLabel(status: SuperAdminStatus): string {
  const labels: Record<SuperAdminStatus, string> = {
    [SuperAdminStatus.INVITED]: 'Pending Setup',
    [SuperAdminStatus.ACTIVE]: 'Active',
    [SuperAdminStatus.SUSPENDED]: 'Suspended',
    [SuperAdminStatus.ARCHIVED]: 'Archived',
  };
  return labels[status];
}

/**
 * Get status color for UI
 */
export function getSuperAdminStatusColor(status: SuperAdminStatus): string {
  const colors: Record<SuperAdminStatus, string> = {
    [SuperAdminStatus.INVITED]: 'text-yellow-600 bg-yellow-50',
    [SuperAdminStatus.ACTIVE]: 'text-green-600 bg-green-50',
    [SuperAdminStatus.SUSPENDED]: 'text-red-600 bg-red-50',
    [SuperAdminStatus.ARCHIVED]: 'text-gray-600 bg-gray-50',
  };
  return colors[status];
}
