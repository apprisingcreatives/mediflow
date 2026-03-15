import { Practitioner } from "@/hooks/useGetPractitioners";
import { ClinicService } from "@/hooks/useGetServices";
import { TimeSlot } from "@/hooks/useGetTimeSlots";

export interface BookingFormData {
  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  // Medical History
  conditions: string[];
  medications: string;
  allergies: string;
  symptoms: string;
  // Appointment
  selectedPractitionerId: string;
  selectedServiceId: string;
  date: string;
  time: string;
  // Consent
  consent: boolean;
}

export interface BookingContextValue {
  // Form data
  formData: BookingFormData;
  updateFormData: (updates: Partial<BookingFormData>) => void;
  resetFormData: () => void;
  
  // Step management
  currentStep: number;
  setCurrentStep: (step: number) => void;
  handleNext: () => void;
  handleBack: () => void;
  
  // Data
  practitioners: Practitioner[];
  services: ClinicService[];
  availableTimeSlots: TimeSlot[];
  selectedPractitioner: Practitioner | undefined;
  selectedService: ClinicService | undefined;
  
  // Loading states
  isLoadingPractitioners: boolean;
  isLoadingServices: boolean;
  isLoadingTimeSlots: boolean;
  isSubmitting: boolean;
  
  // Errors
  submitError: string | null;
  setSubmitError: (error: string | null) => void;
  
  // Actions
  submitBooking: () => Promise<void>;
  
  // Clinic info
  clinicId: string | null;
  clinicName: string | null;
}

export interface StepProps {
  formData: BookingFormData;
  updateFormData: (updates: Partial<BookingFormData>) => void;
}

export interface AppointmentStepProps extends StepProps {
  practitioners: Practitioner[];
  services: ClinicService[];
  availableTimeSlots: TimeSlot[];
  selectedPractitioner: Practitioner | undefined;
  selectedService: ClinicService | undefined;
  isLoadingPractitioners: boolean;
  isLoadingTimeSlots: boolean;
}

export interface ConfirmationStepProps {
  formData: BookingFormData;
  selectedPractitioner: Practitioner | undefined;
  selectedService: ClinicService | undefined;
}

export const BOOKING_STEPS = [
  { id: 1, title: "Personal Info", key: "personal" },
  { id: 2, title: "Medical History", key: "medical" },
  { id: 3, title: "Appointment", key: "appointment" },
  { id: 4, title: "Confirmation", key: "confirmation" },
] as const;

export const INITIAL_FORM_DATA: BookingFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  conditions: [],
  medications: "",
  allergies: "",
  symptoms: "",
  selectedPractitionerId: "",
  selectedServiceId: "",
  date: "",
  time: "",
  consent: false,
};

export const CHRONIC_CONDITIONS = [
  "Diabetes",
  "Hypertension",
  "Heart Disease",
  "Asthma",
  "Arthritis",
  "None of the above",
] as const;
