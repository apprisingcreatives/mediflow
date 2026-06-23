"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppointmentStepProps } from "../types";
import ServiceSelection from "../components/ServiceSelection";
import PractitionerSelection from "../components/PractitionerSelection";
import DateSelection from "../components/DateSelection";
import TimeSlotSelection from "../components/TimeSlotSelection";
import BookingSummary from "../components/BookingSummary";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppointmentStep({
  formData,
  updateFormData,
  practitioners,
  services,
  availableTimeSlots,
  selectedPractitioner,
  selectedService,
  isLoadingPractitioners,
  isLoadingTimeSlots,
  clinicBranches,
}: AppointmentStepProps) {
  const handleServiceSelect = (serviceId: string) => {
    updateFormData({
      selectedServiceId: serviceId,
      time: "",
    });
  };

  const handlePractitionerSelect = (practitionerId: string) => {
    updateFormData({
      selectedPractitionerId: practitionerId,
      date: "",
      time: "",
    });
  };

  const handleDateChange = (date: string) => {
    updateFormData({
      date,
      time: "",
    });
  };

  const showBranchSelector = clinicBranches && clinicBranches.length > 1;

  const handleBranchSelect = (branchId: string) => {
    updateFormData({
      selectedBranchId: branchId,
      selectedPractitionerId: "",
      date: "",
      time: "",
    });
  };

  return (
    <div className='space-y-6'>
      {/* Branch Selector — only for multi-branch clinics */}
      {showBranchSelector && (
        <div className='space-y-3'>
          <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
            Select Location
          </Label>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            {clinicBranches.map((branch) => (
              <button
                key={branch.id}
                type='button'
                onClick={() => handleBranchSelect(branch.id)}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                  formData.selectedBranchId === branch.id
                    ? 'border-clinic-teal bg-clinic-teal/5'
                    : 'border-gray-200 dark:border-slate-600 hover:border-clinic-teal/40',
                )}
              >
                <MapPin className={cn(
                  'w-5 h-5 mt-0.5 flex-shrink-0',
                  formData.selectedBranchId === branch.id ? 'text-clinic-teal' : 'text-clinic-text/40',
                )} />
                <div>
                  <p className='font-medium text-clinic-navy dark:text-white text-sm'>
                    {branch.name}
                  </p>
                  {(branch.address || branch.city) && (
                    <p className='text-xs text-clinic-text/50 dark:text-white/50 mt-0.5'>
                      {[branch.address, branch.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <PractitionerSelection
        practitioners={practitioners}
        selectedPractitionerId={formData.selectedPractitionerId}
        isLoading={isLoadingPractitioners}
        onSelect={handlePractitionerSelect}
      />

      <ServiceSelection
        services={services}
        selectedServiceId={formData.selectedServiceId}
        onSelect={handleServiceSelect}
      />

      <DateSelection
        date={formData.date}
        isDisabled={!formData.selectedPractitionerId || !formData.selectedServiceId}
        onChange={handleDateChange}
      />

      <TimeSlotSelection
        timeSlots={availableTimeSlots}
        selectedTime={formData.time}
        isLoading={isLoadingTimeSlots}
        hasRequiredSelections={
          !!formData.selectedPractitionerId && !!formData.selectedServiceId
        }
        hasDate={!!formData.date}
        onSelect={(time) => updateFormData({ time })}
      />

      {/* Notes */}
      <div className='space-y-2'>
        <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
          Notes (Optional)
        </Label>
        <Textarea
          value={formData.symptoms}
          onChange={(e) => updateFormData({ symptoms: e.target.value })}
          placeholder='Add any notes or special instructions...'
          rows={3}
        />
      </div>

      {(selectedService || selectedPractitioner) && (
        <BookingSummary
          selectedService={selectedService}
          selectedPractitioner={selectedPractitioner}
          date={formData.date}
          time={formData.time}
        />
      )}
    </div>
  );
}
