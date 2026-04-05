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
  return (
    <div className='space-y-2'>
      <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
        Service
      </Label>
      {services.length === 0 ? (
        <div className='p-4 border rounded-lg text-center text-sm text-clinic-text/60'>
          No services available for this clinic.
        </div>
      ) : (
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
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export default ServiceSelection;
