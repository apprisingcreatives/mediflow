"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Plus, Trash2, ArrowLeft, ArrowRight } from "lucide-react";

export interface Service {
  name: string;
  description: string;
  duration: string;
  price: string;
}

interface ServicesStepProps {
  services: Service[];
  setServices: (services: Service[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ServicesStep({
  services,
  setServices,
  onNext,
  onBack,
}: ServicesStepProps) {
  const addService = () => {
    setServices([
      ...services,
      { name: "", description: "", duration: "30", price: "" },
    ]);
  };

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index));
    }
  };

  const updateService = (index: number, field: keyof Service, value: string) => {
    const updated = [...services];
    updated[index][field] = value;
    setServices(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-clinic-teal" />
          <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white">
            Services & Pricing
          </h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addService}
          className="text-clinic-teal"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Service
        </Button>
      </div>

      <div className="space-y-4">
        {services.map((service, index) => (
          <div
            key={index}
            className="p-4 border border-clinic-navy/10 dark:border-white/10 rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-clinic-navy dark:text-white">
                Service {index + 1}
              </span>
              {services.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeService(index)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Service Name</Label>
                <Input
                  placeholder="General Consultation"
                  value={service.name}
                  onChange={(e) => updateService(index, "name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Price (₱)</Label>
                <Input
                  type="number"
                  placeholder="500"
                  value={service.price}
                  onChange={(e) => updateService(index, "price", e.target.value)}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label className="text-xs">Duration (minutes)</Label>
                <Input
                  type="number"
                  placeholder="30"
                  value={service.duration}
                  onChange={(e) =>
                    updateService(index, "duration", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Description</Label>
                <Input
                  placeholder="Brief description"
                  value={service.description}
                  onChange={(e) =>
                    updateService(index, "description", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 h-12"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 h-12 bg-clinic-teal hover:bg-clinic-teal/90 text-white"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
