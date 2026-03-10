'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Brain,
  Calendar,
  Check,
  Clock,
  Shield,
  Sparkles,
  User,
  Heart,
  FileText,
  Upload,
  AlertCircle,
  X,
  Loader2,
  Stethoscope,
  CheckCircle,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { PatientDocument } from '@/types/database';

const steps = [
  { id: 1, name: 'Set Password', icon: Lock },
  { id: 2, name: 'Personal Info', icon: User },
  { id: 3, name: 'Health History', icon: Heart },
  { id: 4, name: 'Documents', icon: FileText },
  { id: 5, name: 'AI Analysis', icon: Brain },
];

const bloodTypes = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
  'Unknown',
];
const genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

const chronicConditions = [
  'Diabetes',
  'Hypertension',
  'Heart Disease',
  'Asthma',
  'Arthritis',
  'Cancer',
  'Kidney Disease',
  'Liver Disease',
  'Thyroid Disorder',
  'Mental Health Condition',
  'None',
];

export default function PatientOnboardingPage() {
  const router = useRouter();
  const { user, patient, isLoading: authLoading, refreshPatient } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password setup state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSet, setPasswordSet] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodType: '',
    allergies: [] as string[],
    chronicConditions: [] as string[],
    currentMedications: '',
    medicalNotes: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
  });

  const [allergiesInput, setAllergiesInput] = useState('');
  const [uploadedDocuments, setUploadedDocuments] = useState<PatientDocument[]>(
    [],
  );
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<{
    specialty: string;
    reason: string;
    confidence: number;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/patient/onboarding');
    }
  }, [user, authLoading, router]);

  // Check if user already has a password set (signed up normally vs invited)
  useEffect(() => {
    if (user) {
      // If user has identities with provider 'email', they signed up with password
      // Check if they came from an invite link (recovery flow)
      const isFromInvite = user.app_metadata?.provider === 'email' && 
        user.user_metadata?.invited_at;
      
      // If they already have a password and didn't come from invite, skip password step
      if (!isFromInvite && patient?.onboarding_completed === false) {
        // User signed up normally, check if they need to set password
        // For now, we'll show the password step for all new users
      }
    }
  }, [user, patient]);

  useEffect(() => {
    if (patient) {
      setFormData({
        phone: patient.phone || '',
        dateOfBirth: patient.date_of_birth || '',
        gender: patient.gender || '',
        address: patient.address || '',
        city: patient.city || '',
        emergencyContactName: patient.emergency_contact_name || '',
        emergencyContactPhone: patient.emergency_contact_phone || '',
        bloodType: patient.blood_type || '',
        allergies: patient.allergies || [],
        chronicConditions: patient.chronic_conditions || [],
        currentMedications: patient.current_medications || '',
        medicalNotes: patient.medical_notes || '',
        insuranceProvider: patient.insurance_provider || '',
        insurancePolicyNumber: patient.insurance_policy_number || '',
      });
      setAllergiesInput((patient.allergies || []).join(', '));

      // Fetch existing documents
      fetchDocuments();
    }
  }, [patient]);

  const fetchDocuments = async () => {
    if (!patient) return;

    const { data, error } = await supabase
      .from('patient_documents')
      .select('*')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false });

    if (data) {
      setUploadedDocuments(data);
    }
  };

  const progress = (currentStep / steps.length) * 100;

  const handleConditionToggle = (condition: string) => {
    setFormData((prev) => {
      if (condition === 'None') {
        return {
          ...prev,
          chronicConditions: prev.chronicConditions.includes('None')
            ? []
            : ['None'],
        };
      }
      const newConditions = prev.chronicConditions.includes(condition)
        ? prev.chronicConditions.filter((c) => c !== condition)
        : [...prev.chronicConditions.filter((c) => c !== 'None'), condition];
      return { ...prev, chronicConditions: newConditions };
    });
  };

  const handleAllergiesChange = (value: string) => {
    setAllergiesInput(value);
    const allergies = value
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, allergies }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !patient) return;

    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        // Upload to Supabase Storage
        const fileName = `${patient.id}/${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('patient-documents')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          // Continue with mock data for demo
        }

        const fileUrl = uploadData?.path
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/patient-documents/${uploadData.path}`
          : `/documents/${file.name}`;

        // Save document record
        const { data: docData, error: docError } = await supabase
          .from('patient_documents')
          .insert({
            patient_id: patient.id,
            file_name: file.name,
            file_url: fileUrl,
            file_type: file.type,
            file_size: file.size,
            document_type: getDocumentType(file.name),
          })
          .select()
          .single();

        if (docError) {
          console.error('Document save error:', docError);
        } else if (docData) {
          setUploadedDocuments((prev) => [docData, ...prev]);
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload documents. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getDocumentType = (fileName: string): string => {
    const lower = fileName.toLowerCase();
    if (lower.includes('lab') || lower.includes('result')) return 'Lab Results';
    if (
      lower.includes('xray') ||
      lower.includes('scan') ||
      lower.includes('mri')
    )
      return 'Imaging';
    if (lower.includes('prescription') || lower.includes('rx'))
      return 'Prescription';
    if (lower.includes('insurance')) return 'Insurance';
    if (lower.includes('referral')) return 'Referral';
    return 'Medical Record';
  };

  const removeDocument = async (docId: string) => {
    const { error } = await supabase
      .from('patient_documents')
      .delete()
      .eq('id', docId);

    if (!error) {
      setUploadedDocuments((prev) => prev.filter((d) => d.id !== docId));
    }
  };

  // Password validation
  const validatePassword = (pwd: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(pwd)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(pwd)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(pwd)) errors.push('One number');
    return { valid: errors.length === 0, errors };
  };

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSetPassword = async () => {
    if (!passwordValidation.valid) {
      setError('Please meet all password requirements');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      // Mark that password has been set
      setPasswordSet(true);
      
      // Move to next step
      setCurrentStep(2);
    } catch (err) {
      console.error('Password update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to set password');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeDocuments = async () => {
    if (uploadedDocuments.length === 0) {
      // Skip analysis if no documents
      setAiRecommendation({
        specialty: 'General Practice',
        reason:
          'Based on your health profile, we recommend starting with a general practitioner for an initial assessment.',
        confidence: 75,
      });
      return;
    }

    setAnalyzing(true);

    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Mock AI recommendation based on conditions
    const hasHeartCondition =
      formData.chronicConditions.includes('Heart Disease') ||
      formData.chronicConditions.includes('Hypertension');
    const hasDiabetes = formData.chronicConditions.includes('Diabetes');
    const hasMentalHealth = formData.chronicConditions.includes(
      'Mental Health Condition',
    );

    let recommendation = {
      specialty: 'General Practice',
      reason:
        'Based on your health profile and uploaded documents, we recommend starting with a general practitioner.',
      confidence: 85,
    };

    if (hasHeartCondition) {
      recommendation = {
        specialty: 'Cardiology',
        reason:
          'Your health history indicates cardiovascular concerns. A cardiologist can provide specialized care and monitoring.',
        confidence: 92,
      };
    } else if (hasDiabetes) {
      recommendation = {
        specialty: 'Endocrinology',
        reason:
          'For optimal diabetes management, an endocrinologist can provide specialized treatment plans.',
        confidence: 88,
      };
    } else if (hasMentalHealth) {
      recommendation = {
        specialty: 'Psychiatry',
        reason:
          'Mental health conditions benefit from specialized psychiatric care and support.',
        confidence: 90,
      };
    }

    setAiRecommendation(recommendation);
    setAnalyzing(false);
  };

  const saveProgress = async () => {
    if (!patient) {
      console.error('No patient found');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Saving patient data...', patient.id);

      const { error, data: updatedPatientData } = await supabase
        .from('patients')
        .update({
          phone: formData.phone || null,
          date_of_birth: formData.dateOfBirth || null,
          gender: formData.gender || null,
          address: formData.address || null,
          city: formData.city || null,
          emergency_contact_name: formData.emergencyContactName || null,
          emergency_contact_phone: formData.emergencyContactPhone || null,
          blood_type: formData.bloodType || null,
          allergies: formData.allergies.length > 0 ? formData.allergies : null,
          chronic_conditions:
            formData.chronicConditions.length > 0
              ? formData.chronicConditions
              : null,
          current_medications: formData.currentMedications || null,
          medical_notes: formData.medicalNotes || null,
          insurance_provider: formData.insuranceProvider || null,
          insurance_policy_number: formData.insurancePolicyNumber || null,
          onboarding_completed: currentStep === 5,
          updated_at: new Date().toISOString(),
        })
        .eq('id', patient.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Save successful, refreshing patient...');
      await refreshPatient();
      console.log('Patient refreshed');
    } catch (err) {
      console.error('Save error:', err);
      setError(
        `Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
      throw err; // Re-throw to prevent navigation on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    // Step 1 is password setup - handle separately
    if (currentStep === 1) {
      await handleSetPassword();
      return;
    }

    if (currentStep < steps.length) {
      try {
        await saveProgress();
        if (currentStep === 4) {
          // Documents step (was step 3, now step 4)
          await analyzeDocuments();
        }
        setCurrentStep((prev) => prev + 1);
      } catch (err) {
        // Error is already handled in saveProgress, just prevent navigation
        console.error('Failed to proceed to next step:', err);
      }
    }
  };

  const handlePrev = () => {
    // Don't allow going back to password step once it's set
    if (currentStep > 1 && (currentStep > 2 || !passwordSet)) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await saveProgress();
      // Redirect to clinic-specific dashboard if patient has a clinic, otherwise general patient dashboard
      if (patient?.clinic_id) {
        router.push(`/clinic/${patient.clinic_id}/patient`);
      } else {
        router.push('/patient');
      }
    } catch (err) {
      // Error is already handled in saveProgress, just prevent navigation
      console.error('Failed to complete onboarding:', err);
    }
  };

  if (authLoading) {
    return (
      <div className='min-h-screen bg-clinic-bg dark:bg-slate-900 flex items-center justify-center'>
        <div className='animate-pulse text-clinic-navy dark:text-white'>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-clinic-bg dark:bg-slate-900'>
      {/* Header */}
      <header className='sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-clinic-navy/10 dark:border-white/10'>
        <div className='container mx-auto px-4 h-16 flex items-center justify-between'>
          <Link href='/' className='flex items-center gap-2'>
            <div className='w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-clinic-navy to-clinic-teal'>
              <Activity className='w-4 h-4 text-white' />
            </div>
            <span className='font-display font-bold text-clinic-navy dark:text-white'>
              MediFlow
            </span>
          </Link>

          <div className='flex items-center gap-4 text-sm'>
            <div className='flex items-center gap-2 text-clinic-text/60 dark:text-white/60'>
              <Shield className='w-4 h-4' />
              <span>Secure & Encrypted</span>
            </div>
          </div>
        </div>
      </header>

      <main className='container mx-auto px-4 py-8'>
        <div className='max-w-2xl mx-auto'>
          {/* Progress Header */}
          <div className='mb-8'>
            <h1 className='font-display text-2xl font-bold text-clinic-navy dark:text-white mb-2'>
              Complete Your Health Profile
            </h1>
            <p className='text-clinic-text/60 dark:text-white/60'>
              Help us understand your health needs better for personalized care
            </p>
          </div>

          {/* Progress Steps */}
          <div className='mb-8'>
            <div className='flex items-center justify-between mb-4'>
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    'flex flex-col items-center',
                    index < steps.length - 1 && 'flex-1',
                  )}
                >
                  <div className='flex items-center w-full'>
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                        currentStep >= step.id
                          ? 'bg-clinic-teal text-white'
                          : 'bg-clinic-navy/10 dark:bg-white/10 text-clinic-text/40 dark:text-white/40',
                      )}
                    >
                      {currentStep > step.id ? (
                        <Check className='w-5 h-5' />
                      ) : (
                        <step.icon className='w-5 h-5' />
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          'flex-1 h-1 mx-2 rounded-full',
                          currentStep > step.id
                            ? 'bg-clinic-teal'
                            : 'bg-clinic-navy/10 dark:bg-white/10',
                        )}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs mt-2 text-center hidden sm:block',
                      currentStep >= step.id
                        ? 'text-clinic-navy dark:text-white font-medium'
                        : 'text-clinic-text/40 dark:text-white/40',
                    )}
                  >
                    {step.name}
                  </span>
                </div>
              ))}
            </div>
            <Progress value={progress} className='h-2' />
          </div>

          {error && (
            <div className='mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2 text-red-700 dark:text-red-400 text-sm'>
              <AlertCircle className='w-4 h-4 flex-shrink-0' />
              {error}
            </div>
          )}

          {/* Form Card */}
          <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-clinic-navy/10 dark:border-white/10 p-6 sm:p-8'>
            {/* Step 1: Password Setup */}
            {currentStep === 1 && (
              <div className='space-y-6'>
                <div className='flex items-center gap-3 mb-6'>
                  <div className='w-10 h-10 rounded-full bg-clinic-teal/10 flex items-center justify-center'>
                    <Lock className='w-5 h-5 text-clinic-teal' />
                  </div>
                  <div>
                    <h2 className='font-display text-lg font-bold text-clinic-navy dark:text-white'>
                      Set Your Password
                    </h2>
                    <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                      Create a secure password for your account
                    </p>
                  </div>
                </div>

                {/* Welcome Message */}
                <div className='bg-clinic-teal/5 dark:bg-clinic-teal/10 rounded-lg p-4 border border-clinic-teal/20'>
                  <div className='flex items-start gap-3'>
                    <Sparkles className='w-5 h-5 text-clinic-teal flex-shrink-0 mt-0.5' />
                    <div>
                      <p className='font-medium text-clinic-navy dark:text-white text-sm'>
                        Welcome to MediFlow!
                      </p>
                      <p className='text-xs text-clinic-text/60 dark:text-white/60 mt-1'>
                        {user?.email && (
                          <>You're setting up your account for <strong>{user.email}</strong>. </>
                        )}
                        Please create a secure password to protect your health information.
                      </p>
                    </div>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='password'>New Password</Label>
                    <div className='relative'>
                      <Input
                        id='password'
                        type={showPassword ? 'text' : 'password'}
                        placeholder='Enter your password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className='pr-10'
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-clinic-text/40 hover:text-clinic-text/60 dark:text-white/40 dark:hover:text-white/60'
                      >
                        {showPassword ? (
                          <EyeOff className='w-4 h-4' />
                        ) : (
                          <Eye className='w-4 h-4' />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='confirmPassword'>Confirm Password</Label>
                    <div className='relative'>
                      <Input
                        id='confirmPassword'
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder='Confirm your password'
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className='pr-10'
                      />
                      <button
                        type='button'
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-clinic-text/40 hover:text-clinic-text/60 dark:text-white/40 dark:hover:text-white/60'
                      >
                        {showConfirmPassword ? (
                          <EyeOff className='w-4 h-4' />
                        ) : (
                          <Eye className='w-4 h-4' />
                        )}
                      </button>
                    </div>
                    {confirmPassword && !passwordsMatch && (
                      <p className='text-xs text-red-500'>Passwords do not match</p>
                    )}
                    {passwordsMatch && (
                      <p className='text-xs text-green-500 flex items-center gap-1'>
                        <Check className='w-3 h-3' /> Passwords match
                      </p>
                    )}
                  </div>
                </div>

                {/* Password Requirements */}
                <div className='bg-clinic-navy/5 dark:bg-white/5 rounded-lg p-4'>
                  <p className='text-sm font-medium text-clinic-navy dark:text-white mb-3'>
                    Password Requirements
                  </p>
                  <div className='grid grid-cols-2 gap-2'>
                    {[
                      { label: 'At least 8 characters', met: password.length >= 8 },
                      { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
                      { label: 'One lowercase letter', met: /[a-z]/.test(password) },
                      { label: 'One number', met: /[0-9]/.test(password) },
                    ].map((req) => (
                      <div
                        key={req.label}
                        className={cn(
                          'flex items-center gap-2 text-xs',
                          req.met
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-clinic-text/50 dark:text-white/50'
                        )}
                      >
                        {req.met ? (
                          <CheckCircle className='w-3.5 h-3.5' />
                        ) : (
                          <div className='w-3.5 h-3.5 rounded-full border border-current' />
                        )}
                        {req.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security Note */}
                <div className='flex items-start gap-3 text-xs text-clinic-text/50 dark:text-white/50'>
                  <Shield className='w-4 h-4 flex-shrink-0 mt-0.5' />
                  <p>
                    Your password is encrypted and stored securely. We never have access to your plain text password.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Personal Info */}
            {currentStep === 2 && (
              <div className='space-y-6'>
                <div className='flex items-center gap-3 mb-6'>
                  <div className='w-10 h-10 rounded-full bg-clinic-teal/10 flex items-center justify-center'>
                    <User className='w-5 h-5 text-clinic-teal' />
                  </div>
                  <div>
                    <h2 className='font-display text-lg font-bold text-clinic-navy dark:text-white'>
                      Personal Information
                    </h2>
                    <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                      Your basic contact and personal details
                    </p>
                  </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='phone'>Phone Number</Label>
                    <Input
                      id='phone'
                      type='tel'
                      placeholder='+63 XXX XXX XXXX'
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='dob'>Date of Birth</Label>
                    <Input
                      id='dob'
                      type='date'
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label>Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gender: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select gender' />
                    </SelectTrigger>
                    <SelectContent>
                      {genders.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='address'>Address</Label>
                  <Input
                    id='address'
                    placeholder='Street address'
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='city'>City</Label>
                  <Input
                    id='city'
                    placeholder='City'
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>

                <div className='border-t border-clinic-navy/10 dark:border-white/10 pt-6 mt-6'>
                  <h3 className='font-medium text-clinic-navy dark:text-white mb-4'>
                    Emergency Contact
                  </h3>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='emergencyName'>Contact Name</Label>
                      <Input
                        id='emergencyName'
                        placeholder='Full name'
                        value={formData.emergencyContactName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContactName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='emergencyPhone'>Contact Phone</Label>
                      <Input
                        id='emergencyPhone'
                        type='tel'
                        placeholder='+63 XXX XXX XXXX'
                        value={formData.emergencyContactPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContactPhone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Health History */}
            {currentStep === 3 && (
              <div className='space-y-6'>
                <div className='flex items-center gap-3 mb-6'>
                  <div className='w-10 h-10 rounded-full bg-clinic-teal/10 flex items-center justify-center'>
                    <Heart className='w-5 h-5 text-clinic-teal' />
                  </div>
                  <div>
                    <h2 className='font-display text-lg font-bold text-clinic-navy dark:text-white'>
                      Health History
                    </h2>
                    <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                      Help us understand your medical background
                    </p>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label>Blood Type</Label>
                  <Select
                    value={formData.bloodType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, bloodType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select blood type' />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodTypes.map((bt) => (
                        <SelectItem key={bt} value={bt}>
                          {bt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='allergies'>Allergies</Label>
                  <Input
                    id='allergies'
                    placeholder='Enter allergies separated by commas (e.g., Penicillin, Peanuts)'
                    value={allergiesInput}
                    onChange={(e) => handleAllergiesChange(e.target.value)}
                  />
                  {formData.allergies.length > 0 && (
                    <div className='flex flex-wrap gap-2 mt-2'>
                      {formData.allergies.map((allergy, i) => (
                        <span
                          key={i}
                          className='px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm'
                        >
                          {allergy}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className='space-y-3'>
                  <Label>Chronic Conditions</Label>
                  <p className='text-xs text-clinic-text/60 dark:text-white/60'>
                    Select all that apply
                  </p>
                  <div className='grid grid-cols-2 gap-2'>
                    {chronicConditions.map((condition) => (
                      <div
                        key={condition}
                        className={cn(
                          'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all',
                          formData.chronicConditions.includes(condition)
                            ? 'border-clinic-teal bg-clinic-teal/5'
                            : 'border-clinic-navy/10 dark:border-white/10 hover:border-clinic-teal/50',
                        )}
                        onClick={() => handleConditionToggle(condition)}
                      >
                        <Checkbox
                          checked={formData.chronicConditions.includes(
                            condition,
                          )}
                          onCheckedChange={() =>
                            handleConditionToggle(condition)
                          }
                        />
                        <span className='text-sm text-clinic-navy dark:text-white'>
                          {condition}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='medications'>Current Medications</Label>
                  <Textarea
                    id='medications'
                    placeholder='List any medications you are currently taking, including dosage'
                    value={formData.currentMedications}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentMedications: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='notes'>Additional Medical Notes</Label>
                  <Textarea
                    id='notes'
                    placeholder="Any other health information you'd like to share"
                    value={formData.medicalNotes}
                    onChange={(e) =>
                      setFormData({ ...formData, medicalNotes: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className='border-t border-clinic-navy/10 dark:border-white/10 pt-6 mt-6'>
                  <h3 className='font-medium text-clinic-navy dark:text-white mb-4'>
                    Insurance Information (Optional)
                  </h3>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='insuranceProvider'>Provider</Label>
                      <Input
                        id='insuranceProvider'
                        placeholder='Insurance company'
                        value={formData.insuranceProvider}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            insuranceProvider: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='policyNumber'>Policy Number</Label>
                      <Input
                        id='policyNumber'
                        placeholder='Policy/Member ID'
                        value={formData.insurancePolicyNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            insurancePolicyNumber: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Document Upload */}
            {currentStep === 4 && (
              <div className='space-y-6'>
                <div className='flex items-center gap-3 mb-6'>
                  <div className='w-10 h-10 rounded-full bg-clinic-teal/10 flex items-center justify-center'>
                    <FileText className='w-5 h-5 text-clinic-teal' />
                  </div>
                  <div>
                    <h2 className='font-display text-lg font-bold text-clinic-navy dark:text-white'>
                      Upload Medical Documents
                    </h2>
                    <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                      Share records from previous doctors for AI-assisted
                      recommendations
                    </p>
                  </div>
                </div>

                <div className='border-2 border-dashed border-clinic-navy/20 dark:border-white/20 rounded-xl p-8 text-center'>
                  <input
                    type='file'
                    id='fileUpload'
                    className='hidden'
                    multiple
                    accept='.pdf,.jpg,.jpeg,.png,.doc,.docx'
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <label
                    htmlFor='fileUpload'
                    className='cursor-pointer flex flex-col items-center'
                  >
                    {uploading ? (
                      <Loader2 className='w-12 h-12 text-clinic-teal animate-spin mb-4' />
                    ) : (
                      <Upload className='w-12 h-12 text-clinic-text/40 dark:text-white/40 mb-4' />
                    )}
                    <p className='font-medium text-clinic-navy dark:text-white mb-1'>
                      {uploading ? 'Uploading...' : 'Click to upload documents'}
                    </p>
                    <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                      PDF, JPG, PNG, DOC up to 10MB each
                    </p>
                  </label>
                </div>

                <div className='bg-clinic-ai/5 dark:bg-clinic-ai/10 rounded-lg p-4'>
                  <div className='flex items-start gap-3'>
                    <Sparkles className='w-5 h-5 text-clinic-ai flex-shrink-0 mt-0.5' />
                    <div>
                      <p className='font-medium text-clinic-navy dark:text-white text-sm'>
                        AI-Powered Analysis
                      </p>
                      <p className='text-xs text-clinic-text/60 dark:text-white/60 mt-1'>
                        Our AI will analyze your documents to recommend the best
                        specialist for your needs. All data is encrypted and
                        HIPAA-compliant.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Uploaded Documents List */}
                {uploadedDocuments.length > 0 && (
                  <div className='space-y-3'>
                    <Label>Uploaded Documents</Label>
                    {uploadedDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className='flex items-center justify-between p-3 bg-clinic-navy/5 dark:bg-white/5 rounded-lg'
                      >
                        <div className='flex items-center gap-3'>
                          <FileText className='w-5 h-5 text-clinic-teal' />
                          <div>
                            <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                              {doc.file_name}
                            </p>
                            <p className='text-xs text-clinic-text/60 dark:text-white/60'>
                              {typeof doc.document_type === 'object'
                                ? doc.document_type.document_name
                                : doc.document_type || 'Document'}
                              {doc.file_size_bytes &&
                                ` • ${(doc.file_size_bytes / 1024).toFixed(1)} KB`}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => removeDocument(doc.id)}
                        >
                          <X className='w-4 h-4' />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <p className='text-xs text-clinic-text/50 dark:text-white/50 text-center'>
                  You can skip this step and upload documents later
                </p>
              </div>
            )}

            {/* Step 5: AI Analysis Results */}
            {currentStep === 5 && (
              <div className='space-y-6'>
                <div className='flex items-center gap-3 mb-6'>
                  <div className='w-10 h-10 rounded-full bg-clinic-ai/10 flex items-center justify-center'>
                    <Brain className='w-5 h-5 text-clinic-ai' />
                  </div>
                  <div>
                    <h2 className='font-display text-lg font-bold text-clinic-navy dark:text-white'>
                      AI Recommendation
                    </h2>
                    <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                      Based on your health profile and documents
                    </p>
                  </div>
                </div>

                {analyzing ? (
                  <div className='flex flex-col items-center py-12'>
                    <Loader2 className='w-12 h-12 text-clinic-ai animate-spin mb-4' />
                    <p className='font-medium text-clinic-navy dark:text-white'>
                      Analyzing your health data...
                    </p>
                    <p className='text-sm text-clinic-text/60 dark:text-white/60 mt-1'>
                      This may take a moment
                    </p>
                  </div>
                ) : aiRecommendation ? (
                  <div className='space-y-6'>
                    <div className='bg-gradient-to-br from-clinic-navy/5 to-clinic-teal/5 dark:from-clinic-navy/20 dark:to-clinic-teal/20 rounded-xl p-6 border border-clinic-teal/20'>
                      <div className='flex items-start gap-4'>
                        <div className='w-12 h-12 rounded-full bg-clinic-teal/20 flex items-center justify-center flex-shrink-0'>
                          <Stethoscope className='w-6 h-6 text-clinic-teal' />
                        </div>
                        <div>
                          <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1'>
                            Recommended Specialist
                          </p>
                          <h3 className='text-xl font-display font-bold text-clinic-navy dark:text-white'>
                            {aiRecommendation.specialty}
                          </h3>
                          <div className='flex items-center gap-2 mt-2'>
                            <div className='px-2 py-1 bg-clinic-ai/10 rounded text-xs text-clinic-ai font-medium'>
                              {aiRecommendation.confidence}% Confidence
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className='mt-4 text-sm text-clinic-text/80 dark:text-white/80'>
                        {aiRecommendation.reason}
                      </p>
                    </div>

                    <div className='bg-green-50 dark:bg-green-900/20 rounded-lg p-4'>
                      <div className='flex items-start gap-3'>
                        <CheckCircle className='w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5' />
                        <div>
                          <p className='font-medium text-green-700 dark:text-green-400 text-sm'>
                            Profile Complete!
                          </p>
                          <p className='text-xs text-green-600/80 dark:text-green-400/80 mt-1'>
                            You're all set to book appointments. Your
                            information will help doctors provide better care.
                          </p>
                        </div>
                      </div>
                    </div>

                    {uploadedDocuments.length > 0 && (
                      <div className='space-y-3'>
                        <Label>Documents Analyzed</Label>
                        {uploadedDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className='p-3 bg-clinic-navy/5 dark:bg-white/5 rounded-lg'
                          >
                            <div className='flex items-center gap-2 mb-1'>
                              <FileText className='w-4 h-4 text-clinic-teal' />
                              <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                                {doc.file_name}
                              </p>
                              <CheckCircle className='w-4 h-4 text-green-500 ml-auto' />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='text-center py-8'>
                    <p className='text-clinic-text/60 dark:text-white/60'>
                      No analysis available yet
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className='flex justify-between mt-8 pt-6 border-t border-clinic-navy/10 dark:border-white/10'>
              <Button
                variant='ghost'
                onClick={handlePrev}
                disabled={currentStep === 1 || (currentStep === 2 && passwordSet) || isLoading}
              >
                <ArrowLeft className='w-4 h-4 mr-2' />
                Back
              </Button>

              {currentStep === steps.length ? (
                <Button
                  onClick={handleComplete}
                  disabled={isLoading || analyzing}
                  className='bg-clinic-teal hover:bg-clinic-teal/90'
                >
                  {isLoading ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <Check className='w-4 h-4 ml-2' />
                    </>
                  )}
                </Button>
              ) : currentStep === 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={isLoading || !passwordValidation.valid || !passwordsMatch}
                  className='bg-clinic-teal hover:bg-clinic-teal/90'
                >
                  {isLoading ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Setting Password...
                    </>
                  ) : (
                    <>
                      Set Password & Continue
                      <ArrowRight className='w-4 h-4 ml-2' />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={isLoading}
                  className='bg-clinic-teal hover:bg-clinic-teal/90'
                >
                  {isLoading ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className='w-4 h-4 ml-2' />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Trust Badges */}
          <div className='flex items-center justify-center gap-6 mt-8 text-xs text-clinic-text/50 dark:text-white/50'>
            <div className='flex items-center gap-1'>
              <Shield className='w-4 h-4' />
              HIPAA Compliant
            </div>
            <div className='flex items-center gap-1'>
              <Clock className='w-4 h-4' />
              Auto-saved
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
