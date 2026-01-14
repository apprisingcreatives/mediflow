"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity,
  Building2,
  MapPin,
  Users,
  Stethoscope,
  ArrowLeft,
  Search,
  BadgeCheck,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PatientChatbot } from "@/components/chatbot/patient-chatbot";

interface Clinic {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  logo_url: string | null;
  description: string | null;
  subscription_plan: string;
  clinic_services: { id: string; name: string; price: number }[];
  practitioners: { id: string; name: string; specialization: string }[];
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const fallbackClinics: Clinic[] = [
  {
    id: "demo-clinic-1",
    name: "Downtown Medical Center",
    email: "contact@downtownmed.com",
    phone: "(555) 123-4567",
    address: "123 Main Street",
    city: "San Francisco",
    logo_url: null,
    description:
      "A comprehensive healthcare facility offering primary care, specialist consultations, and advanced diagnostic services.",
    subscription_plan: "professional",
    clinic_services: [
      { id: "s1", name: "General Checkup", price: 150 },
      { id: "s2", name: "Cardiology", price: 250 },
      { id: "s3", name: "Pediatrics", price: 125 },
    ],
    practitioners: [
      {
        id: "p1",
        name: "Dr. Sarah Johnson",
        specialization: "Internal Medicine",
      },
      { id: "p2", name: "Dr. Michael Chen", specialization: "Cardiology" },
    ],
  },
  {
    id: "demo-clinic-2",
    name: "Wellness Family Clinic",
    email: "info@wellnessfamily.com",
    phone: "(555) 987-6543",
    address: "456 Oak Avenue",
    city: "Los Angeles",
    logo_url: null,
    description:
      "Family-oriented healthcare with a focus on preventive medicine and holistic wellness approaches.",
    subscription_plan: "basic",
    clinic_services: [
      { id: "s4", name: "Family Medicine", price: 120 },
      { id: "s5", name: "Vaccinations", price: 50 },
    ],
    practitioners: [
      { id: "p3", name: "Dr. Emily Davis", specialization: "Family Medicine" },
    ],
  },
  {
    id: "demo-clinic-3",
    name: "Advanced Specialty Care",
    email: "care@advancedspecialty.com",
    phone: "(555) 456-7890",
    address: "789 Medical Plaza",
    city: "New York",
    logo_url: null,
    description:
      "State-of-the-art specialty care featuring cutting-edge technology and expert specialists.",
    subscription_plan: "professional",
    clinic_services: [
      { id: "s6", name: "Neurology", price: 300 },
      { id: "s7", name: "Orthopedics", price: 275 },
      { id: "s8", name: "Dermatology", price: 175 },
      { id: "s9", name: "Oncology", price: 350 },
    ],
    practitioners: [
      { id: "p4", name: "Dr. James Wilson", specialization: "Neurology" },
      { id: "p5", name: "Dr. Lisa Park", specialization: "Orthopedics" },
      { id: "p6", name: "Dr. Robert Brown", specialization: "Oncology" },
    ],
  },
];

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>(fallbackClinics);
  const [filteredClinics, setFilteredClinics] =
    useState<Clinic[]>(fallbackClinics);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  useEffect(() => {
    fetchClinics();
  }, []);

  useEffect(() => {
    let result = clinics;

    if (searchQuery) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCity) {
      result = result.filter((c) => c.city === selectedCity);
    }

    setFilteredClinics(result);
  }, [clinics, searchQuery, selectedCity]);

  const fetchClinics = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch("/api/clinics", {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (data.clinics && data.clinics.length > 0) {
        setClinics(data.clinics);
        setFilteredClinics(data.clinics);
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Failed to fetch clinics:", error);
      }
      // Keep using fallback clinics on error
    } finally {
      setIsLoading(false);
    }
  };

  const cities = Array.from(
    new Set(clinics.map((c) => c.city).filter(Boolean))
  );

  return (
    <div className="min-h-screen bg-clinic-bg dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-clinic-navy/5 dark:border-white/5 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-clinic-navy to-clinic-teal">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-clinic-navy dark:text-white">
                MediFlow
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                asChild
                className="text-clinic-text/60 hover:text-clinic-navy"
              >
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <Button
                className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
                asChild
              >
                <Link href="/clinic/register">Register Your Clinic</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-clinic-navy via-clinic-navy/95 to-clinic-navy py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
            <Building2 className="w-4 h-4 text-clinic-teal" />
            <span className="text-sm font-medium text-white/80">
              Partner Network
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Find Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-clinic-teal to-clinic-ai">
              Healthcare Partner
            </span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
            Discover our network of AI-powered clinics committed to providing
            exceptional healthcare services.
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-clinic-text/40" />
              <Input
                placeholder="Search clinics by name, city, or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg bg-white border-0 shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Results */}
      <main className="container mx-auto px-4 py-12">
        {/* City Filters */}
        {cities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setSelectedCity(null)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                !selectedCity
                  ? "bg-clinic-teal text-white"
                  : "bg-white dark:bg-slate-800 text-clinic-text/70 dark:text-white/70 hover:bg-clinic-teal/10"
              )}
            >
              All Cities
            </button>
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city as string)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  selectedCity === city
                    ? "bg-clinic-teal text-white"
                    : "bg-white dark:bg-slate-800 text-clinic-text/70 dark:text-white/70 hover:bg-clinic-teal/10"
                )}
              >
                {city}
              </button>
            ))}
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-clinic-text/60 dark:text-white/60">
            Showing{" "}
            <span className="font-semibold text-clinic-navy dark:text-white">
              {filteredClinics.length}
            </span>{" "}
            {filteredClinics.length === 1 ? "clinic" : "clinics"}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 bg-white dark:bg-slate-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Clinics Grid */}
        {!isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClinics.map((clinic, index) => (
              <div
                key={clinic.id}
                className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-glass border border-clinic-navy/5 dark:border-white/5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="h-2 bg-gradient-to-r from-clinic-teal to-clinic-ai" />

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-clinic-navy/10 to-clinic-teal/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Building2 className="w-7 h-7 text-clinic-navy dark:text-white" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg text-clinic-navy dark:text-white group-hover:text-clinic-teal transition-colors">
                          {clinic.name}
                        </h3>
                        {clinic.city && (
                          <p className="flex items-center gap-1 text-sm text-clinic-text/60 dark:text-white/60">
                            <MapPin className="w-3 h-3" />
                            {clinic.city}
                          </p>
                        )}
                      </div>
                    </div>
                    {clinic.subscription_plan === "professional" && (
                      <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-clinic-ai/10 text-clinic-ai rounded-full">
                        <BadgeCheck className="w-3 h-3" />
                        Pro
                      </span>
                    )}
                  </div>

                  {clinic.description && (
                    <p className="text-sm text-clinic-text/70 dark:text-white/70 mb-4 line-clamp-2">
                      {clinic.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 p-3 bg-clinic-bg dark:bg-slate-700/50 rounded-xl">
                      <Stethoscope className="w-4 h-4 text-clinic-teal" />
                      <div>
                        <p className="text-xs text-clinic-text/50 dark:text-white/50">
                          Services
                        </p>
                        <p className="font-semibold text-clinic-navy dark:text-white">
                          {clinic.clinic_services?.length || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-clinic-bg dark:bg-slate-700/50 rounded-xl">
                      <Users className="w-4 h-4 text-clinic-ai" />
                      <div>
                        <p className="text-xs text-clinic-text/50 dark:text-white/50">
                          Doctors
                        </p>
                        <p className="font-semibold text-clinic-navy dark:text-white">
                          {clinic.practitioners?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {clinic.clinic_services &&
                    clinic.clinic_services.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {clinic.clinic_services.slice(0, 2).map((service) => (
                            <span
                              key={service.id}
                              className="text-xs px-2 py-1 bg-clinic-teal/10 text-clinic-teal rounded-full"
                            >
                              {service.name}
                            </span>
                          ))}
                          {clinic.clinic_services.length > 2 && (
                            <span className="text-xs px-2 py-1 bg-clinic-navy/10 text-clinic-navy dark:bg-white/10 dark:text-white rounded-full">
                              +{clinic.clinic_services.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                  <Link
                    href={`/clinics/${generateSlug(clinic.name)}-${clinic.id.slice(0, 8)}`}
                  >
                    <Button className="w-full bg-clinic-navy hover:bg-clinic-navy/90 text-white group/btn">
                      View Clinic
                      <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && filteredClinics.length === 0 && (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-clinic-navy/20 mx-auto mb-4" />
            <h3 className="text-xl font-display font-bold text-clinic-navy dark:text-white mb-2">
              No clinics found
            </h3>
            <p className="text-clinic-text/60 dark:text-white/60 mb-6">
              Try adjusting your search or filters
            </p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedCity(null);
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-clinic-navy to-clinic-navy/90 rounded-2xl p-12">
            <h2 className="font-display text-3xl font-bold text-white mb-4">
              Are You a Healthcare Provider?
            </h2>
            <p className="text-white/70 mb-8 max-w-xl mx-auto">
              Join our network of AI-powered clinics and transform your patient
              experience with MediFlow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
                asChild
              >
                <Link href="/clinic/register">Register Your Clinic</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/demo">Request Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-clinic-navy/5 dark:border-white/5 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-clinic-text/60 dark:text-white/60">
            © 2024{" "}
            <Link href="/" className="text-clinic-teal hover:underline">
              MediFlow
            </Link>{" "}
            • AI-Powered Healthcare Platform
          </p>
        </div>
      </footer>

      <PatientChatbot />
    </div>
  );
}
