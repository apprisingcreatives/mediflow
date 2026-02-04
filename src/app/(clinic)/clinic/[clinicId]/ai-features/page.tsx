'use client';

import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Lock,
  Crown,
} from 'lucide-react';
import { useClinicContext } from '../layout';

export default function AIFeaturesPage() {
  const { clinicFeatures, featuresLoading, isTrialExpired } =
    useClinicContext();

  const enabledFeatures = clinicFeatures.filter((f) => f.is_enabled);
  const disabledFeatures = clinicFeatures.filter((f) => !f.is_enabled);

  if (isTrialExpired) {
    return (
      <div className='text-center py-12'>
        <p className='text-clinic-text/60'>
          This feature is locked. Please upgrade your plan.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-display font-bold text-clinic-navy dark:text-white'>
          AI Features
        </h2>
        <p className='text-clinic-text/60 dark:text-white/60'>
          View and manage AI-powered features for your clinic
        </p>
      </div>

      {/* Live Indicator */}
      <div className='flex items-center gap-2'>
        <span className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></span>
        <span className='text-sm text-green-600 dark:text-green-400'>
          Real-time updates enabled
        </span>
      </div>

      {featuresLoading ? (
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className='h-40 bg-clinic-navy/5 dark:bg-white/5 rounded-2xl animate-pulse'
            />
          ))}
        </div>
      ) : (
        <>
          {/* Enabled Features */}
          <div className='space-y-4'>
            <h3 className='flex items-center gap-2 text-lg font-semibold text-clinic-navy dark:text-white'>
              <CheckCircle className='w-5 h-5 text-green-500' />
              Enabled Features ({enabledFeatures.length})
            </h3>
            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {enabledFeatures.map((feature) => (
                <div
                  key={feature.id}
                  className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6'
                >
                  <div className='flex items-start justify-between mb-3'>
                    <div className='w-10 h-10 rounded-xl bg-green-100 dark:bg-green-800/50 flex items-center justify-center'>
                      <Sparkles className='w-5 h-5 text-green-600 dark:text-green-400' />
                    </div>
                    {feature.feature?.is_premium && (
                      <span className='flex items-center gap-1 text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full'>
                        <Crown className='w-3 h-3' />
                        Premium
                      </span>
                    )}
                  </div>
                  <h4 className='font-semibold text-green-800 dark:text-green-300'>
                    {feature.feature?.name}
                  </h4>
                  <p className='text-sm text-green-600/80 dark:text-green-400/80 mt-1'>
                    Ready to use
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Disabled Features */}
          {disabledFeatures.length > 0 && (
            <div className='space-y-4'>
              <h3 className='flex items-center gap-2 text-lg font-semibold text-clinic-navy dark:text-white'>
                <Lock className='w-5 h-5 text-gray-400' />
                Not Enabled ({disabledFeatures.length})
              </h3>
              <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {disabledFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    className='bg-clinic-navy/5 dark:bg-white/5 border border-clinic-navy/10 dark:border-white/10 rounded-2xl p-6'
                  >
                    <div className='flex items-start justify-between mb-3'>
                      <div className='w-10 h-10 rounded-xl bg-clinic-navy/10 dark:bg-white/10 flex items-center justify-center'>
                        <Sparkles className='w-5 h-5 text-clinic-text/40 dark:text-white/40' />
                      </div>
                      {feature.feature?.is_premium && (
                        <span className='flex items-center gap-1 text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full'>
                          <Crown className='w-3 h-3' />
                          Premium
                        </span>
                      )}
                    </div>
                    <h4 className='font-semibold text-clinic-navy/70 dark:text-white/70'>
                      {feature.feature?.name}
                    </h4>
                    <p className='text-sm text-clinic-text/50 dark:text-white/50 mt-1'>
                      {feature.feature?.is_premium
                        ? 'Upgrade to enable'
                        : 'Contact support to enable'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
