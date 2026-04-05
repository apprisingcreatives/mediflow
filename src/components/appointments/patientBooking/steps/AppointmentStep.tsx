"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppointmentStepProps } from "../types";
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

  return (
    <div className='space-y-6'>
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
