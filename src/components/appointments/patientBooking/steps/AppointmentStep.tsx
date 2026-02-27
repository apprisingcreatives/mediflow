"use client";

import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Clock, Loader2, Stethoscope, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppointmentStepProps } from "../types";
import { formatTime } from "@/components/patient/dashboard";
import ServiceSelection from "../components/ServiceSelection";
import PractitionerSelection from "../components/PractitionerSelection";
import DateSelection from "../components/DateSelection";
import TimeSlotSelection from "../components/TimeSlotSelection";
import BookingSummary from "../components/BookingSummary";

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
}: AppointmentStepProps) {
  const handleServiceSelect = (serviceId: string) => {
    updateFormData({
      selectedServiceId: serviceId,
      time: "", // Clear time when service changes
    });
  };

  const handlePractitionerSelect = (practitionerId: string) => {
    updateFormData({
      selectedPractitionerId: practitionerId,
      date: "", // Clear date and time when practitioner changes
      time: "",
    });
  };

  const handleDateChange = (date: string) => {
    updateFormData({
      date,
      time: "",
    });
  };

  return (
    <div className='space-y-6'>
      <ServiceSelection
        services={services}
        selectedServiceId={formData.selectedServiceId}
        onSelect={handleServiceSelect}
      />

      <PractitionerSelection
        practitioners={practitioners}
        selectedPractitionerId={formData.selectedPractitionerId}
        isLoading={isLoadingPractitioners}
        onSelect={handlePractitionerSelect}
      />

      <DateSelection
        date={formData.date}
        isDisabled={!formData.selectedPractitionerId}
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
