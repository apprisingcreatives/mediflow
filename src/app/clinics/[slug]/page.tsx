"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Users,
  Stethoscope,
  ArrowLeft,
  Calendar,
  Star,
  BadgeCheck,
  Shield,
  Sparkles,
  ChevronRight,
  CheckCircle,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ClinicChatbot } from "@/components/chatbot/clinic-chatbot";
import { useAuth } from "@/hooks/use-auth";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  currency: string;
}

interface Practitioner {
  id: string;
  name: string;
  email: string | null;
  specialization: string | null;
  bio: string | null;
  image_url: string | null;
}

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
  clinic_services: Service[];
  practitioners: Practitioner[];
}

export default function ClinicPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { user, patient } = useAuth();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"services" | "doctors">("services");

  const handleBooking = (serviceId?: string, serviceName?: string, practitionerId?: string, practitionerName?: string) => {
    if (!clinic) return;
    
    let bookingUrl = `/book?clinic=${clinic.id}&clinicName=${encodeURIComponent(clinic.name)}`;
    
    if (serviceId && serviceName) {
      bookingUrl += `&service=${serviceId}&serviceName=${encodeURIComponent(serviceName)}`;
    }
    
    if (practitionerId && practitionerName) {
      bookingUrl += `&practitioner=${practitionerId}&practitionerName=${encodeURIComponent(practitionerName)}`;
    }
    
    // If user is not logged in, redirect to login first
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(bookingUrl)}`);
      return;
    }
    
    // If patient hasn't completed onboarding, redirect to onboarding
    if (patient && !patient.onboarding_completed) {
      router.push(`/patient/onboarding?redirect=${encodeURIComponent(bookingUrl)}`);
      return;
    }
    
    router.push(bookingUrl);
  };

  useEffect(() => {
    if (slug) {
      fetchClinic();
    }
  }, [slug]);

  const fetchClinic = async () => {
    try {
      // Extract the ID from slug (format: clinic-name-12345678)
      const parts = slug.split("-");
      const clinicId = parts[parts.length - 1];
      
      // Check if it looks like a UUID prefix
      const isIdAtEnd = /^[0-9a-f]{8}$/i.test(clinicId);
      
      const searchParam = isIdAtEnd 
        ? `${clinicId}-${clinicId}-${clinicId}-${clinicId}-${clinicId}${clinicId}${clinicId}${clinicId}`.slice(0, 36) 
        : slug;

      // Try different approaches to find the clinic
      let res = await fetch(`/api/clinics/${slug}`);
      
      if (!res.ok) {
        // Try with just the ID if we extracted one
        if (isIdAtEnd) {
          // Get all clinics and find by partial ID match
          const allRes = await fetch("/api/clinics");
          const allData = await allRes.json();
          const foundClinic = allData.clinics?.find((c: Clinic) => 
            c.id.startsWith(clinicId)
          );
          if (foundClinic) {
            setClinic(foundClinic);
            setIsLoading(false);
            return;
          }
        }
        setError("Clinic not found");
        return;
      }

      const data = await res.json();
      setClinic(data.clinic);
    } catch (err) {
      console.error("Failed to fetch clinic:", err);
      setError("Failed to load clinic");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-clinic-bg dark:bg-slate-900">
        <div className="container mx-auto px-4 py-20">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 bg-clinic-navy/10 dark:bg-white/10 rounded-lg" />
            <div className="h-64 bg-clinic-navy/10 dark:bg-white/10 rounded-2xl" />
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-clinic-navy/10 dark:bg-white/10 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className="min-h-screen bg-clinic-bg dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-clinic-navy/20 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-clinic-navy dark:text-white mb-2">
            Clinic Not Found
          </h1>
          <p className="text-clinic-text/60 dark:text-white/60 mb-6">
            {error || "The clinic you're looking for doesn't exist."}
          </p>
          <Button asChild>
            <Link href="/#partner-clinics">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Clinics
            </Link>
          </Button>
        </div>
      </div>
    );
  }

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
            <Button
              variant="ghost"
              asChild
              className="text-clinic-text/60 hover:text-clinic-navy"
            >
              <Link href="/#partner-clinics">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Clinics
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-clinic-navy via-clinic-navy/95 to-clinic-navy overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-clinic-teal rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-80 h-80 bg-clinic-ai rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Clinic Icon */}
            <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Building2 className="w-12 h-12 text-white" />
            </div>

            {/* Clinic Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-3xl md:text-4xl font-bold text-white">
                  {clinic.name}
                </h1>
                {clinic.subscription_plan === "professional" && (
                  <span className="flex items-center gap-1 text-xs font-medium px-3 py-1 bg-clinic-ai/20 text-clinic-ai rounded-full border border-clinic-ai/30">
                    <BadgeCheck className="w-3 h-3" />
                    Verified Partner
                  </span>
                )}
              </div>

              {clinic.description && (
                <p className="text-white/70 text-lg mb-4 max-w-2xl">
                  {clinic.description}
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-white/80">
                {clinic.city && (
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-clinic-teal" />
                    {clinic.address ? `${clinic.address}, ${clinic.city}` : clinic.city}
                  </span>
                )}
                {clinic.phone && (
                  <a
                    href={`tel:${clinic.phone}`}
                    className="flex items-center gap-2 hover:text-clinic-teal transition-colors"
                  >
                    <Phone className="w-4 h-4 text-clinic-teal" />
                    {clinic.phone}
                  </a>
                )}
                {clinic.email && (
                  <a
                    href={`mailto:${clinic.email}`}
                    className="flex items-center gap-2 hover:text-clinic-teal transition-colors"
                  >
                    <Mail className="w-4 h-4 text-clinic-teal" />
                    {clinic.email}
                  </a>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
                onClick={() => handleBooking()}
              >
                <Calendar className="w-5 h-5 mr-2" />
                {user ? "Book Appointment" : "Sign in to Book"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => clinic.phone ? window.location.href = `tel:${clinic.phone}` : clinic.email ? window.location.href = `mailto:${clinic.email}` : null}
              >
                <Phone className="w-5 h-5 mr-2" />
                Contact Clinic
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-clinic-teal/20 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-clinic-teal" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Services</p>
                  <p className="text-white text-xl font-bold">
                    {clinic.clinic_services?.length || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-clinic-ai/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-clinic-ai" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Doctors</p>
                  <p className="text-white text-xl font-bold">
                    {clinic.practitioners?.length || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Insured</p>
                  <p className="text-white text-xl font-bold">Yes</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">AI-Powered</p>
                  <p className="text-white text-xl font-bold">Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-clinic-navy/10 dark:border-white/10">
          <button
            onClick={() => setActiveTab("services")}
            className={cn(
              "pb-4 px-2 text-sm font-medium transition-all relative",
              activeTab === "services"
                ? "text-clinic-teal"
                : "text-clinic-text/60 hover:text-clinic-navy dark:text-white/60 dark:hover:text-white"
            )}
          >
            <span className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              Services & Pricing
            </span>
            {activeTab === "services" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-clinic-teal rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("doctors")}
            className={cn(
              "pb-4 px-2 text-sm font-medium transition-all relative",
              activeTab === "doctors"
                ? "text-clinic-teal"
                : "text-clinic-text/60 hover:text-clinic-navy dark:text-white/60 dark:hover:text-white"
            )}
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Our Doctors
            </span>
            {activeTab === "doctors" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-clinic-teal rounded-full" />
            )}
          </button>
        </div>

        {/* Services Tab */}
        {activeTab === "services" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clinic.clinic_services?.map((service, index) => (
              <div
                key={service.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-glass border border-clinic-navy/5 dark:border-white/5 hover:shadow-lg transition-all duration-300 group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-clinic-teal/10 to-clinic-ai/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Stethoscope className="w-6 h-6 text-clinic-teal" />
                  </div>
                  <span className="text-2xl font-bold text-clinic-teal">
                    ₱{service.price.toLocaleString()}
                  </span>
                </div>

                <h3 className="font-display font-bold text-lg text-clinic-navy dark:text-white mb-2">
                  {service.name}
                </h3>

                {service.description && (
                  <p className="text-sm text-clinic-text/60 dark:text-white/60 mb-4">
                    {service.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-clinic-text/50 dark:text-white/50">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {service.duration_minutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Available
                  </span>
                </div>

                <Button
                  className="w-full mt-4 bg-clinic-navy hover:bg-clinic-navy/90 text-white"
                  onClick={() => handleBooking(service.id, service.name)}
                >
                  {user ? "Book This Service" : "Sign in to Book"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ))}

            {(!clinic.clinic_services || clinic.clinic_services.length === 0) && (
              <div className="col-span-full text-center py-12">
                <Stethoscope className="w-12 h-12 text-clinic-navy/20 mx-auto mb-4" />
                <p className="text-clinic-text/60 dark:text-white/60">
                  No services listed yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Doctors Tab */}
        {activeTab === "doctors" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clinic.practitioners?.map((doctor, index) => (
              <div
                key={doctor.id}
                className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-glass border border-clinic-navy/5 dark:border-white/5 hover:shadow-lg transition-all duration-300 group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Doctor Image/Avatar */}
                <div className="h-48 bg-gradient-to-br from-clinic-navy/10 to-clinic-teal/10 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Users className="w-12 h-12 text-clinic-navy/30 dark:text-white/30" />
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-display font-bold text-lg text-clinic-navy dark:text-white mb-1">
                    {doctor.name}
                  </h3>

                  {doctor.specialization && (
                    <p className="text-clinic-teal font-medium text-sm mb-3">
                      {doctor.specialization}
                    </p>
                  )}

                  {doctor.bio && (
                    <p className="text-sm text-clinic-text/60 dark:text-white/60 mb-4 line-clamp-2">
                      {doctor.bio}
                    </p>
                  )}

                  <Button
                    variant="outline"
                    className="w-full border-clinic-teal text-clinic-teal hover:bg-clinic-teal hover:text-white"
                    onClick={() => handleBooking(undefined, undefined, doctor.id, doctor.name)}
                  >
                    {user ? `Book with ${doctor.name.split(" ")[0]}` : "Sign in to Book"}
                  </Button>
                </div>
              </div>
            ))}

            {(!clinic.practitioners || clinic.practitioners.length === 0) && (
              <div className="col-span-full text-center py-12">
                <Users className="w-12 h-12 text-clinic-navy/20 mx-auto mb-4" />
                <p className="text-clinic-text/60 dark:text-white/60">
                  No doctors listed yet.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-clinic-navy/5 dark:border-white/5 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-clinic-text/60 dark:text-white/60">
            Powered by{" "}
            <Link href="/" className="text-clinic-teal hover:underline">
              MediFlow
            </Link>{" "}
            • AI-Powered Healthcare Platform
          </p>
        </div>
      </footer>

      {/* Clinic-Specific Chatbot */}
      <ClinicChatbot clinic={clinic} />
    </div>
  );
}
