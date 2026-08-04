"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, ArrowLeft, ArrowRight } from "lucide-react";

interface PractitionerStepProps {
  practitionerName: string;
  setPractitionerName: (value: string) => void;
  practitionerEmail: string;
  setPractitionerEmail: (value: string) => void;
  practitionerSpecialization: string;
  setPractitionerSpecialization: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const SPECIALIZATIONS = [
  "General Practice",
  "Dentist",
  "Pediatrics",
  "Cardiology",
  "Dermatology",
  "Ophthalmology",
  "Orthopedics",
  "OB-GYN",
  "ENT",
  "Psychiatry",
];

export function PractitionerStep({
  practitionerName,
  setPractitionerName,
  practitionerEmail,
  setPractitionerEmail,
  practitionerSpecialization,
  setPractitionerSpecialization,
  onNext,
  onBack,
}: PractitionerStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-clinic-teal" />
        <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white">
          Add Practitioner
        </h2>
      </div>

      <div className="space-y-2">
        <Label className="text-clinic-navy dark:text-white">
          Practitioner Name *
        </Label>
        <Input
          placeholder="Dr. Jane Doe"
          value={practitionerName}
          onChange={(e) => setPractitionerName(e.target.value)}
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-clinic-navy dark:text-white">
          Practitioner Email *
        </Label>
        <Input
          type="email"
          placeholder="practitioner@clinic.com"
          value={practitionerEmail}
          onChange={(e) => setPractitionerEmail(e.target.value)}
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-clinic-navy dark:text-white">
          Specialization *
        </Label>
        <Select
          value={practitionerSpecialization}
          onValueChange={setPractitionerSpecialization}
        >
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select Specialization" />
          </SelectTrigger>
          <SelectContent>
            {SPECIALIZATIONS.map((spec) => (
              <SelectItem key={spec} value={spec}>
                {spec}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          disabled={!practitionerName || !practitionerEmail || !practitionerSpecialization}
          className="flex-1 h-12 bg-clinic-teal hover:bg-clinic-teal/90 text-white"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
