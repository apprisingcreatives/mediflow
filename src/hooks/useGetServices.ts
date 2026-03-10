'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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

// Common specializations that map to service types
export const SPECIALIZATION_SERVICE_MAP: Record<string, string[]> = {
  'General Practice': ['General Consultation', 'Follow-up', 'Physical Exam'],
  'Dentist': ['Dental Checkup', 'Teeth Cleaning', 'Dental Filling', 'Tooth Extraction'],
  'Pediatrics': ['Pediatric Consultation', 'Vaccination', 'Well-Baby Checkup'],
  'Cardiology': ['Cardiac Consultation', 'ECG', 'Stress Test'],
  'Dermatology': ['Skin Consultation', 'Acne Treatment', 'Mole Removal'],
  'Ophthalmology': ['Eye Exam', 'Vision Test', 'Glaucoma Screening'],
  'Orthopedics': ['Orthopedic Consultation', 'X-Ray Review', 'Joint Injection'],
  'OB-GYN': ['Prenatal Checkup', 'Pap Smear', 'Ultrasound'],
  'ENT': ['ENT Consultation', 'Hearing Test', 'Throat Exam'],
  'Psychiatry': ['Psychiatric Consultation', 'Therapy Session', 'Medication Review'],
};

// Check if a practitioner can perform a service based on specialization
export const canPractitionerPerformService = (
  practitionerSpecialization: string | null,
  serviceName: string
): boolean => {
  // If no specialization, can only do general consultation
  if (!practitionerSpecialization) {
    return serviceName.toLowerCase().includes('general consultation') ||
           serviceName.toLowerCase().includes('follow-up');
  }

  // Check if the service matches the practitioner's specialization
  const allowedServices = SPECIALIZATION_SERVICE_MAP[practitionerSpecialization] || [];
  
  // Always allow general consultation for any practitioner
  if (serviceName.toLowerCase().includes('general consultation') ||
      serviceName.toLowerCase().includes('follow-up')) {
    return true;
  }

  // Check if service name matches any allowed service (case-insensitive partial match)
  return allowedServices.some(
    allowed => serviceName.toLowerCase().includes(allowed.toLowerCase()) ||
               allowed.toLowerCase().includes(serviceName.toLowerCase())
  );
};

interface FetchServicesParams {
  clinicId: string;
  activeOnly?: boolean;
}

const useGetServices = () => {
  const [services, setServices] = useState<ClinicService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(
    async ({ clinicId, activeOnly = true }: FetchServicesParams) => {
      if (!clinicId) {
        console.error('fetchServices called without clinicId');
        return [];
      }

      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('clinic_services')
          .select('*')
          .eq('clinic_id', clinicId)
          .order('name', { ascending: true });

        if (activeOnly) {
          query = query.eq('is_active', true);
        }

        const { data, error: queryError } = await query;

        if (queryError) {
          throw queryError;
        }

        setServices(data ?? []);
        return data ?? [];
      } catch (err) {
        console.error('Failed to fetch services:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch services';
        setError(errorMessage);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    services,
    loading,
    error,
    fetchServices,
  };
};

export default useGetServices;
