"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, LogIn, Shield, User } from "lucide-react";
import { Patient } from "@/types/database";

interface BookingHeaderProps {
  user: { id: string } | null;
  patient: Patient | null;
  redirectUrl: string;
}

export function BookingHeader({ user, patient, redirectUrl }: BookingHeaderProps) {
  return (
    <header className="bg-white dark:bg-slate-800 border-b border-clinic-navy/5 dark:border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-clinic-navy to-clinic-teal">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-clinic-navy dark:text-white">
              MediFlow
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-clinic-teal" />
                <span className="text-clinic-navy dark:text-white font-medium">
                  {patient?.first_name} {patient?.last_name}
                </span>
              </div>
            ) : (
              <Link href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}>
                <Button variant="outline" size="sm">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
            <div className="flex items-center gap-2 text-sm text-clinic-text/60 dark:text-white/60">
              <Shield className="w-4 h-4 text-clinic-teal" />
              <span className="hidden sm:inline">Secure & HIPAA Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
