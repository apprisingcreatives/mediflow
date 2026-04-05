'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Building2, ArrowRight } from 'lucide-react';

interface ClinicInfoStepProps {
  clinicName: string;
  setClinicName: (value: string) => void;
  clinicEmail: string;
  setClinicEmail: (value: string) => void;
  clinicPhone: string;
  setClinicPhone: (value: string) => void;
  clinicAddress: string;
  setClinicAddress: (value: string) => void;
  clinicCity: string;
  setClinicCity: (value: string) => void;
  clinicDescription: string;
  setClinicDescription: (value: string) => void;
  onNext: () => void;
}

export function ClinicInfoStep({
  clinicName,
  setClinicName,
  clinicEmail,
  setClinicEmail,
  clinicPhone,
  setClinicPhone,
  clinicAddress,
  setClinicAddress,
  clinicCity,
  setClinicCity,
  clinicDescription,
  setClinicDescription,
  onNext,
}: ClinicInfoStepProps) {
  return (
    <div className='space-y-6 w-full  max-w-2xl mx-auto'>
      <div className='flex items-center gap-2 mb-4 '>
        <Building2 className='w-5 h-5 text-clinic-teal' />
        <h2 className='font-display text-xl font-bold text-clinic-navy dark:text-white'>
          Clinic Information
        </h2>
      </div>

      <div className='grid sm:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label className='text-clinic-navy dark:text-white'>
            Clinic Name *
          </Label>
          <Input
            placeholder='Manila Medical Center'
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            className='h-12'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-clinic-navy dark:text-white'>Email *</Label>
          <Input
            type='email'
            placeholder='contact@clinic.com'
            value={clinicEmail}
            onChange={(e) => setClinicEmail(e.target.value)}
            className='h-12'
          />
        </div>
      </div>

      <div className='grid sm:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label className='text-clinic-navy dark:text-white'>Phone</Label>
          <Input
            placeholder='+63 2 8123 4567'
            value={clinicPhone}
            onChange={(e) => setClinicPhone(e.target.value)}
            className='h-12'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-clinic-navy dark:text-white'>City</Label>
          <Input
            placeholder='Manila'
            value={clinicCity}
            onChange={(e) => setClinicCity(e.target.value)}
            className='h-12'
          />
        </div>
      </div>

      <div className='space-y-2'>
        <Label className='text-clinic-navy dark:text-white'>Address</Label>
        <Input
          placeholder='123 Rizal Avenue'
          value={clinicAddress}
          onChange={(e) => setClinicAddress(e.target.value)}
          className='h-12'
        />
      </div>

      <div className='space-y-2'>
        <Label className='text-clinic-navy dark:text-white'>Description</Label>
        <Textarea
          placeholder='Tell us about your clinic...'
          value={clinicDescription}
          onChange={(e) => setClinicDescription(e.target.value)}
          rows={3}
        />
      </div>

      <Button
        onClick={onNext}
        disabled={!clinicName || !clinicEmail}
        className='w-full h-12 bg-clinic-teal hover:bg-clinic-teal/90 text-white'
      >
        Continue
        <ArrowRight className='w-4 h-4 ml-2' />
      </Button>
    </div>
  );
}
