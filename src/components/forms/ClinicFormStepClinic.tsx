'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClinicFormData } from './ClinicForm';

interface ClinicFormStepClinicProps {
  formData: ClinicFormData;
  onChange: (field: keyof ClinicFormData, value: string | boolean) => void;
}

export function ClinicFormStepClinic({ formData, onChange }: ClinicFormStepClinicProps) {
  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='name' className='text-clinic-navy dark:text-white'>
          Clinic Name <span className='text-red-500'>*</span>
        </Label>
        <Input
          id='name'
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder='Enter clinic name'
          className='border-clinic-navy/10 dark:border-white/10'
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='email' className='text-clinic-navy dark:text-white'>
          Clinic Email <span className='text-red-500'>*</span>
        </Label>
        <Input
          id='email'
          type='email'
          value={formData.email}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder='clinic@example.com'
          className='border-clinic-navy/10 dark:border-white/10'
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='phone' className='text-clinic-navy dark:text-white'>
          Phone
        </Label>
        <Input
          id='phone'
          type='tel'
          value={formData.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder='+63 (912) 345-6789'
          className='border-clinic-navy/10 dark:border-white/10'
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='address' className='text-clinic-navy dark:text-white'>
          Address
        </Label>
        <Input
          id='address'
          value={formData.address}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder='Street address'
          className='border-clinic-navy/10 dark:border-white/10'
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='city' className='text-clinic-navy dark:text-white'>
          City
        </Label>
        <Input
          id='city'
          value={formData.city}
          onChange={(e) => onChange('city', e.target.value)}
          placeholder='City'
          className='border-clinic-navy/10 dark:border-white/10'
        />
      </div>
    </div>
  );
}
