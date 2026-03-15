"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, LogIn } from "lucide-react";

interface LoginPromptProps {
  redirectUrl: string;
}

export function LoginPrompt({ redirectUrl }: LoginPromptProps) {
  return (
    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-amber-800 dark:text-amber-300 text-sm">
            Sign in for faster booking
          </p>
          <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
            Your information will be pre-filled from your profile. You'll need
            to sign in to complete the booking.
          </p>
          <Link href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}>
            <Button
              size="sm"
              className="mt-3 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
