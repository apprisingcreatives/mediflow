"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepProps } from "../types";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer-not", label: "Prefer not to say" },
];

export function PersonalInfoStep({ formData, updateFormData }: StepProps) {
  return (
    <div className="space-y-6">
      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => updateFormData({ firstName: e.target.value })}
            placeholder="John"
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => updateFormData({ lastName: e.target.value })}
            placeholder="Doe"
            className="h-12"
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData({ email: e.target.value })}
          placeholder="john@example.com"
          className="h-12"
        />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => updateFormData({ phone: e.target.value })}
          placeholder="+63 912 345 6789"
          className="h-12"
        />
      </div>

      {/* DOB & Gender */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth *</Label>
          <Input
            id="dob"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => updateFormData({ dateOfBirth: e.target.value })}
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select
            value={formData.gender}
            onValueChange={(value) => updateFormData({ gender: value })}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Address */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => updateFormData({ address: e.target.value })}
            placeholder="123 Main St"
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => updateFormData({ city: e.target.value })}
            placeholder="Manila"
            className="h-12"
          />
        </div>
      </div>

      {/* Emergency Contact */}
      <div>
        <h3 className="text-sm font-medium text-clinic-navy dark:text-white mb-3">
          Emergency Contact
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyName">Contact Name *</Label>
            <Input
              id="emergencyName"
              value={formData.emergencyContactName}
              onChange={(e) =>
                updateFormData({ emergencyContactName: e.target.value })
              }
              placeholder="Jane Doe"
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyPhone">Contact Phone *</Label>
            <Input
              id="emergencyPhone"
              type="tel"
              value={formData.emergencyContactPhone}
              onChange={(e) =>
                updateFormData({ emergencyContactPhone: e.target.value })
              }
              placeholder="+63 912 345 6789"
              className="h-12"
            />
          </div>
        </div>
      </div>

      {/* Insurance */}
      <div>
        <h3 className="text-sm font-medium text-clinic-navy dark:text-white mb-3">
          Insurance Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="insuranceProvider">Insurance Provider</Label>
            <Input
              id="insuranceProvider"
              value={formData.insuranceProvider}
              onChange={(e) =>
                updateFormData({ insuranceProvider: e.target.value })
              }
              placeholder="PhilHealth"
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="insurancePolicyNumber">Policy Number</Label>
            <Input
              id="insurancePolicyNumber"
              value={formData.insurancePolicyNumber}
              onChange={(e) =>
                updateFormData({ insurancePolicyNumber: e.target.value })
              }
              placeholder="PH-123456789"
              className="h-12"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
