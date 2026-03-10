'use client';

import { useSearchParams } from 'next/navigation';
import { XCircle, AlertTriangle, Clock, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Suspense } from 'react';

const ERROR_MESSAGES: Record<string, { title: string; message: string; icon: React.ReactNode }> = {
  missing_token: {
    title: 'Invalid Link',
    message: 'The check-in link is missing required information. Please use the link from your email.',
    icon: <HelpCircle className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />,
  },
  not_found: {
    title: 'Appointment Not Found',
    message: 'We could not find this appointment. It may have been cancelled or the link is incorrect.',
    icon: <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />,
  },
  invalid_token: {
    title: 'Invalid Token',
    message: 'The check-in link is invalid or has already been used. Please contact the clinic if you need assistance.',
    icon: <AlertTriangle className="w-10 h-10 text-orange-600 dark:text-orange-400" />,
  },
  expired_token: {
    title: 'Link Expired',
    message: 'This check-in link has expired. Check-in links are valid for 2 hours after your appointment time.',
    icon: <Clock className="w-10 h-10 text-orange-600 dark:text-orange-400" />,
  },
  invalid_status: {
    title: 'Cannot Check In',
    message: 'This appointment cannot be checked in. It may have already been completed, cancelled, or is not yet ready for check-in.',
    icon: <AlertTriangle className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />,
  },
  update_failed: {
    title: 'Check-in Failed',
    message: 'We encountered an error while processing your check-in. Please try again or contact the clinic.',
    icon: <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />,
  },
  server_error: {
    title: 'Server Error',
    message: 'An unexpected error occurred. Please try again later or contact support.',
    icon: <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />,
  },
};

function CheckinErrorContent() {
  const searchParams = useSearchParams();

  const reason = searchParams.get('reason') || 'server_error';
  const status = searchParams.get('status');

  const errorInfo = ERROR_MESSAGES[reason] || ERROR_MESSAGES.server_error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinic-bg to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            {errorInfo.icon}
          </div>
          <CardTitle className="text-2xl font-display text-clinic-navy dark:text-white">
            {errorInfo.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-clinic-text/70 dark:text-white/70">
            {errorInfo.message}
          </p>

          {status && reason === 'invalid_status' && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Current appointment status: <span className="font-semibold capitalize">{status}</span>
              </p>
            </div>
          )}

          <div className="pt-4 space-y-3">
            <Link href="/patient" className="block">
              <Button className="w-full bg-clinic-teal hover:bg-clinic-teal/90">
                Go to Patient Portal
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                Go to Homepage
              </Button>
            </Link>
          </div>

          <p className="text-xs text-center text-clinic-text/50 dark:text-white/50 pt-4">
            If you continue to experience issues, please contact your clinic directly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckinErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-clinic-bg to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
          <div className="animate-pulse text-clinic-teal">Loading...</div>
        </div>
      }
    >
      <CheckinErrorContent />
    </Suspense>
  );
}
