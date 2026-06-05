'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface ProfileFormState {
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  city: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  blood_type: string;
  allergies: string;
  chronic_conditions: string;
  current_medications: string;
  medical_notes: string;
  insurance_provider: string;
  insurance_policy_number: string;
}

const EMPTY_FORM: ProfileFormState = {
  phone: '',
  date_of_birth: '',
  gender: '',
  address: '',
  city: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  blood_type: '',
  allergies: '',
  chronic_conditions: '',
  current_medications: '',
  medical_notes: '',
  insurance_provider: '',
  insurance_policy_number: '',
};

const STEPS = [
  {
    number: 1,
    label: 'Personal Info',
    title: 'Personal Information',
    description: 'Basic contact and demographic details.',
  },
  {
    number: 2,
    label: 'Medical History',
    title: 'Medical History',
    description:
      'Health details that help your care team provide better treatment.',
  },
  {
    number: 3,
    label: 'Emergency & Insurance',
    title: 'Emergency & Insurance',
    description: 'Emergency contact and insurance information.',
  },
];

export default function PatientProfileSetupPage() {
  const router = useRouter();
  const { user, patient, isLoading, refreshPatient } = useAuth();
  const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Pre-fill form from existing patient data
  useEffect(() => {
    if (patient) {
      setForm({
        phone: patient.phone ?? '',
        date_of_birth: patient.date_of_birth ?? '',
        gender: patient.gender ?? '',
        address: patient.address ?? '',
        city: patient.city ?? '',
        emergency_contact_name: patient.emergency_contact_name ?? '',
        emergency_contact_phone: patient.emergency_contact_phone ?? '',
        blood_type: patient.blood_type ?? '',
        allergies: Array.isArray(patient.allergies)
          ? patient.allergies.join(', ')
          : (patient.allergies ?? ''),
        chronic_conditions: Array.isArray(patient.chronic_conditions)
          ? patient.chronic_conditions.join(', ')
          : '',
        current_medications: patient.current_medications ?? '',
        medical_notes: patient.medical_notes ?? '',
        insurance_provider: patient.insurance_provider ?? '',
        insurance_policy_number: patient.insurance_policy_number ?? '',
      });
    }
  }, [patient]);

  const handleChange = (field: keyof ProfileFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    let patientId = patient?.id;

    if (!patientId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setSaveError('Not authenticated. Please sign in again.');
          setIsSaving(false);
          return;
        }

        const res = await fetch('/api/auth/activate', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const result = await res.json();

        if (!res.ok) throw new Error(result.error);

        patientId = result.patientId;
        await refreshPatient();
      } catch (err) {
        console.error('Failed to create patient record:', err);
        setSaveError('Failed to initialize your profile. Please try again.');
        setIsSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from('patients')
      .update({
        phone: form.phone || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        address: form.address || null,
        city: form.city || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        blood_type: form.blood_type || null,
        allergies: form.allergies
          ? form.allergies
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
        chronic_conditions: form.chronic_conditions
          ? form.chronic_conditions
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
        current_medications: form.current_medications || null,
        medical_notes: form.medical_notes || null,
        insurance_provider: form.insurance_provider || null,
        insurance_policy_number: form.insurance_policy_number || null,
        onboarding_completed: true,
      })
      .eq('id', patientId);

    if (error) {
      console.error('Profile save error:', error);
      setSaveError('Failed to save your profile. Please try again.');
      setIsSaving(false);
      return;
    }

    await refreshPatient();
    router.push('/patient');
  };

  const handleSkip = () => {
    router.push('/patient');
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='h-8 w-8 animate-spin text-clinic-navy' />
      </div>
    );
  }

  const progressPercent = Math.round(
    ((currentStep - 1) / (STEPS.length - 1)) * 100,
  );
  const activeStep = STEPS[currentStep - 1];

  return (
    <div className='container mx-auto px-4 py-8 max-w-2xl'>
      {/* Page heading */}
      <div className='mb-6'>
        <h1 className='font-display text-2xl font-bold text-clinic-navy dark:text-white'>
          Complete Your Profile
        </h1>
        <p className='mt-1 text-sm text-clinic-text/70 dark:text-white/70'>
          {activeStep.description}
        </p>
      </div>

      {/* Progress bar */}
      <div className='mb-6'>
        <div className='flex items-center justify-between mb-2'>
          <span className='text-xs font-medium text-clinic-text/60 dark:text-white/60'>
            Step {currentStep} of {STEPS.length}
          </span>
          <span className='text-xs font-medium text-clinic-teal'>
            {activeStep.label}
          </span>
        </div>
        <Progress value={progressPercent} className='h-1.5' />
      </div>

      {/* Step indicator */}
      <div className='flex items-center mb-8'>
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;

          return (
            <div
              key={step.number}
              className='flex items-center flex-1 last:flex-none'
            >
              {/* Circle */}
              <div className='flex flex-col items-center'>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 transition-colors ${
                    isCompleted || isActive
                      ? 'bg-clinic-teal text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {isCompleted ? <Check className='h-5 w-5' /> : step.number}
                </div>
                <span
                  className={`mt-1.5 text-xs font-medium whitespace-nowrap ${
                    isActive
                      ? 'text-clinic-teal'
                      : isCompleted
                        ? 'text-clinic-teal/70'
                        : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 mb-5 transition-colors ${
                    currentStep > step.number
                      ? 'bg-clinic-teal'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className='mb-6'>
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{activeStep.title}</CardTitle>
              <CardDescription>{activeStep.description}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Phone */}
              <div className='space-y-1'>
                <Label htmlFor='phone'>Phone Number</Label>
                <Input
                  id='phone'
                  type='tel'
                  placeholder='+1 (555) 000-0000'
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>

              {/* Date of Birth */}
              <div className='space-y-1'>
                <Label htmlFor='date_of_birth'>Date of Birth</Label>
                <Input
                  id='date_of_birth'
                  type='date'
                  value={form.date_of_birth}
                  onChange={(e) =>
                    handleChange('date_of_birth', e.target.value)
                  }
                />
              </div>

              {/* Gender */}
              <div className='space-y-1'>
                <Label htmlFor='gender'>Gender</Label>
                <Select
                  value={form.gender}
                  onValueChange={(value) => handleChange('gender', value)}
                >
                  <SelectTrigger id='gender'>
                    <SelectValue placeholder='Select gender' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='male'>Male</SelectItem>
                    <SelectItem value='female'>Female</SelectItem>
                    <SelectItem value='other'>Other</SelectItem>
                    <SelectItem value='prefer_not_to_say'>
                      Prefer not to say
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Address + City */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <Label htmlFor='address'>Address</Label>
                  <Input
                    id='address'
                    placeholder='123 Main St'
                    value={form.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                </div>
                <div className='space-y-1'>
                  <Label htmlFor='city'>City</Label>
                  <Input
                    id='city'
                    placeholder='New York'
                    value={form.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>{activeStep.title}</CardTitle>
              <CardDescription>{activeStep.description}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Blood Type */}
              <div className='space-y-1'>
                <Label htmlFor='blood_type'>Blood Type</Label>
                <Select
                  value={form.blood_type}
                  onValueChange={(value) => handleChange('blood_type', value)}
                >
                  <SelectTrigger id='blood_type'>
                    <SelectValue placeholder='Select blood type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='A+'>A+</SelectItem>
                    <SelectItem value='A-'>A-</SelectItem>
                    <SelectItem value='B+'>B+</SelectItem>
                    <SelectItem value='B-'>B-</SelectItem>
                    <SelectItem value='AB+'>AB+</SelectItem>
                    <SelectItem value='AB-'>AB-</SelectItem>
                    <SelectItem value='O+'>O+</SelectItem>
                    <SelectItem value='O-'>O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Allergies */}
              <div className='space-y-1'>
                <Label htmlFor='allergies'>Allergies</Label>
                <Input
                  id='allergies'
                  placeholder='e.g. Penicillin, Peanuts'
                  value={form.allergies}
                  onChange={(e) => handleChange('allergies', e.target.value)}
                />
                <p className='text-xs text-clinic-text/50 dark:text-white/50'>
                  Separate multiple allergies with commas.
                </p>
              </div>

              {/* Chronic Conditions */}
              <div className='space-y-1'>
                <Label htmlFor='chronic_conditions'>Chronic Conditions</Label>
                <Input
                  id='chronic_conditions'
                  placeholder='e.g. Diabetes, Hypertension'
                  value={form.chronic_conditions}
                  onChange={(e) =>
                    handleChange('chronic_conditions', e.target.value)
                  }
                />
                <p className='text-xs text-clinic-text/50 dark:text-white/50'>
                  Separate multiple conditions with commas.
                </p>
              </div>

              {/* Current Medications */}
              <div className='space-y-1'>
                <Label htmlFor='current_medications'>Current Medications</Label>
                <Textarea
                  id='current_medications'
                  placeholder='List any medications you are currently taking...'
                  rows={3}
                  value={form.current_medications}
                  onChange={(e) =>
                    handleChange('current_medications', e.target.value)
                  }
                />
              </div>

              {/* Additional Medical Notes */}
              <div className='space-y-1'>
                <Label htmlFor='medical_notes'>Additional Medical Notes</Label>
                <Textarea
                  id='medical_notes'
                  placeholder='Any other relevant medical information...'
                  rows={3}
                  value={form.medical_notes}
                  onChange={(e) =>
                    handleChange('medical_notes', e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>{activeStep.title}</CardTitle>
              <CardDescription>{activeStep.description}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Emergency Contact Name + Phone */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <Label htmlFor='emergency_contact_name'>
                    Emergency Contact Name
                  </Label>
                  <Input
                    id='emergency_contact_name'
                    placeholder='Jane Doe'
                    value={form.emergency_contact_name}
                    onChange={(e) =>
                      handleChange('emergency_contact_name', e.target.value)
                    }
                  />
                </div>
                <div className='space-y-1'>
                  <Label htmlFor='emergency_contact_phone'>
                    Emergency Contact Phone
                  </Label>
                  <Input
                    id='emergency_contact_phone'
                    type='tel'
                    placeholder='+1 (555) 000-0000'
                    value={form.emergency_contact_phone}
                    onChange={(e) =>
                      handleChange('emergency_contact_phone', e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Insurance Provider */}
              <div className='space-y-1'>
                <Label htmlFor='insurance_provider'>Insurance Provider</Label>
                <Input
                  id='insurance_provider'
                  placeholder='e.g. Blue Cross Blue Shield'
                  value={form.insurance_provider}
                  onChange={(e) =>
                    handleChange('insurance_provider', e.target.value)
                  }
                />
              </div>

              {/* Insurance Policy Number */}
              <div className='space-y-1'>
                <Label htmlFor='insurance_policy_number'>
                  Insurance Policy Number
                </Label>
                <Input
                  id='insurance_policy_number'
                  placeholder='Policy number'
                  value={form.insurance_policy_number}
                  onChange={(e) =>
                    handleChange('insurance_policy_number', e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Error message */}
      {saveError && (
        <p className='text-sm text-red-500 text-center mb-4'>{saveError}</p>
      )}

      {/* Navigation */}
      <div className='flex items-center justify-between pb-8'>
        {/* Left: Skip */}
        <Button variant='ghost' onClick={handleSkip} disabled={isSaving}>
          Skip for now
        </Button>

        {/* Right: Back + Next/Save */}
        <div className='flex items-center gap-2'>
          {currentStep > 1 && (
            <Button variant='outline' onClick={handleBack} disabled={isSaving}>
              Back
            </Button>
          )}

          {currentStep < 3 ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Save &amp; Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
