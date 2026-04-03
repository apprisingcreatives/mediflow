export { default as useGetClinics } from './useGetClinics';
export { default as useGetClinic } from './useGetClinic';
export { useInviteUser } from './useInviteUser';
export { default as useGetFeatures } from './useGetFeatures';
export { default as usePutClinicFeatures } from './usePutClinicFeatures';
export { default as useGetClinicFeatures } from './useGetClinicFeatures';

// Appointment-related hooks
export { default as useGetAppointments } from './useGetAppointments';
export { default as useGetPractitioners } from './useGetPractitioners';
export { default as useGetServices } from './useGetServices';
export { default as useGetPatients } from './useGetPatients';
export { default as useCreateAppointment } from './useCreateAppointment';
export { default as useUpdateAppointment } from './useUpdateAppointment';

// Patient-related hooks
export { default as usePatientClinics } from './usePatientClinics';
export { default as usePatientBooking } from './usePatientBooking';

// Service mutations
export { default as useServiceMutations } from './useServiceMutations';
export { default as useFeatureMutations } from './useFeatureMutations';

// Re-export types
export type { Appointment, AppointmentStatus } from './useGetAppointments';
export { APPOINTMENT_STATUSES } from './useGetAppointments';
export type { Practitioner, PractitionerWorkingHours } from './useGetPractitioners';
export { DAY_NAMES } from './useGetPractitioners';
export type { ClinicService } from './useGetServices';
export { canPractitionerPerformService, SPECIALIZATION_SERVICE_MAP } from './useGetServices';
export type { Patient } from './useGetPatients';

export {default as useBookingForm} from "./useBookingForm"

// Practitioner dashboard
export { default as usePractitionerDashboard } from './usePractitionerDashboard';
export type { PractitionerProfile } from './usePractitionerDashboard';