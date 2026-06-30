'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, ArrowLeft, Check, Building2, UserPlus, CreditCard } from 'lucide-react';
import { PublicClinicWithDetails } from '@/hooks/useGetClinics';
import { supabase } from '@/lib/supabase';
import { ClinicFormStepper, StepDefinition } from './ClinicFormStepper';
import { ClinicFormStepClinic } from './ClinicFormStepClinic';
import { ClinicFormStepAdmin } from './ClinicFormStepAdmin';
import { ClinicFormStepPlan } from './ClinicFormStepPlan';

export interface ClinicFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  subscription_plan: string;
  is_active: boolean;
  admin_email: string;
  admin_name: string;
}

interface ClinicFormProps {
  clinic?: PublicClinicWithDetails | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

const STEPS_CREATE: StepDefinition[] = [
  { id: 'clinic', label: 'Clinic Info', icon: Building2 },
  { id: 'admin', label: 'Administrator', icon: UserPlus },
  { id: 'plan', label: 'Plan & Status', icon: CreditCard },
];

const STEPS_EDIT: StepDefinition[] = [
  { id: 'clinic', label: 'Clinic Info', icon: Building2 },
  { id: 'plan', label: 'Plan & Status', icon: CreditCard },
];

const EMPTY_FORM: ClinicFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  subscription_plan: 'starter',
  is_active: true,
  admin_email: '',
  admin_name: '',
};

export function ClinicForm({ clinic, onSuccess, onCancel }: ClinicFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClinicFormData>(EMPTY_FORM);

  const isEditMode = !!clinic;
  const steps = isEditMode ? STEPS_EDIT : STEPS_CREATE;
  const isLastStep = currentStep === steps.length - 1;
  const stepId = steps[currentStep].id;

  useEffect(() => {
    if (clinic) {
      setFormData({
        name: clinic.name || '',
        email: clinic.email || '',
        phone: clinic.phone || '',
        address: clinic.address || '',
        city: clinic.city || '',
        subscription_plan: clinic.subscription_plan || 'starter',
        is_active: clinic.is_active ?? true,
        admin_email: '',
        admin_name: '',
      });
    }
  }, [clinic]);

  const validateStep = (): string | null => {
    if (stepId === 'clinic') {
      if (!formData.name.trim()) return 'Clinic name is required';
      if (!formData.email.trim()) return 'Clinic email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        return 'Please enter a valid email';
    }

    if (stepId === 'admin') {
      if (!formData.admin_name.trim()) return 'Admin name is required';
      if (!formData.admin_email.trim()) return 'Admin email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email))
        return 'Please enter a valid admin email';
    }

    return null;
  };

  const [justAdvanced, setJustAdvanced] = useState(false);

  const handleNext = () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setJustAdvanced(true);
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    setTimeout(() => setJustAdvanced(false), 100);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleChange = (field: keyof ClinicFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLastStep || justAdvanced) return;

    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session. Please log in again.');
      }

      const endpoint = clinic
        ? `/api/super-admin/clinics/${clinic.id}`
        : '/api/super-admin/clinics';

      const method = clinic ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${clinic ? 'update' : 'create'} clinic`);
      }

      if (!clinic && data.message) {
        setSuccessMessage(data.message);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        onSuccess();
      }
    } catch (err) {
      console.error('Clinic form error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      }}
      className='space-y-5'
    >
      <ClinicFormStepper steps={steps} currentStep={currentStep} />

      {/* Error / Success Messages */}
      {error && (
        <div className='p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
          <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
        </div>
      )}
      {successMessage && (
        <div className='p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg'>
          <p className='text-sm text-green-600 dark:text-green-400'>{successMessage}</p>
        </div>
      )}

      {stepId === 'clinic' && (
        <ClinicFormStepClinic formData={formData} onChange={handleChange} />
      )}

      {stepId === 'admin' && (
        <ClinicFormStepAdmin formData={formData} onChange={handleChange} />
      )}

      {stepId === 'plan' && (
        <ClinicFormStepPlan formData={formData} isEditMode={isEditMode} onChange={handleChange} />
      )}

      {/* Navigation */}
      <div className='flex gap-3 pt-2'>
        {currentStep > 0 && (
          <Button
            type='button'
            variant='outline'
            onClick={handleBack}
            disabled={isLoading}
            className='border-clinic-navy/10 dark:border-white/10'
          >
            <ArrowLeft className='w-4 h-4 mr-1' />
            Back
          </Button>
        )}
        {onCancel && currentStep === 0 && (
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            disabled={isLoading}
            className='border-clinic-navy/10 dark:border-white/10'
          >
            Cancel
          </Button>
        )}
        <div className='flex-1' />
        {isLastStep ? (
          <Button
            type='submit'
            disabled={isLoading || !!successMessage}
            className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'
          >
            {isLoading ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : successMessage ? (
              <>
                <Check className='w-4 h-4 mr-2' />
                Success!
              </>
            ) : (
              <>{isEditMode ? 'Update Clinic' : 'Create Clinic'}</>
            )}
          </Button>
        ) : (
          <Button
            type='button'
            onClick={handleNext}
            className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'
          >
            Next
            <ArrowRight className='w-4 h-4 ml-1' />
          </Button>
        )}
      </div>
    </form>
  );
}
