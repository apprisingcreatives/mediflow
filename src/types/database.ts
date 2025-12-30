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
