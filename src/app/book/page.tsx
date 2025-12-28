"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Brain,
  Calendar,
  Check,
  Clock,
  Shield,
  Sparkles,
  User,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Medical History", icon: Brain },
  { id: 3, title: "Appointment", icon: Calendar },
  { id: 4, title: "Confirmation", icon: Check },
];

const practitioners = [
  {
    id: 1,
    name: "Dr. Sarah Chen",
    specialty: "Family Medicine",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&q=80",
    nextAvailable: "Tomorrow",
    rating: 4.9,
  },
  {
    id: 2,
    name: "Dr. Michael Rodriguez",
    specialty: "Internal Medicine",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&q=80",
    nextAvailable: "Mar 12",
    rating: 4.8,
  },
  {
    id: 3,
    name: "Dr. Emily Watson",
    specialty: "Family Medicine",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&q=80",
    nextAvailable: "Mar 13",
    rating: 4.9,
  },
];

const timeSlots = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
];

export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    conditions: [] as string[],
    medications: "",
    allergies: "",
    symptoms: "",
    practitioner: "",
    appointmentType: "",
    date: "",
    time: "",
    consent: false,
  });

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="John"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Doe"
                  className="h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john@example.com"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="(123) 456-7890"
                className="h-12"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth *</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
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
                {[
                  "Diabetes",
                  "Hypertension",
                  "Heart Disease",
                  "Asthma",
                  "Arthritis",
                  "None of the above",
                ].map((condition) => (
                  <div
                    key={condition}
                    className="flex items-center space-x-2 p-3 bg-clinic-bg dark:bg-slate-700/50 rounded-lg"
                  >
                    <Checkbox
                      id={condition}
                      checked={formData.conditions.includes(condition)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            conditions: [...formData.conditions, condition],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            conditions: formData.conditions.filter(
                              (c) => c !== condition
                            ),
                          });
                        }
                      }}
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
                onChange={(e) =>
                  setFormData({ ...formData, medications: e.target.value })
                }
                placeholder="List any medications you're currently taking..."
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Known Allergies</Label>
              <Textarea
                id="allergies"
                value={formData.allergies}
                onChange={(e) =>
                  setFormData({ ...formData, allergies: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, symptoms: e.target.value })
                }
                placeholder="Please describe your symptoms or reason for visit..."
                className="min-h-[100px]"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Select Appointment Type</Label>
              <RadioGroup
                value={formData.appointmentType}
                onValueChange={(value) =>
                  setFormData({ ...formData, appointmentType: value })
                }
                className="grid grid-cols-2 gap-4 mt-2"
              >
                <div>
                  <RadioGroupItem
                    value="in-person"
                    id="in-person"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="in-person"
                    className="flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer peer-data-[state=checked]:border-clinic-teal peer-data-[state=checked]:bg-clinic-teal/5 hover:bg-clinic-bg dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <MapPin className="w-6 h-6 mb-2 text-clinic-teal" />
                    <span className="font-medium">In-Person Visit</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="video"
                    id="video"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="video"
                    className="flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer peer-data-[state=checked]:border-clinic-ai peer-data-[state=checked]:bg-clinic-ai/5 hover:bg-clinic-bg dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <Activity className="w-6 h-6 mb-2 text-clinic-ai" />
                    <span className="font-medium">Video Consultation</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Select a Practitioner</Label>
              <div className="grid gap-4 mt-2">
                {practitioners.map((doctor) => (
                  <div
                    key={doctor.id}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        practitioner: doctor.id.toString(),
                      })
                    }
                    className={cn(
                      "flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all",
                      formData.practitioner === doctor.id.toString()
                        ? "border-clinic-teal bg-clinic-teal/5"
                        : "border-transparent bg-clinic-bg dark:bg-slate-700/50 hover:border-clinic-navy/20"
                    )}
                  >
                    <img
                      src={doctor.image}
                      alt={doctor.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-clinic-navy dark:text-white">
                        {doctor.name}
                      </h4>
                      <p className="text-sm text-clinic-text/60 dark:text-white/60">
                        {doctor.specialty}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs">
                        <span className="flex items-center gap-1 text-clinic-teal">
                          <Clock className="w-3.5 h-3.5" />
                          Next: {doctor.nextAvailable}
                        </span>
                        <span className="flex items-center gap-1 text-amber-500">
                          ⭐ {doctor.rating}
                        </span>
                      </div>
                    </div>
                    {formData.practitioner === doctor.id.toString() && (
                      <div className="w-6 h-6 rounded-full bg-clinic-teal flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select Time Slot</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setFormData({ ...formData, time: slot })}
                    className={cn(
                      "py-2 px-3 text-sm rounded-lg border transition-colors",
                      formData.time === slot
                        ? "bg-clinic-teal text-white border-clinic-teal"
                        : "border-clinic-navy/10 dark:border-white/10 hover:border-clinic-teal"
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
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
                <div className="flex items-center justify-between">
                  <span className="text-clinic-text/60 dark:text-white/60">
                    Patient
                  </span>
                  <span className="font-medium text-clinic-navy dark:text-white">
                    {formData.firstName} {formData.lastName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-clinic-text/60 dark:text-white/60">
                    Practitioner
                  </span>
                  <span className="font-medium text-clinic-navy dark:text-white">
                    {practitioners.find(
                      (p) => p.id.toString() === formData.practitioner
                    )?.name || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-clinic-text/60 dark:text-white/60">
                    Type
                  </span>
                  <span className="font-medium text-clinic-navy dark:text-white capitalize">
                    {formData.appointmentType || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-clinic-text/60 dark:text-white/60">
                    Time
                  </span>
                  <span className="font-medium text-clinic-navy dark:text-white">
                    {formData.time || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="space-y-3">
              <Button className="w-full h-12 bg-clinic-teal hover:bg-clinic-teal/90 text-white">
                <Calendar className="w-5 h-5 mr-2" />
                Add to Calendar
              </Button>
              <Button variant="outline" className="w-full h-12" asChild>
                <Link href="/">Return to Home</Link>
              </Button>
            </div>

            {/* Consent & Disclaimer */}
            <div className="p-4 bg-clinic-navy/5 dark:bg-white/5 rounded-xl">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-clinic-teal flex-shrink-0 mt-0.5" />
                <p className="text-xs text-clinic-text/60 dark:text-white/60">
                  Your information is protected with end-to-end encryption and
                  stored in compliance with HIPAA regulations. AI assistance
                  does not replace medical diagnosis.
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-clinic-bg dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-clinic-navy/5 dark:border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-clinic-navy to-clinic-teal">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-clinic-navy dark:text-white">
                MediFlow<span className="text-clinic-teal">AI</span>
              </span>
            </Link>

            <div className="flex items-center gap-2 text-sm text-clinic-text/60 dark:text-white/60">
              <Shield className="w-4 h-4 text-clinic-teal" />
              <span>Secure & HIPAA Compliant</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress Steps */}
          {currentStep < 4 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-center",
                      index < steps.length - 1 && "flex-1"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                        currentStep >= step.id
                          ? "bg-clinic-teal border-clinic-teal text-white"
                          : "border-clinic-navy/20 dark:border-white/20 text-clinic-text/40 dark:text-white/40"
                      )}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          "flex-1 h-0.5 mx-2",
                          currentStep > step.id
                            ? "bg-clinic-teal"
                            : "bg-clinic-navy/10 dark:bg-white/10"
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs">
                {steps.map((step) => (
                  <span
                    key={step.id}
                    className={cn(
                      currentStep >= step.id
                        ? "text-clinic-navy dark:text-white"
                        : "text-clinic-text/40 dark:text-white/40"
                    )}
                  >
                    {step.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-8">
            {currentStep < 4 && (
              <div className="mb-6">
                <h2 className="font-display text-2xl font-bold text-clinic-navy dark:text-white mb-2">
                  {steps[currentStep - 1].title}
                </h2>
                <Progress value={progress} className="h-1" />
              </div>
            )}

            {renderStepContent()}

            {/* Navigation */}
            {currentStep < 4 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-clinic-navy/5 dark:border-white/5">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="gap-2 bg-clinic-teal hover:bg-clinic-teal/90 text-white"
                >
                  {currentStep === 3 ? "Confirm Booking" : "Continue"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
