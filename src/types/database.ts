export type SuperAdminStatus = 'invited' | 'active' | 'suspended' | 'archived';

export interface SuperAdmin {
  id: string;
  email: string;
  name: string;
  auth_user_id: string | null;
  status: SuperAdminStatus;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Clinic {
  id: string; // uuid

  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;

  logo_url: string | null;
  description: string | null;

  is_active: boolean;
  subscription_plan: 'starter' | 'professional' | 'enterprise' | string;

  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp

  trial_start_date: string | null;
  trial_end_date: string | null;
  is_trial_active: boolean;

  is_subscription_active: boolean;
  payment_status: 'trial' | 'active' | 'past_due' | 'canceled' | string;

  last_payment_date: string | null;
  next_billing_date: string | null;

  paymongo_customer_id: string | null;
  paymongo_checkout_session_id: string | null;
  paymongo_merchant_id: string | null;
  paymongo_merchant_status: 'pending' | 'activated' | 'declined' | null;

  slug: string | null;

  email_notifications_enabled: boolean;
  appointment_reminders_enabled: boolean;
  intake_required: boolean;
}


export type StaffRole = 'owner' | 'admin' | 'receptionist' | 'viewer';

export interface ClinicAdmin {
  id: string;
  clinic_id: string;
  email: string;
  name: string;
  role: string;
  staff_role: StaffRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicService {
  id: string;
  clinic_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIFeature {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  is_premium: boolean;
  created_at: string;
}

export interface ClinicAIFeature {
  id: string;
  clinic_id: string;
  feature_id: string;
  is_enabled: boolean;
  enabled_by: string | null;
  enabled_at: string | null;
  created_at: string;
  updated_at: string;
  feature?: AIFeature;
}

export interface Practitioner {
  id: string;
  clinic_id: string;
  name: string;
  email: string | null;
  specialization: string | null;
  bio: string | null;
  image_url: string | null;
  is_active: boolean;
  max_daily_appointments: number | null;
  created_at: string;
  updated_at: string;
}

export interface ClinicWithDetails extends Clinic {
  clinic_services?: ClinicService[];
  ai_features?: ClinicAIFeature[];
  practitioners?: Practitioner[];
  admins?: ClinicAdmin[];
}

export interface Patient {
  id: string;
  auth_user_id: string | null;
  clinic_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  blood_type: string | null;
  allergies: string[] | string[] | null;
  chronic_conditions: string[] | null;
  current_medications: string | null;
  medical_notes: string | null;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
  onboarding_completed: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AppointmentPaymentStatus = 'pending' | 'paid' | 'pay_at_clinic' | 'waived' | 'refunded' | 'refund_pending' | 'refund_failed';
export type AppointmentPaymentMethod = 'gcash' | 'grab_pay' | 'paymaya' | 'card' | 'cash' | null;

export interface Appointment {
  id: string;
  patient_id: string | null;
  clinic_id: string;
  practitioner_id: string | null;
  service_id: string | null;
  appointment_date: string;
  appointment_time: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show";
  notes: string | null;
  ai_recommended: boolean;
  ai_recommendation_reason: string | null;
  intake_status: 'none' | 'pending' | 'completed';
  payment_status: AppointmentPaymentStatus;
  payment_method: AppointmentPaymentMethod;
  payment_amount: number | null;
  paymongo_checkout_id: string | null;
  paid_at: string | null;
  refund_scheduled_at: string | null;
  refund_attempts: number;
  refunded_at: string | null;
  branch_id: string | null;
  created_at: string;
  updated_at: string;
}

// Patient Onboarding System Types
export interface ClinicOnboardingQuestion {
  id: string;
  clinic_id: string;
  question_text: string;
  question_type:
    | "text"
    | "textarea"
    | "select"
    | "multiselect"
    | "yesno"
    | "number"
    | "date";
  options: string[] | null;
  is_required: boolean;
  display_order: number;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicRequiredDocument {
  id: string;
  clinic_id: string;
  document_name: string;
  document_description: string | null;
  is_required: boolean;
  allowed_file_types: string | null;
  max_file_size_mb: number;
  display_order: number;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientQuestionResponse {
  id: string;
  patient_id: string;
  clinic_id: string;
  question_id: string;
  appointment_id: string | null;
  response_value: string | null;
  response_options: string[] | null;
  responded_at: string;
  created_at: string;
  updated_at: string;
  question?: ClinicOnboardingQuestion;
}

export interface PatientDocument {
  id: string;
  patient_id: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  description: string | null;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface AITreatmentPrediction {
  id: string;
  patient_id: string;
  clinic_id: string;
  prediction_data: any;
  confidence_score: number | null;
  recommended_treatments: any;
  risk_factors: any;
  predicted_conditions: any;
  recommended_specialty: string | null;
  generated_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  status: "pending" | "reviewed" | "accepted" | "rejected";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientOnboardingData {
  questions: ClinicOnboardingQuestion[];
  documents: ClinicRequiredDocument[];
  responses: PatientQuestionResponse[];
  uploadedDocuments: PatientDocument[];
  aiPrediction?: AITreatmentPrediction;
}

// Phase 3b: Multi-Branch
export interface Branch {
  id: string;
  clinic_id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PractitionerBranch {
  id: string;
  practitioner_id: string;
  branch_id: string;
  created_at: string;
}

export interface BranchComparison {
  branch_id: string;
  branch_name: string;
  appointment_count: number;
  completed_count: number;
  cancelled_count: number;
  unique_patients: number;
  revenue: number;
  avg_daily_appointments: number;
}

// Phase 3: Staff Audit Log
export interface StaffAuditLog {
  id: string;
  clinic_id: string;
  actor_id: string;
  actor_type: 'clinic_admin' | 'practitioner' | 'system';
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

// Phase 3: Analytics Response Types
export interface PatientDemographic {
  age_group: string;
  gender: string;
  city: string;
  patient_count: number;
}

export interface ServicePopularity {
  service_id: string;
  service_name: string;
  booking_count: number;
  completed_count: number;
  completion_rate: number;
  revenue: number;
}

export interface RevenueForecastPoint {
  month_label: string;
  revenue: number;
  is_forecast: boolean;
}

// Notifications
export type NotificationType =
  | 'appointment.created'
  | 'appointment.cancelled'
  | 'appointment.rescheduled'
  | 'appointment.status_changed'
  | 'staff.invited'
  | 'staff.role_changed'
  | 'practitioner.added'
  | 'plan.changed'
  | 'trial.expiring'
  | 'payment.status_changed'
  | 'report.submitted';

export type RecipientType = 'super_admin' | 'clinic_admin' | 'practitioner' | 'patient';

export interface Notification {
  id: string;
  recipient_id: string;
  recipient_type: RecipientType;
  clinic_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  action_url: string | null;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  expires_at: string;
}

// Plan Limits
export interface LimitExceededError {
  error: 'limit_exceeded';
  message: string;
  resource: 'practitioners' | 'branches';
  current: number;
  max: number;
  plan: string;
  upgradeTo?: string;
}

export interface ClinicUsage {
  plan: string;
  practitioners: {
    current: number;
    max: number | null;
    byBranch: Record<string, number>;
  };
  branches: {
    current: number;
    max: number | null;
  };
  patients: {
    current: number;
    max: number | null;
  };
}
