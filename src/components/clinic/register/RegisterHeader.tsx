"use client";

import Link from "next/link";
import { Activity, Check } from "lucide-react";

interface RegisterHeaderProps {
  step: number;
}

export function RegisterHeader({ step }: RegisterHeaderProps) {
  return (
    <>
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-clinic-navy to-clinic-teal">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
            MediFlow
          </span>
        </Link>
        <h1 className="font-display text-3xl font-bold text-clinic-navy dark:text-white mb-2">
          Register Your Clinic
        </h1>
        <p className="text-clinic-text/60 dark:text-white/60">
          Get started with MediFlow in just a few steps
        </p>
      </div>

      {step < 5 && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s === step
                    ? "bg-clinic-teal text-white"
                    : s < step
                    ? "bg-clinic-teal/20 text-clinic-teal"
                    : "bg-clinic-navy/10 text-clinic-navy/40 dark:bg-white/10 dark:text-white/40"
                }`}
              >
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-1 mx-1 rounded ${
                    s < step
                      ? "bg-clinic-teal/20"
                      : "bg-clinic-navy/10 dark:bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
