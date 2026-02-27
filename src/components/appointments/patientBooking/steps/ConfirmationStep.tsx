"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar, Check, Shield } from "lucide-react";
import { ConfirmationStepProps } from "../types";
import { formatTime } from "@/components/patient/dashboard";

export function ConfirmationStep({
  formData,
  selectedPractitioner,
  selectedService,
}: ConfirmationStepProps) {
  return (
    <div className="space-y-6">
      {/* Success Animation */}
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-clinic-teal to-emerald-400 flex items-center justify-center">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h2 className="font-display text-2xl font-bold text-clinic-navy dark:text-white mb-2">
          Booking Confirmed!
        </h2>
        <p className="text-clinic-text/60 dark:text-white/60">
          Your appointment has been scheduled successfully.
        </p>
      </div>

      {/* Appointment Summary */}
      <div className="p-6 bg-clinic-bg dark:bg-slate-700/50 rounded-2xl">
        <h3 className="font-semibold text-clinic-navy dark:text-white mb-4">
          Appointment Details
        </h3>
        <div className="space-y-3">
          <SummaryRow
            label="Patient"
            value={`${formData.firstName} ${formData.lastName}`}
          />
          <SummaryRow
            label="Practitioner"
            value={selectedPractitioner?.name || "—"}
          />
          <SummaryRow label="Service" value={selectedService?.name || "—"} />
          <SummaryRow
            label="Date"
            value={
              formData.date
                ? format(new Date(formData.date), "EEEE, MMM d, yyyy")
                : "—"
            }
          />
          <SummaryRow
            label="Time"
            value={formData.time ? formatTime(formData.time) : "—"}
          />
          {selectedService && (
            <div className="flex items-center justify-between pt-2 border-t border-clinic-navy/10 dark:border-white/10">
              <span className="text-clinic-text/60 dark:text-white/60">
                Total
              </span>
              <span className="font-semibold text-clinic-teal">
                {selectedService.currency} {selectedService.price.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Next Steps */}
      <div className="space-y-3">
        <Button className="w-full h-12 bg-clinic-teal hover:bg-clinic-teal/90 text-white">
          <Calendar className="w-5 h-5 mr-2" />
          Add to Calendar
        </Button>
        <Button variant="outline" className="w-full h-12" asChild>
          <Link href="/patient">Go to Dashboard</Link>
        </Button>
      </div>

      {/* Consent & Disclaimer */}
      <div className="p-4 bg-clinic-navy/5 dark:bg-white/5 rounded-xl">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-clinic-teal flex-shrink-0 mt-0.5" />
          <p className="text-xs text-clinic-text/60 dark:text-white/60">
            Your information is protected with end-to-end encryption and stored
            in compliance with HIPAA regulations. A confirmation email has been
            sent to your registered email address.
          </p>
        </div>
      </div>
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
}

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-clinic-text/60 dark:text-white/60">{label}</span>
      <span className="font-medium text-clinic-navy dark:text-white">
        {value}
      </span>
    </div>
  );
}
