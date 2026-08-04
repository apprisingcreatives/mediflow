'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface LimitReachedBannerProps {
  resource: string;
  current: number;
  max: number;
  plan: string;
  upgradeTo?: string;
  clinicId: string;
}

export default function LimitReachedBanner({
  resource,
  current,
  max,
  plan,
  upgradeTo,
  clinicId,
}: LimitReachedBannerProps) {
  const atLimit = current >= max;
  if (!atLimit) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <div className="flex-1">
        <span className="font-medium capitalize">{resource}</span> limit reached ({current}/{max}) on your{' '}
        <span className="font-medium capitalize">{plan}</span> plan.
        {upgradeTo && (
          <>
            {' '}
            <Link
              href={`/clinic/${clinicId}/billing`}
              className="font-medium text-amber-900 underline hover:text-amber-700"
            >
              Upgrade to {upgradeTo}
            </Link>{' '}
            for higher limits.
          </>
        )}
      </div>
    </div>
  );
}
