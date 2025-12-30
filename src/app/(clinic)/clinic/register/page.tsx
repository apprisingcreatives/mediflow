"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Activity,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  User,
  Lock,
} from "lucide-react";

interface Service {
  name: string;
  description: string;
  duration: string;
  price: string;
}

export default function ClinicRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Clinic Info
  const [clinicName, setClinicName] = useState("");
  const [clinicEmail, setClinicEmail] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicCity, setClinicCity] = useState("");
  const [clinicDescription, setClinicDescription] = useState("");

  // Admin Info
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Services
  const [services, setServices] = useState<Service[]>([
    { name: "", description: "", duration: "30", price: "" },
  ]);

  // Plan
  const [selectedPlan, setSelectedPlan] = useState("starter");

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

  const updateService = (
    index: number,
    field: keyof Service,
    value: string
  ) => {
    const updated = [...services];
    updated[index][field] = value;
    setServices(updated);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/clinic/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic: {
            name: clinicName,
            email: clinicEmail,
            phone: clinicPhone,
            address: clinicAddress,
            city: clinicCity,
            description: clinicDescription,
            subscription_plan: selectedPlan,
          },
          admin: {
            name: adminName,
            email: adminEmail,
            password: adminPassword,
          },
          services: services.filter((s) => s.name && s.price),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      setStep(5); // Success step
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: "₱5,000",
      features: [
        "Up to 500 patients",
        "AI intake forms",
        "Basic scheduling",
        "Email support",
      ],
    },
    {
      id: "professional",
      name: "Professional",
      price: "₱10,000",
      features: [
        "Up to 2,000 patients",
        "Advanced AI features",
        "Smart scheduling",
        "Priority support",
        "Analytics dashboard",
      ],
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen bg-clinic-bg dark:bg-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-clinic-navy to-clinic-teal">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
              MediFlow
            </span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-clinic-navy dark:text-white mb-2">
            Register Your Clinic
          </h1>
          <p className="text-clinic-text/60 dark:text-white/60">
            Get started with MediFlow in just a few steps
          </p>
        </div>

        {/* Progress */}
        {step < 5 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    s === step
                      ? "bg-clinic-teal text-white"
                      : s < step
                      ? "bg-clinic-teal/20 text-clinic-teal"
                      : "bg-clinic-navy/10 text-clinic-navy/40 dark:bg-white/10 dark:text-white/40"
                  }`}
                >
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-12 h-1 mx-1 rounded ${
                      s < step
                        ? "bg-clinic-teal/20"
                        : "bg-clinic-navy/10 dark:bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Clinic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-clinic-teal" />
                <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white">
                  Clinic Information
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-clinic-navy dark:text-white">
                    Clinic Name *
                  </Label>
                  <Input
                    placeholder="Manila Medical Center"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-clinic-navy dark:text-white">
                    Email *
                  </Label>
                  <Input
                    type="email"
                    placeholder="contact@clinic.com"
                    value={clinicEmail}
                    onChange={(e) => setClinicEmail(e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-clinic-navy dark:text-white">
                    Phone
                  </Label>
                  <Input
                    placeholder="+63 2 8123 4567"
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-clinic-navy dark:text-white">
                    City
                  </Label>
                  <Input
                    placeholder="Manila"
                    value={clinicCity}
                    onChange={(e) => setClinicCity(e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-clinic-navy dark:text-white">
                  Address
                </Label>
                <Input
                  placeholder="123 Rizal Avenue"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-clinic-navy dark:text-white">
                  Description
                </Label>
                <Textarea
                  placeholder="Tell us about your clinic..."
                  value={clinicDescription}
                  onChange={(e) => setClinicDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!clinicName || !clinicEmail}
                className="w-full h-12 bg-clinic-teal hover:bg-clinic-teal/90 text-white"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Admin Account */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-clinic-teal" />
                <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white">
                  Admin Account
                </h2>
              </div>

              <div className="space-y-2">
                <Label className="text-clinic-navy dark:text-white">
                  Admin Name *
                </Label>
                <Input
                  placeholder="Dr. Juan Dela Cruz"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-clinic-navy dark:text-white">
                  Admin Email *
                </Label>
                <Input
                  type="email"
                  placeholder="admin@clinic.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-clinic-navy dark:text-white">
                  Password *
                </Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!adminName || !adminEmail || !adminPassword}
                  className="flex-1 h-12 bg-clinic-teal hover:bg-clinic-teal/90 text-white"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Services */}
          {step === 3 && (
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
                          onChange={(e) =>
                            updateService(index, "name", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Price (₱)</Label>
                        <Input
                          type="number"
                          placeholder="500"
                          value={service.price}
                          onChange={(e) =>
                            updateService(index, "price", e.target.value)
                          }
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
                  onClick={() => setStep(2)}
                  className="flex-1 h-12"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  className="flex-1 h-12 bg-clinic-teal hover:bg-clinic-teal/90 text-white"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Select Plan */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-clinic-teal" />
                <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white">
                  Select Your Plan
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? "border-clinic-teal bg-clinic-teal/5"
                        : "border-clinic-navy/10 dark:border-white/10 hover:border-clinic-teal/50"
                    }`}
                  >
                    {plan.popular && (
                      <span className="text-xs font-medium text-clinic-teal mb-2 block">
                        Most Popular
                      </span>
                    )}
                    <h3 className="font-display text-lg font-bold text-clinic-navy dark:text-white">
                      {plan.name}
                    </h3>
                    <p className="text-2xl font-bold text-clinic-teal mt-1">
                      {plan.price}
                      <span className="text-sm font-normal text-clinic-text/60 dark:text-white/60">
                        /month
                      </span>
                    </p>
                    <ul className="mt-4 space-y-2">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-sm text-clinic-text/70 dark:text-white/70"
                        >
                          <Check className="w-4 h-4 text-clinic-teal" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="flex-1 h-12"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 h-12 bg-clinic-teal hover:bg-clinic-teal/90 text-white"
                >
                  {isLoading ? "Registering..." : "Complete Registration"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 5 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-clinic-teal/10 flex items-center justify-center">
                <Check className="w-10 h-10 text-clinic-teal" />
              </div>
              <h2 className="font-display text-2xl font-bold text-clinic-navy dark:text-white mb-4">
                Registration Complete!
              </h2>
              <p className="text-clinic-text/70 dark:text-white/70 mb-8">
                Your clinic has been registered successfully. You can now log in
                to your clinic dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
                  asChild
                >
                  <Link href="/clinic/login">Go to Login</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Return to Home</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-clinic-text/60 dark:text-white/60">
          Already have an account?{" "}
          <Link href="/clinic/login" className="text-clinic-teal hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
