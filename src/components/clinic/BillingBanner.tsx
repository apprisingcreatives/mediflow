'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, AlertCircle, CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClinicContext } from '@/app/(clinic)/clinic/[clinicId]/clinic-context';

function getDaysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getDaysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

type BannerState = {
  color: 'yellow' | 'orange' | 'red';
  icon: typeof AlertTriangle;
  title: string;
  description: string;
  actionLabel: string;
} | null;

function useBannerState(): BannerState {
  const { clinic, paymentStatus } = useClinicContext();
  if (!clinic) return null;

  const trialDays = getDaysUntil(clinic.trial_end_date);
  const overdueDays = getDaysSince(clinic.next_billing_date);

  if (paymentStatus === 'trial' && trialDays !== null && trialDays <= 3 && trialDays > 0) {
    return {
      color: 'yellow',
      icon: AlertTriangle,
      title: `Your free trial ends in ${trialDays} day${trialDays === 1 ? '' : 's'}`,
      description: 'Subscribe now to keep your clinic running without interruption.',
      actionLabel: 'Subscribe Now',
    };
  }

  if (paymentStatus === 'expired' && clinic.is_trial_active === false && !clinic.is_subscription_active) {
    if (clinic.next_billing_date && overdueDays !== null && overdueDays > 0) {
      return {
        color: 'red',
        icon: AlertCircle,
        title: 'Your subscription has expired',
        description: "You're in read-only mode. Renew to create appointments and manage your clinic.",
        actionLabel: 'Renew Now',
      };
    }
    return {
      color: 'red',
      icon: AlertCircle,
      title: 'Your free trial has ended',
      description: "You're in read-only mode. Subscribe to create appointments and manage your clinic.",
      actionLabel: 'Subscribe Now',
    };
  }

  if (paymentStatus === 'past_due' && overdueDays !== null) {
    return {
      color: 'orange',
      icon: AlertTriangle,
      title: `Your payment is ${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`,
      description: `Pay within ${7 - overdueDays} day${7 - overdueDays === 1 ? '' : 's'} to avoid losing access.`,
      actionLabel: 'Pay Now',
    };
  }

  return null;
}

const COLOR_CLASSES = {
  yellow: {
    bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    title: 'text-amber-700 dark:text-amber-400',
    desc: 'text-amber-600/80 dark:text-amber-400/80',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    title: 'text-orange-700 dark:text-orange-400',
    desc: 'text-orange-600/80 dark:text-orange-400/80',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    title: 'text-red-700 dark:text-red-400',
    desc: 'text-red-600/80 dark:text-red-400/80',
  },
} as const;

export default function BillingBanner() {
  const { clinic, staffRole } = useClinicContext();
  const [dismissed, setDismissed] = useState(false);
  const banner = useBannerState();

  if (!banner || dismissed) return null;

  const classes = COLOR_CLASSES[banner.color];
  const Icon = banner.icon;
  const canPay = staffRole === 'owner' || staffRole === 'admin';
  const isDismissible = banner.color === 'yellow';

  return (
    <div className={`mb-6 p-4 rounded-2xl border ${classes.bg}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Icon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${classes.title}`} />
          <div>
            <h3 className={`font-semibold ${classes.title}`}>{banner.title}</h3>
            <p className={`text-sm mt-1 ${classes.desc}`}>{banner.description}</p>
            {!canPay && (
              <p className={`text-sm mt-1 ${classes.desc}`}>
                Contact your clinic administrator to manage billing.
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canPay && (
            <Link href={`/clinic/${clinic?.id}/billing`}>
              <Button
                className={
                  banner.color === 'red'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : banner.color === 'orange'
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-clinic-teal hover:bg-clinic-teal/90 text-white'
                }
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {banner.actionLabel}
              </Button>
            </Link>
          )}
          {isDismissible && (
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X className="w-4 h-4 text-amber-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
