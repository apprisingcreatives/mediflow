'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClinicFormData } from './ClinicForm';

interface ClinicFormStepPlanProps {
  formData: ClinicFormData;
  isEditMode: boolean;
  onChange: (field: keyof ClinicFormData, value: string | boolean) => void;
}

export function ClinicFormStepPlan({ formData, isEditMode, onChange }: ClinicFormStepPlanProps) {
  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='subscription_plan' className='text-clinic-navy dark:text-white'>
          Subscription Plan
        </Label>
        <Select
          value={formData.subscription_plan}
          onValueChange={(value) => onChange('subscription_plan', value)}
        >
          <SelectTrigger className='border-clinic-navy/10 dark:border-white/10'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='starter'>Starter</SelectItem>
            <SelectItem value='professional'>Professional</SelectItem>
            <SelectItem value='enterprise'>Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='is_active' className='text-clinic-navy dark:text-white'>
          Status
        </Label>
        <Select
          value={formData.is_active ? 'active' : 'inactive'}
          onValueChange={(value) => onChange('is_active', value === 'active')}
        >
          <SelectTrigger className='border-clinic-navy/10 dark:border-white/10'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='active'>Active</SelectItem>
            <SelectItem value='inactive'>Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className='p-4 bg-clinic-navy/5 dark:bg-white/5 rounded-xl space-y-2'>
        <p className='text-xs font-medium text-clinic-text/40 dark:text-white/40 uppercase tracking-wider'>
          Summary
        </p>
        <div className='grid grid-cols-2 gap-x-4 gap-y-1 text-sm'>
          <span className='text-clinic-text/60 dark:text-white/60'>Clinic</span>
          <span className='text-clinic-navy dark:text-white font-medium'>{formData.name}</span>
          <span className='text-clinic-text/60 dark:text-white/60'>Email</span>
          <span className='text-clinic-navy dark:text-white font-medium'>{formData.email}</span>
          {!isEditMode && formData.admin_name && (
            <>
              <span className='text-clinic-text/60 dark:text-white/60'>Admin</span>
              <span className='text-clinic-navy dark:text-white font-medium'>
                {formData.admin_name}
              </span>
            </>
          )}
          <span className='text-clinic-text/60 dark:text-white/60'>Plan</span>
          <span className='text-clinic-navy dark:text-white font-medium capitalize'>
            {formData.subscription_plan}
          </span>
        </div>
      </div>
    </div>
  );
}
