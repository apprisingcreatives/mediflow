'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RegisterHeader } from '@/components/clinic/register/RegisterHeader';
import { ClinicInfoStep } from '@/components/clinic/register/ClinicInfoStep';
import { PractitionerStep } from '@/components/clinic/register/PractitionerStep';
import { ServicesStep, Service } from '@/components/clinic/register/ServicesStep';
import { SelectPlanStep } from '@/components/clinic/register/SelectPlanStep';
import { SuccessStep } from '@/components/clinic/register/SuccessStep';

export default function ClinicRegisterPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Clinic Info & Admin Password
  const [clinicName, setClinicName] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicCity, setClinicCity] = useState('');
  const [clinicDescription, setClinicDescription] = useState('');

  // Practitioner Info
  const [practitionerName, setPractitionerName] = useState('');
  const [practitionerEmail, setPractitionerEmail] = useState('');
  const [practitionerSpecialization, setPractitionerSpecialization] = useState('');

  // Services
  const [services, setServices] = useState<Service[]>([
    { name: '', description: '', duration: '30', price: '' },
  ]);

  // Plan
  const [selectedPlan, setSelectedPlan] = useState('');

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/clinic/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic: {
            name: clinicName,
            email: clinicEmail,
            password: adminPassword, // Admin password
            phone: clinicPhone,
            address: clinicAddress,
            city: clinicCity,
            description: clinicDescription,
            subscription_plan: selectedPlan,
          },
          practitioner: {
            name: practitionerName,
            email: practitionerEmail,
            specialization: practitionerSpecialization,
          },
          services: services.filter((s) => s.name && s.price),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Registration failed');
        return;
      }
      setStep(5);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-clinic-bg dark:bg-slate-900 py-12 px-4'>
      <div className={`mx-auto ${step === 4 ? 'max-w-4xl' : 'max-w-2xl'} transition-all`}>
        <RegisterHeader step={step} />

        <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-8'>
          {error && (
            <div className='mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm'>
              {error}
            </div>
          )}

          {step === 1 && (
            <ClinicInfoStep
              clinicName={clinicName} setClinicName={setClinicName}
              clinicEmail={clinicEmail} setClinicEmail={setClinicEmail}
              adminPassword={adminPassword} setAdminPassword={setAdminPassword}
              clinicPhone={clinicPhone} setClinicPhone={setClinicPhone}
              clinicAddress={clinicAddress} setClinicAddress={setClinicAddress}
              clinicCity={clinicCity} setClinicCity={setClinicCity}
              clinicDescription={clinicDescription} setClinicDescription={setClinicDescription}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <PractitionerStep
              practitionerName={practitionerName} setPractitionerName={setPractitionerName}
              practitionerEmail={practitionerEmail} setPractitionerEmail={setPractitionerEmail}
              practitionerSpecialization={practitionerSpecialization} setPractitionerSpecialization={setPractitionerSpecialization}
              onNext={() => setStep(3)} onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <ServicesStep
              services={services} setServices={setServices}
              onNext={() => setStep(4)} onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <SelectPlanStep
              selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan}
              isLoading={isLoading} onSubmit={handleSubmit} onBack={() => setStep(3)}
            />
          )}
          {step === 5 && <SuccessStep />}
        </div>

        <p className='text-center mt-6 text-sm text-clinic-text/60 dark:text-white/60'>
          Already have an account?{' '}
          <Link href='/clinic/login' className='text-clinic-teal hover:underline'>
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
