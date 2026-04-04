'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepDefinition {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ClinicFormStepperProps {
  steps: StepDefinition[];
  currentStep: number;
}

export function ClinicFormStepper({ steps, currentStep }: ClinicFormStepperProps) {
  return (
    <div className='flex items-center justify-between mb-2'>
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div key={step.id} className='flex items-center flex-1'>
            <div className='flex flex-col items-center flex-1'>
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
                  isCompleted
                    ? 'bg-clinic-teal text-white'
                    : isActive
                      ? 'bg-clinic-teal/10 text-clinic-teal border-2 border-clinic-teal'
                      : 'bg-clinic-navy/5 dark:bg-white/5 text-clinic-text/40 dark:text-white/40'
                )}
              >
                {isCompleted ? <Check className='w-4 h-4' /> : <Icon className='w-4 h-4' />}
              </div>
              <span
                className={cn(
                  'text-[10px] mt-1 font-medium',
                  isActive
                    ? 'text-clinic-teal'
                    : isCompleted
                      ? 'text-clinic-navy dark:text-white'
                      : 'text-clinic-text/40 dark:text-white/40'
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 -mt-4 mx-1',
                  index < currentStep ? 'bg-clinic-teal' : 'bg-clinic-navy/10 dark:bg-white/10'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
