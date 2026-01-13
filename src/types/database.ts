export interface SuperAdmin {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Clinic {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  subscription_plan: 'starter' | 'professional' | 'enterprise';
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface ClinicWithDetails extends Clinic {
  services?: ClinicService[];
  ai_features?: ClinicAIFeature[];
  practitioners?: Practitioner[];
  admins?: ClinicAdmin[];
}

export interface Patient {
  id: string;
  auth_user_id: string | null;
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
  allergies: string[] | null;
  chronic_conditions: string[] | null;
  current_medications: string | null;
  medical_notes: string | null;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientDocument {
  id: string;
  patient_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  document_type: string | null;
  description: string | null;
  ai_analysis: string | null;
  ai_recommended_specialty: string | null;
  ai_summary: string | null;
  uploaded_at: string;
  analyzed_at: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string | null;
  clinic_id: string;
  practitioner_id: string | null;
  service_id: string | null;
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes: string | null;
  ai_recommended: boolean;
  ai_recommendation_reason: string | null;
  created_at: string;
  updated_at: string;
}
