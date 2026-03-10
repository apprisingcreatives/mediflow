import { Patient } from '@/types/database';

// Clinic info as seen from patient's perspective
export interface PatientClinicInfo {
  id: string;
  clinic_id: string;
  clinic: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
  };
}

// Practitioner for booking
export interface BookingPractitioner {
  id: string;
  name: string;
  specialization: string | null;
}

// Service for booking
export interface BookingService {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

// Time slot
export interface TimeSlot {
  time_slot: string;
  is_available: boolean;
}

// Message type (mock for now)
export interface Message {
  id: number;
  from: string;
  preview: string;
  time: string;
  unread: boolean;
  avatar: string | null;
}

// Health metric
export interface HealthMetric {
  label: string;
  value: string;
  status: 'normal' | 'attention' | 'pending';
  date: string;
}

// Booking form state
export interface BookingFormState {
  clinicId: string;
  practitionerId: string;
  serviceId: string;
  date: Date | undefined;
  time: string;
  notes: string;
}

// Patient info type for components
export type PatientInfo = Pick<
  Patient,
  | 'id'
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'clinic_id'
  | 'blood_type'
  | 'allergies'
  | 'chronic_conditions'
  | 'onboarding_completed'
>;
