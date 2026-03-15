"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles } from "lucide-react";
import { StepProps, CHRONIC_CONDITIONS } from "../types";

export function MedicalHistoryStep({ formData, updateFormData }: StepProps) {
  const handleConditionToggle = (condition: string, checked: boolean) => {
    if (checked) {
      updateFormData({ conditions: [...formData.conditions, condition] });
    } else {
      updateFormData({
        conditions: formData.conditions.filter((c) => c !== condition),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Helper Card */}
      <div className="p-4 bg-clinic-ai/5 dark:bg-clinic-ai/10 rounded-xl border border-clinic-ai/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-clinic-ai to-clinic-teal flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-clinic-navy dark:text-white mb-1">
              AI-Assisted Intake
            </h4>
            <p className="text-sm text-clinic-text/70 dark:text-white/70">
              Our AI will help prioritize your care based on your responses.
              This information is kept confidential and secure.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Do you have any of the following conditions?</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {CHRONIC_CONDITIONS.map((condition) => (
            <div
              key={condition}
              className="flex items-center space-x-2 p-3 bg-clinic-bg dark:bg-slate-700/50 rounded-lg"
            >
              <Checkbox
                id={condition}
                checked={formData.conditions.includes(condition)}
                onCheckedChange={(checked) =>
                  handleConditionToggle(condition, checked as boolean)
                }
              />
              <Label htmlFor={condition} className="text-sm cursor-pointer">
                {condition}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="medications">Current Medications</Label>
        <Textarea
          id="medications"
          value={formData.medications}
          onChange={(e) => updateFormData({ medications: e.target.value })}
          placeholder="List any medications you're currently taking..."
          className="min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="allergies">Known Allergies</Label>
        <Textarea
          id="allergies"
          value={formData.allergies}
          onChange={(e) => updateFormData({ allergies: e.target.value })}
          placeholder="List any known allergies..."
          className="min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="symptoms">
          What symptoms or concerns bring you in today? *
        </Label>
        <Textarea
          id="symptoms"
          value={formData.symptoms}
          onChange={(e) => updateFormData({ symptoms: e.target.value })}
          placeholder="Please describe your symptoms or reason for visit..."
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
}
