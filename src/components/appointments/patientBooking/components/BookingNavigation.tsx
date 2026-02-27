"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

interface BookingNavigationProps {
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function BookingNavigation({
  currentStep,
  totalSteps,
  isSubmitting,
  onBack,
  onNext,
  onSubmit,
}: BookingNavigationProps) {
  const isLastStep = currentStep === totalSteps - 1; // Step 3 is the last before confirmation
  const isConfirmationStep = currentStep === totalSteps;

  // Don't show navigation on confirmation step
  if (isConfirmationStep) {
    return null;
  }

  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-clinic-navy/5 dark:border-white/5">
      <Button
        variant="ghost"
        onClick={onBack}
        disabled={currentStep === 1 || isSubmitting}
        className="gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      {isLastStep ? (
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="gap-2 bg-clinic-teal hover:bg-clinic-teal/90 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Booking...
            </>
          ) : (
            <>
              Confirm Booking
              <Check className="w-4 h-4" />
            </>
          )}
        </Button>
      ) : (
        <Button
          onClick={onNext}
          className="gap-2 bg-clinic-teal hover:bg-clinic-teal/90 text-white"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
