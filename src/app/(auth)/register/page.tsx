"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Eye,
  EyeOff,
  Shield,
  Sparkles,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  currency: string;
}

interface Clinic {
  id: string;
  name: string;
  description: string | null;
  clinic_services: Service[];
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, user, isLoading: authLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [clinicLoading, setClinicLoading] = useState(false);

  const redirectUrl = searchParams.get("redirect") || "/patient/onboarding";
  const clinicId = searchParams.get("clinic");

  useEffect(() => {
    if (user && !authLoading) {
      router.push(redirectUrl);
    }
  }, [user, authLoading, router, redirectUrl]);

  useEffect(() => {
    if (clinicId) {
      fetchClinic();
    }
  }, [clinicId]);

  const fetchClinic = async () => {
    if (!clinicId) return;

    setClinicLoading(true);
    try {
      const res = await fetch(`/api/clinics/${clinicId}`);
      if (res.ok) {
        const data = await res.json();
        setClinic(data.clinic);
      }
    } catch (error) {
      console.error("Failed to fetch clinic:", error);
    } finally {
      setClinicLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreeToTerms) {
      setError(
        "Please agree to the Terms of Service and Privacy Policy to continue."
      );
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(
      email,
      password,
      firstName,
      lastName,
      clinicId || undefined
    );

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      setSuccess(true);
      // For email confirmation flow
      setTimeout(() => {
        router.push(redirectUrl);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Clinic Services */}
      {clinicId && (
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-clinic-navy via-clinic-navy to-slate-800 p-16 items-start justify-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-clinic-teal/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-clinic-ai/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 text-white max-w-lg w-full">
            {clinicLoading ? (
              <div className="space-y-4">
                <div className="h-8 bg-white/10 rounded-lg animate-pulse" />
                <div className="h-4 bg-white/10 rounded animate-pulse" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-white/10 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              </div>
            ) : clinic ? (
              <>
                <h2 className="font-display text-3xl font-bold mb-2">
                  Register with {clinic.name}
                </h2>
                {clinic.description && (
                  <p className="text-white/70 text-lg mb-8">
                    {clinic.description}
                  </p>
                )}

                <div className="space-y-4">
                  <h3 className="font-semibold text-xl mb-4">
                    Available Services
                  </h3>
                  {clinic.clinic_services &&
                  clinic.clinic_services.length > 0 ? (
                    clinic.clinic_services.slice(0, 4).map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center gap-4 p-4 bg-white/5 rounded-xl"
                      >
                        <div className="w-10 h-10 rounded-full bg-clinic-teal/20 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-clinic-teal" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{service.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-white/60">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {service.duration_minutes} min
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />₱{service.price}
                            </span>
                          </div>
                          {service.description && (
                            <p className="text-xs text-white/50 mt-1">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-clinic-teal/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-clinic-teal" />
                      </div>
                      <div>
                        <h4 className="font-semibold">AI-Powered Care</h4>
                        <p className="text-sm text-white/60">
                          Advanced healthcare services
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center">
                <h2 className="font-display text-3xl font-bold mb-4">
                  Register as Patient
                </h2>
                <p className="text-white/70 text-lg">
                  Create your account to access healthcare services
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right Panel - Form */}
      <div
        className={`${clinicId ? "flex-1" : "w-full"} flex items-center justify-center p-8 lg:p-16 bg-white dark:bg-slate-900`}
      >
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-clinic-navy to-clinic-teal">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-clinic-navy dark:text-white">
              MediFlow
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-clinic-navy dark:text-white mb-2">
              Create your account
            </h1>
          </div>

          {success && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-3 text-green-700 dark:text-green-400">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Account created successfully!</p>
                <p className="text-sm opacity-80">
                  Redirecting to complete your profile...
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  className="h-12"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  className="h-12"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className="h-12 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-clinic-text/40 hover:text-clinic-text/60"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-clinic-text/50 dark:text-white/50">
                Must be at least 8 characters with a number and symbol
              </p>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) =>
                  setAgreeToTerms(checked as boolean)
                }
                className="mt-1"
              />
              <Label
                htmlFor="terms"
                className="text-sm font-normal leading-relaxed cursor-pointer"
              >
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="text-clinic-teal hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-clinic-teal hover:underline"
                >
                  Privacy Policy
                </Link>
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-clinic-teal hover:bg-clinic-teal/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Creating account...
                </div>
              ) : (
                "Create free account"
              )}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-clinic-navy/10 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-slate-900 text-clinic-text/40 dark:text-white/40">
                or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-12">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button variant="outline" className="h-12">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
              </svg>
              Apple
            </Button>
          </div>

          <p className="text-center text-sm text-clinic-text/60 dark:text-white/60 mt-8">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-clinic-teal hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
          <div className="animate-pulse text-clinic-navy dark:text-white">
            Loading...
          </div>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
