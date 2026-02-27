import { Label } from "@/components/ui/label";
import { AppointmentStepProps } from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ServiceSelectionProps {
  services: AppointmentStepProps["services"];
  selectedServiceId: string;
  onSelect: (id: string) => void;
}

function ServiceSelection({
  services,
  selectedServiceId,
  onSelect,
}: ServiceSelectionProps) {
  if (services.length === 0) {
    return (
      <div className='space-y-2'>
        <Label>Select a Service *</Label>
        <div className='p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800'>
          <p className='text-sm text-amber-700 dark:text-amber-400'>
            No services available for this clinic.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      <Label>Select a Service *</Label>
      <div className='grid gap-3 mt-2'>
        <Select value={selectedServiceId} onValueChange={onSelect}>
          <SelectTrigger>
            <SelectValue placeholder='Select a service' />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name} - ₱{service.price.toLocaleString()} (
                {service.duration_minutes} min)
              </SelectItem>
            ))}
            {services.length === 0 && (
              <div className='p-2 text-sm text-clinic-text/60 text-center'>
                No services available
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default ServiceSelection;
