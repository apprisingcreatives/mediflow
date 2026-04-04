'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClinicFormData } from './ClinicForm';

interface ClinicFormStepAdminProps {
  formData: ClinicFormData;
  onChange: (field: keyof ClinicFormData, value: string | boolean) => void;
}

export function ClinicFormStepAdmin({ formData, onChange }: ClinicFormStepAdminProps) {
  return (
    <div className='space-y-4'>
      <p className='text-xs text-clinic-text/60 dark:text-white/60'>
        An invitation will be sent to this email to set up the clinic admin account.
      </p>

      <div className='space-y-2'>
        <Label htmlFor='admin_name' className='text-clinic-navy dark:text-white'>
          Admin Name <span className='text-red-500'>*</span>
        </Label>
        <Input
          id='admin_name'
          value={formData.admin_name}
          onChange={(e) => onChange('admin_name', e.target.value)}
          placeholder='John Doe'
          className='border-clinic-navy/10 dark:border-white/10'
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='admin_email' className='text-clinic-navy dark:text-white'>
          Admin Email <span className='text-red-500'>*</span>
        </Label>
        <Input
          id='admin_email'
          type='email'
          value={formData.admin_email}
          onChange={(e) => onChange('admin_email', e.target.value)}
          placeholder='admin@example.com'
          className='border-clinic-navy/10 dark:border-white/10'
        />
      </div>
    </div>
  );
}
