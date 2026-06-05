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
  subscription_plan: 'starter' | 'pro' | 'enterprise' | string;

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


export interface ClinicAdmin {
  id: string;
  clinic_id: string;
  email: string;
  name: string;
  role: string;
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
