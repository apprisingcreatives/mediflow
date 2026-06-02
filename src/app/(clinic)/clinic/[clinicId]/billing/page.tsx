'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CreditCard, Check, Shield, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClinicContext } from '../clinic-context';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 5000,
    yearlyPrice: 50000,
    features: [
      'Up to 500 patients',
      'AI-powered intake forms',
      'Basic appointment scheduling',
      'Email support',
      '1 practitioner',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 10000,
    yearlyPrice: 100000,
    popular: true,
    features: [
      'Up to 2,000 patients',
      'Advanced AI features',
      'Smart scheduling & reminders',
      'Priority support',
      'Analytics dashboard',
      'Up to 5 practitioners',
      'Secure messaging',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 25000,
    yearlyPrice: 250000,
    features: [
      'Unlimited patients',
      'Full AI suite',
      'Custom integrations',
      'Dedicated support',
      'Advanced analytics',
      'Unlimited practitioners',
      'Multi-location support',
      'API access',
    ],
  },
];

export default function BillingPage() {
  const { clinic } = useClinicContext();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    'monthly',
  );

  const currentPlan =
    plans.find((p) => p.id === clinic?.subscription_plan) || plans[0];

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-display font-bold text-clinic-navy dark:text-white'>
            Billing & Subscription
          </h2>
          <p className='text-clinic-text/60 dark:text-white/60'>
            Manage your subscription and payment methods
          </p>
        </div>
        <div className='flex items-center gap-2 text-sm text-clinic-text/60'>
          <Shield className='w-4 h-4 text-clinic-teal' />
          Secure Payments
        </div>
      </div>

      {/* Current Plan */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
        <h3 className='text-lg font-semibold text-clinic-navy dark:text-white mb-4'>
          Current Plan
        </h3>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-2xl font-display font-bold text-clinic-teal'>
              {currentPlan.name}
            </p>
            <p className='text-sm text-clinic-text/60 dark:text-white/60'>
              {clinic?.payment_status === 'trial'
                ? 'Free Trial'
                : `₱${currentPlan.monthlyPrice.toLocaleString()}/month`}
            </p>
          </div>
          <span
            className={cn(
              'px-3 py-1 rounded-full text-sm font-medium',
              clinic?.payment_status === 'trial'
                ? 'bg-blue-100 text-blue-700'
                : clinic?.payment_status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700',
            )}
          >
            {clinic?.payment_status === 'trial'
              ? 'Trial'
              : clinic?.payment_status === 'active'
                ? 'Active'
                : 'Pending'}
          </span>
        </div>
      </div>

      {/* Billing Cycle Toggle */}
      <div className='flex justify-center'>
        <div className='inline-flex items-center gap-2 p-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm'>
          <button
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              billingCycle === 'monthly'
                ? 'bg-clinic-teal text-white'
                : 'text-clinic-text/60 dark:text-white/60 hover:text-clinic-navy dark:hover:text-white',
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              billingCycle === 'yearly'
                ? 'bg-clinic-teal text-white'
                : 'text-clinic-text/60 dark:text-white/60 hover:text-clinic-navy dark:hover:text-white',
            )}
          >
            Yearly
            <span className='ml-1 text-xs text-green-500 font-bold'>
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className='grid md:grid-cols-3 gap-6'>
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              'relative p-6 rounded-2xl transition-all',
              plan.id === clinic?.subscription_plan
                ? 'bg-white dark:bg-slate-800 border-2 border-clinic-teal shadow-glass'
                : 'bg-white dark:bg-slate-800 border-2 border-transparent hover:border-clinic-teal/30 shadow-sm',
            )}
          >
            {plan.popular && (
              <div className='absolute -top-3 left-1/2 -translate-x-1/2'>
                <span className='px-3 py-1 bg-clinic-teal text-white text-xs font-medium rounded-full'>
                  Most Popular
                </span>
              </div>
            )}

            <div className='mb-4'>
              <h3 className='text-lg font-display font-bold text-clinic-navy dark:text-white'>
                {plan.name}
              </h3>
              <div className='mt-2'>
                <span className='text-3xl font-display font-bold text-clinic-navy dark:text-white'>
                  ₱
                  {(billingCycle === 'monthly'
                    ? plan.monthlyPrice
                    : plan.yearlyPrice
                  ).toLocaleString()}
                </span>
                <span className='text-clinic-text/60 dark:text-white/60 text-sm'>
                  /{billingCycle === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
            </div>

            <ul className='space-y-3 mb-6'>
              {plan.features.map((feature) => (
                <li key={feature} className='flex items-start gap-2'>
                  <Check className='w-4 h-4 text-clinic-teal flex-shrink-0 mt-0.5' />
                  <span className='text-sm text-clinic-text/70 dark:text-white/70'>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {plan.id === clinic?.subscription_plan ? (
              <Button disabled className='w-full' variant='outline'>
                Current Plan
              </Button>
            ) : (
              <Button className='w-full bg-clinic-teal hover:bg-clinic-teal/90 text-white'>
                {plan.monthlyPrice > (currentPlan?.monthlyPrice || 0)
                  ? 'Upgrade'
                  : 'Downgrade'}
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Payment Methods */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-clinic-navy dark:text-white'>
            Payment Methods
          </h3>
          <Button variant='outline' size='sm'>
            <CreditCard className='w-4 h-4 mr-2' />
            Add Card
          </Button>
        </div>

        <div className='text-center py-8 text-clinic-text/60 dark:text-white/60'>
          <CreditCard className='w-12 h-12 mx-auto mb-3 opacity-30' />
          <p>No payment methods added yet</p>
          <p className='text-sm'>Add a card to manage your subscription</p>
        </div>
      </div>
    </div>
  );
}
