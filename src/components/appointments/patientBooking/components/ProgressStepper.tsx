"use client";

import { User, Brain, Calendar, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { BOOKING_STEPS } from "../types";

const STEP_ICONS = {
  personal: User,
  medical: Brain,
  appointment: Calendar,
  confirmation: Check,
} as const;

interface ProgressStepperProps {
  currentStep: number;
}

export function ProgressStepper({ currentStep }: ProgressStepperProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {BOOKING_STEPS.map((step, index) => {
          const Icon = STEP_ICONS[step.key];
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep >= step.id;

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center",
                index < BOOKING_STEPS.length - 1 && "flex-1"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                  isCurrent
                    ? "bg-clinic-teal border-clinic-teal text-white"
                    : "border-clinic-navy/20 dark:border-white/20 text-clinic-text/40 dark:text-white/40"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              {index < BOOKING_STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2",
                    isCompleted
                      ? "bg-clinic-teal"
                      : "bg-clinic-navy/10 dark:bg-white/10"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs">
        {BOOKING_STEPS.map((step) => (
          <span
            key={step.id}
            className={cn(
              currentStep >= step.id
                ? "text-clinic-navy dark:text-white"
                : "text-clinic-text/40 dark:text-white/40"
            )}
          >
            {step.title}
          </span>
        ))}
      </div>
    </div>
  );
}
