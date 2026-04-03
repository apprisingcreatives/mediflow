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

// Types for new super admin dashboard tables

export type HelpGuideCategory = 'patient' | 'clinic_admin' | 'practitioner';
export type ReportType = 'bug' | 'feedback' | 'complaint' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  billing_cycle: string;
  description: string | null;
  features: string[];
  max_practitioners: number | null;
  max_patients: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HelpGuide {
  id: string;
  title: string;
  body: string | null;
  category: HelpGuideCategory;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  help_guide_faqs?: HelpGuideFaq[];
}

export interface HelpGuideFaq {
  id: string;
  guide_id: string;
  question: string;
  answer: string;
  sort_order: number;
  created_at: string;
}

export interface UserReport {
  id: string;
  title: string;
  description: string;
  type: ReportType;
  status: ReportStatus;
  submitted_by_email: string;
  submitted_by_role: string;
  submitted_by_user_id: string | null;
  admin_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

// Onboarding status (computed, not stored)
export interface ClinicOnboardingInfo {
  clinic_id: string;
  clinic_name: string;
  clinic_email: string;
  registered_at: string;
  updated_at: string;
  steps: {
    clinic_created: boolean;
    admin_set_up: boolean;
    services_added: boolean;
    practitioners_added: boolean;
    first_patient: boolean;
  };
  completed_steps: number;
  total_steps: 5;
  status: 'pending' | 'in_progress' | 'completed' | 'stalled';
}
